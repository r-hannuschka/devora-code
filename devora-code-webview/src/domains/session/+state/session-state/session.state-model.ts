import type { ActiveSession } from '@devora-code/api/session';

export interface SessionStateModel {
  activeSession: ActiveSession | null;
}
