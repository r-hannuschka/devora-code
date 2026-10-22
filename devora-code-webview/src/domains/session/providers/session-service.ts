import { computed, inject, Service, Signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { SessionStateSelectors, StartSession, StopSession, PauseSession, ResumeSession } from '../+state';
import type { ActiveSession } from '@devora-code/api/session';

@Service()
export class SessionService {
  private readonly store = inject(Store);

  // --- Read ---

  /** Aktive Session (Signal) — reaktiv für Templates */
  get activeSession(): Signal<ActiveSession | null> {
    return this.store.selectSignal(SessionStateSelectors.activeSession);
  }

  /** Issue-Key der aktiven Session */
  get activeIssueKey(): Signal<string | null> {
    return computed(() => this.activeSession()?.entry.issueKey ?? null);
  }

  /** Startzeit der aktiven Session */
  get activeStartAt(): Signal<string | null> {
    return computed(() => this.activeSession()?.entry.startAt ?? null);
  }

  /** Läuft die Session gepausiert? */
  get isPaused(): Signal<boolean> {
    return computed(() => this.activeSession()?.paused ?? false);
  }

  // --- Write ---
  startSession(issueKey: string): void {
    this.store.dispatch(new StartSession({ issueKey }));
  }

  stopSession(): void {
    this.store.dispatch(new StopSession());
  }

  pauseSession(): void {
    this.store.dispatch(new PauseSession());
  }

  resumeSession(): void {
    this.store.dispatch(new ResumeSession());
  }
}
