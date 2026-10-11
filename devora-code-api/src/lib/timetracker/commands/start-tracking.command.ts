import type { Command } from "../../core";

/** Timer starten – Issue-Key des Tickets */
export interface StartTrackingPayload {
  issueKey: string;
}

export type StartTrackingCommand = Command<"timetracker:start-tracking", StartTrackingPayload>;
