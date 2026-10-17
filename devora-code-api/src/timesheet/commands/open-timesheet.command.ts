import type { Command } from "../../core";

/** Time-Entries nach Issue suchen */
export interface TimesheetOpenPayload {
    startAt: string;
    endAt: string;
}

export type TimesheetOpenCommand = Command<"timesheet:open", TimesheetOpenPayload>;
