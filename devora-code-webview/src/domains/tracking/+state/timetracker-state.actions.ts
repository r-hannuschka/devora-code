import type { TimeEntry } from "@devora-code/api/core";
import type { TimesheetAddEntryPayload } from "@devora-code/api/timesheet";

export class FetchMonth {
  static readonly type = '[Timetracker] fetch month';
  constructor(readonly payload: { month: string }) {}
}

export class FetchToday {
  static readonly type = '[Timetracker] fetch today';
}

export class AddTimeEntry {
  static readonly type = '[Timetracker] add time entry';

  constructor(public readonly timeEntry: TimesheetAddEntryPayload) {}
}
