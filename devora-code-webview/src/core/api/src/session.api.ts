import { InjectionToken } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import type { ActiveSession } from '@devora-code/api/session';
import type { Observable } from 'rxjs';

/** Timer Lifecycle API — start, stop, reset, active Session lesen */
export interface SessionApi {
  startTracking(issueKey: string): Observable<ActiveSession>;
  stopTracking(): Observable<TimeEntry>;
  pauseSession(): Observable<ActiveSession | null>;
  resumeSession(): Observable<ActiveSession | null>;
  resetSession(): Observable<boolean>;
  getActiveTimer(): Observable<ActiveSession | null>;
}

export const SessionApi = new InjectionToken<SessionApi>('Session API');
