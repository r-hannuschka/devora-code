import type { Command } from "../../core";

export interface TimesheetRestoreBackupPayload {
 file: string;
}

export type TimesheetRestoreBackupCommand = Command<"timesheet:restore-backup", TimesheetRestoreBackupPayload>;
