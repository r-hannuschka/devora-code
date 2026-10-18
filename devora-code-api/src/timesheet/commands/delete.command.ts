import type { Command } from "../../core";

/** Time-Entry löschen */
export interface DeleteEntryPayload {
  entryId: string;
}

export type DeleteEntryCommand = Command<"timesheet:delete", DeleteEntryPayload>;
