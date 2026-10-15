import { inject, Injectable } from '@angular/core';
import { Action, State, type NgxsOnInit, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { tap } from 'rxjs';
import {
  FetchActiveSession,
  SessionStarted,
  StartSession,
  StopSession,
} from './session.state-actions';
import type { SessionStateModel } from './session.state-model';
import { SessionApi } from '@/core/session';

// SessionApi wird hier injiziert – keine Abhängigkeit mehr vom
// veralteten TimeTrackerApi.  SessionApi ist die
// offizielle Schnittstelle für Timer-Lifecycle-Operationen.

@State<SessionStateModel>({
  name: 'SessionState',
  defaults: {
    activeSession: null,
  },
})
@Injectable()
export class SessionState implements NgxsOnInit {
  private readonly session = inject(SessionApi);

  ngxsOnInit(ctx: StateContext<SessionStateModel>): void {
    ctx.dispatch(new FetchActiveSession());
  }

  @Action(FetchActiveSession)
  protected fetchActiveTimer(ctx: StateContext<SessionStateModel>) {
    return this.session
      .getActiveTimer()
      .pipe(tap((timer) => ctx.setState(patch({ activeSession: timer }))));
  }

  @Action(StartSession)
  protected startTracking(ctx: StateContext<SessionStateModel>, { payload }: StartSession) {
    return this.session.startTracking(payload.issueKey).pipe(
      tap((timeEntry) => {
        ctx.setState(patch({ activeSession: timeEntry }));
        ctx.dispatch(new SessionStarted(structuredClone(timeEntry)));
      }),
    );
  }

  @Action(StopSession)
  protected stopTracking(ctx: StateContext<SessionStateModel>) {
    return this.session
      .stopTracking()
      .pipe(tap(() => ctx.setState(patch({ activeSession: null }))));
  }
}
