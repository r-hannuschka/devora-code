import type { TimeEntry } from '@devora-code/api/core';

export interface SessionStateModel {
  activeSession: TimeEntry | null;
}
