import { computed, inject, Service, Signal } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import { Store } from '@ngxs/store';
import { SessionStateSelectors, StartSession, StopSession } from './state';

@Service()
export class SessionService {
  private readonly store = inject(Store);

  // --- Read ---

  /** Aktive Session (Signal) — reaktiv für Templates */
  get activeSession(): Signal<TimeEntry | null> {
    return this.store.selectSignal(SessionStateSelectors.activeSession);
  }

  /** Issue-Key der aktiven Session */
  get activeIssueKey(): Signal<string | null> {
    return computed(() => this.activeSession()?.issueKey ?? null);
  }

  /** Startzeit der aktiven Session */
  get activeStartAt(): Signal<string | null> {
    return computed(() => this.activeSession()?.startAt ?? null);
  }

  // --- Write ---
  startSession(issueKey: string): void {
    this.store.dispatch(new StartSession({ issueKey }));
  }

  stopSession(): void {
    this.store.dispatch(new StopSession());
  }
}
