export interface TimeEntryDTO {
    id: string;
    issueKey: string;
    startAt: string;
    endAt: string | null;
}

export type TimesDataDTO = Record<string, TimeEntryDTO[]>;