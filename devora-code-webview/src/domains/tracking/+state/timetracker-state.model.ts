import type { TimeEntry, TimesData } from '@devora-code/api/core';

export interface TimetrackerStateModel {
  monthData: Record<string, TimeEntry[]> | null;

  trackedToday: TimeEntry[] | null;
}
