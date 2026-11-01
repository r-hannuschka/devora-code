import { TimesheetApi } from '@/core/api';
import { computed, effect, inject, linkedSignal, Service, signal } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  getWeek,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { filter, switchMap, take } from 'rxjs';
import { AddTimeEntryOverlay } from './components/add-entry-overlay/add-time-entry.overlay';
import { TimesheetDatasource } from './data/timesheet-datasource';
import { PaginationController } from '@/common/pagination';

export enum ViewMode {
  Day,
  Week,
  Month,
}

@Service({ autoProvided: false })
export class TimesheetGridService {
  private readonly timesheetApi = inject(TimesheetApi);
  private readonly addTimeEntryService = inject(AddTimeEntryOverlay);
  private readonly paginationController = inject(PaginationController)

  private readonly dataSource = new TimesheetDatasource(this.timesheetApi);
  private readonly currentViewMode = signal<ViewMode>(ViewMode.Day);
  private readonly selectedDate = signal(new Date());

  private readonly dateRange = linkedSignal<{ startAt: string; endAt: string } | null>(() => {
    const viewMode = this.currentViewMode();

    let startDate = this.selectedDate();
    let endDate = startDate;

    switch (viewMode) {
      case ViewMode.Week: {
        startDate = startOfWeek(startDate, { weekStartsOn: 1 });
        endDate = addDays(startDate, 6);
        break;
      }

      case ViewMode.Month: {
        startDate = startOfMonth(startDate);
        endDate = endOfMonth(startDate);
        break;
      }
    }

    return {
      startAt: format(startDate, 'yyyy-MM-dd'),
      endAt: format(endDate, 'yyyy-MM-dd'),
    };
  });

  protected readonly dateRangeEffect = effect(() => {
    const range = this.dateRange();
    if (range) {
      const { startAt, endAt } = range;
      this.dataSource.setRange(startAt, endAt);
    }
  });

  protected readonly pageChangedEffect = effect(() => {
    const page = this.paginationController.pageChange();
    this.dataSource.setPage(page);
  })

  protected readonly dataEffect = effect(() => {
    const entries = this.dataSource.data();

    this.paginationController.update({
      total: entries.pages,
      page: entries.page
    })
  })

  readonly currentView = computed(() => this.currentViewMode());
  readonly timeentries = computed(() => this.dataSource.data());

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

  readonly sumLabel = computed(() => {
    return this.currentViewMode() === ViewMode.Week ? 'Wochensumme' : 'Tages-Summe';
  });

  // --- Helpers ---

  // das gehoert hier nich rein
  formatTime(isoString: string): string {
    return format(new Date(isoString), 'HH:mm');
  }

  // das gehoert hier nich rein
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
    this.selectedDate.update((date) => {
      switch (this.currentViewMode()) {
        case ViewMode.Month:
          return addMonths(date, 1);
        case ViewMode.Week:
          return addWeeks(date, 1);
        default:
          return addDays(date, 1);
      }
    });
  }

  prev() {
    this.selectedDate.update((date) => {
      switch (this.currentViewMode()) {
        case ViewMode.Month:
          return subMonths(date, 1);
        case ViewMode.Week:
          return subWeeks(date, 1);
        default:
          return subDays(date, 1);
      }
    });
  }

  loadPage(page: number) {
    this.dataSource.setPage(page);
  }

  reload() {
    this.dataSource.reload();
  }

  open() {
    const { startAt, endAt: endAt } = this.dateRange() ?? {};
    if (!startAt || !endAt) {
      return;
    }
    this.timesheetApi.openTimesheet({ startAt, endAt });
  }

  search(value: string) {
    this.dataSource.setSearch(value);
  }

  openAsCSV() {
    throw new Error('Method not implemented.');
  }

  openTimeEntryOverlay() {
    const overlay = this.addTimeEntryService.open();

    overlay
      .afterClosed()
      .pipe(
        take(1),
        filter((result): result is TimeEntry => result !== null),
        switchMap((result) => this.timesheetApi.addEntry(result as any)),
      )
      .subscribe(() => this.dataSource.reload());
  }
}
