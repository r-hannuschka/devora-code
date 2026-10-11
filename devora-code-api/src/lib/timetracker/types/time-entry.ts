export interface TimeEntry {
  id: string; // UUID
  issueKey: string;
  startAt: string; // ISO-8601: "2024-01-15T09:00:00.000Z"
  endAt: string | null;   // ISO-8601: "2024-01-15T10:30:00.000Z"
}

export type TimesData = Record<string, TimeEntry[]>;
