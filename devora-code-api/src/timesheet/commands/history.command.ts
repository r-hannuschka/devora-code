import type { Command } from "../../core";

/** History für Datum */
export interface HistoryPayload {
  date: string;
}

export type HistoryCommand = Command<"timesheet:history", HistoryPayload>;
