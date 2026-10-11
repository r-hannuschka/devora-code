import type { Command } from "../../core";

/** History für Datum */
export interface HistoryPayload {
  date: string;
}

export type HistoryCommand = Command<"timetracker:history", HistoryPayload>;
