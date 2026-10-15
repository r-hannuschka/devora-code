import type { TimesheetApi } from '@/core/timesheet';
import { inject } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import type {
  GetMonthCommand,
  GetPeriodCommand,
  TimeEntryList,
  TimesheetAddEntryCommand,
  TimesheetAddEntryPayload,
} from '@devora-code/api/timesheet';
import type { Observable } from 'rxjs';
import { VsCodeBridge } from './vscode-bridge';

/** TimesheetApi Implementierung — ruft VS Code Core Commands auf */
export class TimesheetApiService implements TimesheetApi {
  private readonly vscode = inject(VsCodeBridge);

  addEntry(payload: TimesheetAddEntryPayload): Observable<TimeEntry[]> {
    return this.vscode.request<TimeEntry[]>({
      id: crypto.randomUUID(),
      type: 'timesheet:add-entry',
      payload,
    } as TimesheetAddEntryCommand);
  }

  getPeriod(startDate: string, endDate?: string): Observable<TimeEntryList> {
    return this.vscode.request<TimeEntryList>({
      id: crypto.randomUUID(),
      type: 'timesheet:get-period',
      payload: { endDate, startDate },
    } as GetPeriodCommand);
  }

  getMonth(month: string): Observable<Record<string, TimeEntry[]>> {
    return this.vscode.request<Record<string, TimeEntry[]>>({
      id: crypto.randomUUID(),
      type: 'timesheet:get-month',
      payload: { month },
    } as GetMonthCommand);
  }
}
