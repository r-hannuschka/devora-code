import type { Command } from "../../core";

/** Timer starten – Issue-Key des Tickets */
export interface StartSessionPayload {
  issueKey: string;
}

export type StartSessionCommand = Command<"session:start", StartSessionPayload>;
