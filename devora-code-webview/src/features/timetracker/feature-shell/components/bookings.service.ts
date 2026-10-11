import { computed, inject, linkedSignal, Service, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TimeTrackerApi } from '@/core/api';
import { differenceInSeconds, format, getWeek, getYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { addDays, startOfWeek, subDays } from 'date-fns';

export enum ViewMode {
  Day,
  Week,
}

@Service({ autoProvided: false })
export class BookingsDatasource {
  private readonly tracker = inject(TimeTrackerApi);

  private readonly currentViewMode = signal<ViewMode>(ViewMode.Week);
  private readonly selectedDate = signal(new Date());

  private readonly dateRange = linkedSignal<{ startAt: string; endAt: string } | null>(() => {
    const viewMode = this.currentViewMode();

    let startDate = this.selectedDate();
    let endDate = startDate;

    if (viewMode === ViewMode.Week) {
      startDate = startOfWeek(startDate, { weekStartsOn: 1 });
      endDate = addDays(startDate, 6);
    }

    return {
      startAt: format(startDate, 'yyyy-MM-dd'),
      endAt: format(endDate, 'yyyy-MM-dd'),
    };
  });

  private readonly bookingResource = rxResource({
    params: () => ({ range: this.dateRange() }),
    stream: ({ params }) => {
      const { startAt, endAt } = params.range ?? {};
      if (!startAt) {
        throw new Error('Es wurde kein Startdatum uebergeben');
      }
      return this.tracker.getPeriod(startAt, endAt);
    },
  });

  readonly currentView = computed(() => this.currentViewMode());

  readonly period = computed(() => this.dateRange());

  // --- Labels ---

  readonly periodLabel = computed(() => {
    const range = this.dateRange();
    if (!range) return '';

    const start = new Date(range.startAt);
    const end = new Date(range.endAt);

    if (this.currentViewMode() === ViewMode.Week) {
      const year = getWeek(start, { weekStartsOn: 1 });
      return `KW ${year} (${format(start, 'dd. MMM', { locale: de })}–${format(end, 'dd. MMM', { locale: de })})`;
    }

    return format(start, 'EEEE, dd. MMMM', { locale: de });
  });

  readonly sum = computed(() => {
    const entries = this.bookings();
    const totalSeconds = entries.reduce((sum, entry) => {
      if (!entry.endAt) return sum;
      const duration = differenceInSeconds(entry.endAt, entry.startAt);
      if (duration < 444) return sum;
      return sum + Math.round(duration / 900) * 15 * 60;
    }, 0);

    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: String(Math.round((totalSeconds % 3600) / 60)).padStart(2, '0'),
    };
  });

  readonly sumLabel = computed(() => {
    return this.currentViewMode() === ViewMode.Week ? 'Wochensumme' : 'Tages-Summe';
  });

  readonly emptyLabel = computed(() => {
    const view = this.currentViewMode();
    return view === ViewMode.Week
      ? `Keine Zeiteinträge für ${this.periodLabel()}`
      : `Keine Zeiteinträge für ${this.periodLabel()}`;
  });

  readonly bookings = computed(() => {
    const resource = this.bookingResource;
    if (resource.isLoading()) {
      return [];
    }

    if (resource.error()) {
      return [];
    }

    return resource.value()?.entries ?? [];
  });

  // Aliases for template convenience
  readonly entries = this.bookings;

  // --- Helpers ---

  formatTime(isoString: string): string {
    return format(new Date(isoString), 'HH:mm');
  }

  formatDuration(startAt: string, endAt: string | null): string {
    const start = new Date(startAt).getTime();
    const end = endAt ? new Date(endAt).getTime() : Date.now();
    const diffMinutes = Math.floor((end - start) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours === 0) {
      return `${minutes}min`;
    }

    return `${hours}h ${minutes}min`;
  }

  goToToday() {
    this.selectedDate.set(new Date());
  }

  toggleViewMode(mode: ViewMode) {
    this.currentViewMode.set(mode);
  }

  next() {
    const nextDate =
      this.currentViewMode() === ViewMode.Week
        ? addDays(this.selectedDate(), 7)
        : addDays(this.selectedDate(), 1);

    this.selectedDate.set(nextDate);
  }

  prev() {
    const prevDate =
      this.currentViewMode() === ViewMode.Week
        ? subDays(this.selectedDate(), 7)
        : subDays(this.selectedDate(), 1);

    this.selectedDate.set(prevDate);
  }

  reload() {
    this.bookingResource.reload();
  }
}
