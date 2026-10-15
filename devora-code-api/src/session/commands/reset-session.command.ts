import type { Command } from "../../core";

/** Session zurücksetzen – Timer stoppen und globalState leeren */
export type ResetSessionCommand = Command<"session:reset">;
