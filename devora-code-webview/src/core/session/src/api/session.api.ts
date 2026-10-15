import { InjectionToken } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import type { Observable } from 'rxjs';

/** Timer Lifecycle API — start, stop, reset, active Session lesen */
export interface SessionApi {
  startTracking(issueKey: string): Observable<TimeEntry>;
  stopTracking(): Observable<TimeEntry>;
  resetSession(): Observable<boolean>;
  getActiveTimer(): Observable<TimeEntry | null>;
}

export const SessionApi = new InjectionToken<SessionApi>('Session API');
