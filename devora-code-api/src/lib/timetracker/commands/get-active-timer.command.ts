import type { Command } from "../../core";

/** Timer-Status abfragen – kein Payload */
export type GetActiveTimerCommand = Command<"timetracker:get-active-timer">;
