import type { TimeEntryDTO } from "@/infrastructure/timesheet";
import type { TimeEntry } from "@devora-code/api/core";

let counter = 0;

/**
 * Baut einen gültigen TimeEntry. Mit overrides werden nur die Felder gesetzt,
 * die für den jeweiligen Test relevant sind.
 */
export function buildTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntryDTO {
  counter++;
  return {
    id: `entry-${counter}`,
    issueKey: "TEST-1",
    startAt: "2026-10-11T09:00:00",
    endAt: "2026-10-11T10:00:00",
    ...overrides,
  };
}
