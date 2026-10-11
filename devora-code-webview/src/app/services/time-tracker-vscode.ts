import { inject } from '@angular/core';
import type {
  GetActiveTimerCommand,
  GetMonthCommand,
  GetPeriodCommand,
  StartTrackingCommand,
  StopTrackingCommand,
  TimeEntry,
  TimeEntryList,
  TimesData,
} from '@devora-code/api';
import type { TimeTrackerApi } from '@/core/api';
import type { Observable } from 'rxjs';
import { VsCodeBridge } from './vscode-bridge';

export class TimeTrackerVsCode implements TimeTrackerApi {
  private readonly vscodeBridge = inject(VsCodeBridge);

  startTracking(issueKey: string): Observable<TimeEntry> {
    const command: StartTrackingCommand = {
      id: crypto.randomUUID(),
      type: 'timetracker:start-tracking',
      payload: { issueKey },
    };
    return this.vscodeBridge.request<TimeEntry>(command);
  }

  stopTracking(): Observable<{ duration: number; date: string; id: string }> {
    const command: StopTrackingCommand = {
      id: crypto.randomUUID(),
      type: 'timetracker:stop-tracking',
    };
    return this.vscodeBridge.request<{ duration: number; date: string; id: string }>(command);
  }

  getPeriod(startDate: string, endDate?: string): Observable<TimeEntryList | undefined> {
    const command: GetPeriodCommand = {
      id: crypto.randomUUID(),
      type: 'timetracker:get-period',
      payload: { endDate, startDate },
    };
    return this.vscodeBridge.request<TimeEntryList>(command);
  }

  getActiveTimer(): Observable<TimeEntry | null> {
    const command: GetActiveTimerCommand = {
      id: crypto.randomUUID(),
      type: 'timetracker:get-active-timer',
    };
    return this.vscodeBridge.request<TimeEntry | null>(command);
  }

  getMonth(month: string): Observable<TimesData> {
    const command: GetMonthCommand = {
      id: crypto.randomUUID(),
      type: 'timetracker:get-month',
      payload: { month },
    };
    return this.vscodeBridge.request<TimesData>(command);
  }
}
