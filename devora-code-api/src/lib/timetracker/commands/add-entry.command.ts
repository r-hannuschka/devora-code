import type { Command } from "../../core";

export interface AddEntryPayload {
  issueKey: string;
  startAt: string;
  endAt: string;
  date: string;
}

export type AddEntryCommand = Command<"timetracker:add-entry", AddEntryPayload>;
