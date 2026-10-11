import type { Command } from "../../core";

/** Time-Entry bearbeiten – ID + Patch */
export interface UpdateEntryPayload {
  entryId: string;
  patch: { startAt?: string; endAt?: string };
}

export type UpdateEntryCommand = Command<"timetracker:update-entry", UpdateEntryPayload>;
