import { computed, inject, Service, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TimesheetApi } from '@/core/api';
import { differenceInSeconds } from 'date-fns';
import { of } from 'rxjs';
import type { TimeEntryList } from '@devora-code/api/timesheet';

/**
 * Service für Timesheet-Abfragen.
 *
 * Liefert Zeiteinträge für Perioden (Woche/Monat) über rxResource.
 */
@Service()
export class TimeTrackerService {
  private readonly timesheet = inject(TimesheetApi);

  readonly periode = signal<{ startDate: string; endDate: string } | null>(null);
  readonly suche = signal<string>('');

  /** Zeiteinträge für den aktuellen Zeitraum */
  readonly entries = rxResource({
    params: () => this.periode(),
    stream: ({ params }) => {
      if (!params?.startDate) {
        const emptyList: TimeEntryList = {
          entries: [],
          count: 0,
          totalSeconds: 0,
        };
        return of(emptyList);
      }
      return this.timesheet.getPeriod(params.startDate, params.endDate);
    },
  });

  /** Gemappte Einträge mit Filter und Berechnungen */
  readonly data = computed(() => {
    const resource = this.entries;

    if (resource.isLoading()) {
      return [];
    }

    if (resource.error()) {
      return [];
    }

    const suche = this.suche().trim().toLocaleLowerCase();
    const raw = resource.value()?.entries ?? [];

    // Filter: nur Einträge > 7 Minuten (444 Sekunden)
    const filtered = raw.filter((e) => {
      if (!e.endAt) return false;
      const duration = differenceInSeconds(e.endAt, e.startAt);
      return duration >= 444;
    });

    if (!suche) {
      return filtered;
    }

    return filtered.filter(({ issueKey }) => {
      return issueKey.toLocaleLowerCase().includes(suche);
    });
  });
}
