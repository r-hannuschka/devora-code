import type { TimeEntry } from "./time-entry";

export interface TimeEntryList {
  entries: TimeEntry[];
  count: number;
  totalSeconds: number;
}
