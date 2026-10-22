import type { TimeEntry } from "../../core";

/** Wrapper für den globalState: kombiniert das TimeEntry mit dem Pausier-Status */
export interface ActiveSession {
  entry: Required<TimeEntry>;
  paused: boolean;
}
