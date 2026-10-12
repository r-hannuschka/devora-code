import { Selector } from '@ngxs/store';
import type { SessionStateModel } from './session.state-model';
import { SessionState } from './session.state';
import type { TimeEntry } from '@devora-code/api';

export class SessionStateSelectors {
  @Selector([SessionState])
  static activeSession(ctx: SessionStateModel | undefined) {
    return ctx?.activeSession ?? null; 
  }

  @Selector([SessionStateSelectors.activeSession])
  static activeSessionKey(ctx: TimeEntry | null) {
    return ctx?.issueKey ?? null; 
  }

  @Selector([SessionStateSelectors.activeSession])
  static activeSessionStartAt(ctx: TimeEntry | null) {
    return ctx?.startAt ?? null; 
  }
}
