export interface TimeEntry {
    id: string;
    issueKey: string;
    startAt: string;
    endAt: string | null;
}
export type TimesData = Record<string, TimeEntry[]>;
//# sourceMappingURL=time-entry.d.ts.map