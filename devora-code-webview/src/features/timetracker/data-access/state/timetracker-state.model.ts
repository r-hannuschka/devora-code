import type { TimeEntry } from '@devora-code/api/core';

export interface TimetrackerStateModel {
  monthData: Record<string, TimeEntry[]> | null;
}
