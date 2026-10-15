import type { Command, TimeEntry } from "../../core";

export type TimesheetAddEntryPayload = Pick<TimeEntry, 'startAt' | 'issueKey'> & { endAt: string};

export type TimesheetAddEntryCommand = Command<"timesheet:add-entry", TimesheetAddEntryPayload>;
