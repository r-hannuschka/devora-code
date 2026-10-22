import { SessionApi } from '@/core/api';
import { inject, Injectable } from '@angular/core';
import { Action, State, type NgxsOnInit, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { tap } from 'rxjs';
import {
  FetchActiveSession,
  PauseSession,
  ResumeSession,
  SessionPaused,
  SessionResumed,
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
  private readonly sessionApi = inject(SessionApi);

  ngxsOnInit(ctx: StateContext<SessionStateModel>): void {
    ctx.dispatch(new FetchActiveSession());
  }

  @Action(FetchActiveSession)
  protected fetchActiveTimer(ctx: StateContext<SessionStateModel>) {
    return this.sessionApi
      .getActiveTimer()
      .pipe(tap((timer) => ctx.setState(patch({ activeSession: timer }))));
  }

  @Action(StartSession)
  protected startTracking(ctx: StateContext<SessionStateModel>, { payload }: StartSession) {
    return this.sessionApi.startTracking(payload.issueKey).pipe(
      tap((session) => {
        ctx.setState(patch({ activeSession: session }));
        ctx.dispatch(new SessionStarted(structuredClone(session)));
      }),
    );
  }

  @Action(StopSession)
  protected stopTracking(ctx: StateContext<SessionStateModel>) {
    return this.sessionApi
      .stopTracking()
      .pipe(tap(() => ctx.setState(patch({ activeSession: null }))));
  }

  @Action(PauseSession)
  protected pauseTracking(ctx: StateContext<SessionStateModel>) {
    return this.sessionApi.pauseSession().pipe(
      tap((activeSession) => {
        ctx.setState(patch({ activeSession }));

        if (activeSession) {
          ctx.dispatch(new SessionPaused());
        }
      }),
    );
  }

  @Action(ResumeSession)
  protected resumeTracking(ctx: StateContext<SessionStateModel>) {
    return this.sessionApi.resumeSession().pipe(
      tap((activeSession) => {
        ctx.setState(patch({ activeSession }));
        if (activeSession) {
          ctx.dispatch(new SessionResumed());
        }
      }),
    );
  }
}
