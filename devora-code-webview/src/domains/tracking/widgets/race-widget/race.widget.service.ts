import { LoggerApi } from '@/core/api';
import { SessionStateSelectors } from '@/core/session';
import { TimesheetApi } from '@/core/timesheet';
import { computed, inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { differenceInMinutes, format, startOfDay } from 'date-fns';
import { EMPTY, map, of, timer } from 'rxjs';

@Service({ autoProvided: false })
export class RaceWidgetService {
  private readonly store = inject(Store);
  private readonly timesheetApi = inject(TimesheetApi);
  private readonly loggerApi = inject(LoggerApi);

  private readonly activeSession = this.store.selectSignal(SessionStateSelectors.activeSession);

  readonly trackedTodayResource = rxResource({
    stream: () => {
      const today = startOfDay(new Date());
      const day = format(today, 'yyyy-MM-dd');

      return this.timesheetApi.getPeriod(day, day).pipe(map((list) => list.entries));
    },
  });

  readonly trackedEntriesToday = computed(() => {
    const resource = this.trackedTodayResource;
    if (resource.isLoading()) {
      return null;
    }

    if (resource.error()) {
      this.loggerApi.error(
        `[Webview]: could not load timesheet range for day ${format(new Date(), 'yyyy-MM-dd')} `,
      );
      return null;
    }

    return resource.value();
  });

  readonly hasActiveSession = computed(() => !!this.activeSession());

  readonly tracked = computed(() => {
    const entries = this.trackedEntriesToday();

    if (!entries || entries.length === 0) {
      return 0;
    }

    const sumEntries = entries.reduce((minutes, { startAt, endAt }) => {
      if (!endAt) {
        return minutes;
      }

      const deltaMinutes = differenceInMinutes(endAt, startAt);
      return minutes + deltaMinutes;
    }, 0);

    return sumEntries;
  });

  readonly trackedToday = rxResource({ 
    params: () => ({ tracked: this.tracked(), activeSession: this.activeSession() }),
    stream: ({ params }) => {
      const { tracked, activeSession } = params;

      if (!activeSession) {
        return of(tracked);
      }

      return timer(0, 60 * 1_000).pipe(
        map(() => tracked + differenceInMinutes(new Date(), activeSession.startAt))
      );
    }
  })
}
