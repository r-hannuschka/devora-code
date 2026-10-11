import type { Command } from "../../core";

/** Time-Entry löschen */
export interface DeleteEntryPayload {
  id: string;
}

export type DeleteEntryCommand = Command<"timetracker:delete-entry", DeleteEntryPayload>;
