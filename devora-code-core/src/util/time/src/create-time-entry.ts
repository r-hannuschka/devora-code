import type { TimeEntry } from "@devora-code/api/core";

export function createTimeEntry(issueKey: string, startAt: string, endAt: string | null = null): TimeEntry {
  return { id: crypto.randomUUID(), issueKey, startAt, endAt };
}
