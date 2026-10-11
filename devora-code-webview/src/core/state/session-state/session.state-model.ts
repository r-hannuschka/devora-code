import type { TimeEntry } from '@devora-code/api';

export interface SessionStateModel {
  activeSession: TimeEntry | null;
}
