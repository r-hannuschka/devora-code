import { InjectionToken } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import type { TimeEntryList, TimesheetAddEntryPayload } from '@devora-code/api/timesheet';
import type { Observable } from 'rxjs';

/** Data CRUD API — Einträge erstellen, lesen, Perioden/Monate */
export interface TimesheetApi {
  addEntry(payload: TimesheetAddEntryPayload): Observable<TimeEntry[]>;
  getPeriod(startDate: string, endDate?: string): Observable<TimeEntryList>;
  getMonth(month: string): Observable<Record<string, TimeEntry[]>>;
}

export const TimesheetApi = new InjectionToken<TimesheetApi>('Timesheet API');
