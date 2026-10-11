import type { TimeEntry } from '@devora-code/api';

export interface TimetrackerStateModel {
  monthData: Record<string, TimeEntry[]> | null;
}
