import type { Command } from "../../core";
/** History für Datum */
export interface HistoryPayload {
    date: string;
}
export type HistoryCommand = Command<"timetracker:history", HistoryPayload>;
//# sourceMappingURL=history.command.d.ts.map