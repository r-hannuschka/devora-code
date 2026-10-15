import type { Command } from "../../core";

/** Timer-Status abfragen – kein Payload */
export type GetActiveSessionCommand = Command<"session:get-active">;
