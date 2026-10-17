import type { Command } from "../../core";

/** Time-Entries nach Issue suchen */
export interface TimesheetCsvCommandPayload {
    startAt: string;
    endAt: string;
}

export type TimesheetCsvCommand = Command<"timesheet:open", TimesheetCsvCommandPayload>;
