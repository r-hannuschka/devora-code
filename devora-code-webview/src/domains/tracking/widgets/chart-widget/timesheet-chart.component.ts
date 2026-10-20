import { DEVORA_CODE_WIDGET, type DevoraCodeWidget, type DevoraCodeWidgetAction } from '@/common';
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ChartConfiguration, ChartType } from 'chart.js';
import { differenceInSeconds, format, getDaysInMonth } from 'date-fns';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { FetchMonth } from '../../+state/timetracker-state.actions';
import { TimetrackerStateSelectors } from '../../+state/timetracker-state.selectors';

@Component({
  selector: 'devora-code-timesheet-chart-widget',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [
    provideCharts(withDefaultRegisterables()),
    {
      provide: DEVORA_CODE_WIDGET,
      useExisting: TimesheetChartComponent,
    },
  ],
  templateUrl: './timesheet-chart.component.html',
})
export class TimesheetChartComponent implements DevoraCodeWidget {
  private readonly store = inject(Store);
  private readonly monthlyData = this.store.selectSignal(TimetrackerStateSelectors.monthData);
  private readonly currentDate = signal(new Date());

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  readonly actions: DevoraCodeWidgetAction[] = [
    {
      key: '[Bookings]: reload',
      icon: 'devora-code-icon-refresh',
    },
  ];

  readonly title = 'Erfasste Zeiten';

  actionDispatched({ key }: DevoraCodeWidgetAction): void {
    if (key === '[Bookings]: reload') {
      this.fetchMonthData();
    }
  }

  protected readonly currentMonthLabel = computed(() => {
    return format(this.currentDate(), 'MMMM yyyy');
  });

  public lineChartType: ChartType = 'line';

  constructor() {
    effect(() => {
      this.lineChartData(); // Registriert die Abhängigkeit zum Signal

      // Wenn die Chart-Direktive im DOM bereit ist, zwingen wir sie zum Update
      if (this.chart) {
        this.chart.update();
      }
    });
  }

  attached(): void {
    this.fetchMonthData();
  }

  protected readonly hoursPerDay = computed(() => {
    const monthlyData = this.monthlyData();
    const daysOfMonth = getDaysInMonth(this.currentDate());

    const chartData = new Array(daysOfMonth).fill(0);
    if (!monthlyData) {
      return chartData;
    }

    const month = format(this.currentDate(), 'yyyy-MM');
    for (let i = 1, ln = daysOfMonth; i <= ln; i++) {
      const bookings = monthlyData[`${month}-${i.toString().padStart(2, '0')}`];
      if (!bookings) {
        continue;
      }

      const totalMinutesWorked = bookings.reduce<number>((minutes, timeEntry) => {
        if (!timeEntry.endAt) {
          return minutes;
        }

        // 1. Echte SEKUNDEN berechnen
        const diffInSeconds = differenceInSeconds(timeEntry.endAt, timeEntry.startAt);

        // 2. FILTER: 7.4 Minuten = 444 Sekunden. Alles darunter fliegt raus!
        if (diffInSeconds < 444) {
          return minutes;
        }

        // 3. Wenn es über der Grenze ist, rechnen wir in Minuten um
        const diffInMinutes = diffInSeconds / 60;

        // 4. Kaufmännisch auf den nächsten 15-Minuten-Block runden
        const roundedMinutes = Math.round(diffInMinutes / 15) * 15;

        // Da wir erst ab 7.4 Minuten einsteigen, runden alle Werte zwischen
        // 7.4 und 14.9 Minuten automatisch auf exakt 15 Minuten auf!
        return minutes + roundedMinutes;
      }, 0);

      // 3. In Stunden umrechnen
      const hoursWorked = totalMinutesWorked / 60;
      chartData[i - 1] = Math.round(hoursWorked * 100) / 100;
    }

    return chartData;
  });

  public lineChartData = computed((): ChartConfiguration['data'] => {
    const data = this.hoursPerDay();
    const labels = Array.from({ length: data.length }, (_, index) => String(index + 1));

    return {
      datasets: [
        {
          data,
          label: this.currentMonthLabel(),
          backgroundColor: 'rgba(38, 132, 255, 0.08)', // Sehr zartes Blau für die Fläche
          borderColor: 'rgba(38, 132, 255, 1)', // Kräftiges Blau für die Linie
          pointBackgroundColor: 'rgba(38, 132, 255, 1)', // Blau für die Punkte
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'rgba(38, 132, 255, 1)',
          fill: 'origin',
        },
      ],
      labels,
    };
  });

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          // Diese Funktion bestimmt, welche Labels gedruckt werden
          callback: function (val, index) {
            const day = index + 1; // Da Index bei 0 startet
            // Nur anzeigen, wenn es der 1., 8., 15., 22. oder 29. Tag ist
            if (day === 1 || day === 8 || day === 15 || day === 22 || day === 29 || day === 31) {
              return day + '.'; // Zeigt z.B. "8." an
            }
            return null; // Blendet die Tage dazwischen auf der Achse aus
          },
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          // Zeichnet feine vertikale Gitterlinien NUR an den Wochen-Meilensteinen
          color: (context) => {
            const day = context.index + 1;
            return day === 1 || day === 8 || day === 15 || day === 22 || day === 29
              ? 'rgba(0, 0, 0, 0.1)'
              : 'transparent';
          },
        },
      },
      y: { beginAtZero: true },
    },
  };

  private fetchMonthData(): void {
    const month = format(this.currentDate(), 'yyyy-MM');
    this.store.dispatch(new FetchMonth({ month }));
  }
}
