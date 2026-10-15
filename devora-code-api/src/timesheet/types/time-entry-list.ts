import type { TimeEntry } from "../../core";

export interface TimeEntryList {
  entries: TimeEntry[];
  count: number;
  totalSeconds: number;
}
