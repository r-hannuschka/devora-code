import { inject, Injectable } from '@angular/core';
import { Action, State, type NgxsOnInit, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { tap } from 'rxjs';
import { TimeTrackerFlowFacade } from '../../api';
import {
  FetchActiveSession,
  SessionStarted,
  StartSession,
  StopSession,
} from './session.state-actions';
import type { SessionStateModel } from './session.state-model';

@State<SessionStateModel>({
  name: 'SessionState',
  defaults: {
    activeSession: null,
  },
})
@Injectable()
export class SessionState implements NgxsOnInit {
  private readonly tracker = inject(TimeTrackerFlowFacade);

  ngxsOnInit(ctx: StateContext<SessionStateModel>): void {
    ctx.dispatch(new FetchActiveSession());
  }

  @Action(FetchActiveSession)
  protected fetchActiveTimer(ctx: StateContext<SessionStateModel>) {
    return this.tracker
      .getActiveTimer()
      .pipe(tap((timer) => ctx.setState(patch({ activeSession: timer }))));
  }

  @Action(StartSession)
  protected startTracking(ctx: StateContext<SessionStateModel>, { payload }: StartSession) {
    return this.tracker.startTracking(payload.issueKey).pipe(
      tap((timeEntry) => {
        ctx.setState(patch({ activeSession: timeEntry }));
        ctx.dispatch(new SessionStarted(structuredClone(timeEntry)));
      }),
    );
  }

  @Action(StopSession)
  protected stopTracking(ctx: StateContext<SessionStateModel>) {
    return this.tracker
      .stopTracking()
      .pipe(tap(() => ctx.setState(patch({ activeSession: null }))));
  }
}
