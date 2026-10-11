import { InjectionToken } from '@angular/core';
import type { TimeEntry, TimeEntryList } from '@devora-code/api';
import type { Observable } from 'rxjs';

export interface TimeTrackerApi {
  startTracking(issueKey: string): Observable<TimeEntry>;
  stopTracking(): Observable<{ duration: number; date: string; id: string }>;
  getPeriod(startDate: string, endDate?: string): Observable<TimeEntryList | undefined>;
  getActiveTimer(): Observable<TimeEntry | null>;
  getMonth(month: string): Observable<Record<string, TimeEntry[]>>;
}

export const TimeTrackerApi = new InjectionToken<TimeTrackerApi>('Time Tracker Flow Facade');
