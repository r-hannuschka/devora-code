import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry, TimeEntryList, TimesData } from "@devora-code/api";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";
import { TimesheetRepository } from "../infrastructure/timesheet.repository";
import { dateLocal, endOfDay, nowLocal, startOfDay } from "./time-tracker.datetime-utils";
import type { TimesDataDTO } from "../infrastructure/model/time-entry.dto";
import { addDays, differenceInCalendarDays } from "date-fns";

@singleton()
export class TimeTrackerService {
  private readonly ACTIVE_TIME_ENTRY_ID_KEY = "activeTimeEntryId";
  private readonly ACTIVE_ISSUE_KEY = "activeIssueKey";

  constructor(
    private readonly repository: TimesheetRepository,
    @inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext,
  ) {}

  // ========================================================================
  // Timer Control
  // ========================================================================

  /**
   * Starte ein neues Tracking für ein Issue.
   * Der Service wirft dem Repo den Eintrag ohne ID hin.
   * Das Repo generiert die ID, und wir fangen das fertige DTO ab!
   */
  async startTracking(issueKey: string): Promise<TimeEntry> {
    const id = this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY);
    if (id) {
      await this.stopTracking();
    }

    // Wir erstellen den Eintrag OHNE ID.
    // Durch den Cast als TimeEntry schluckt das Repo es klaglos.
    const rawEntry: TimeEntry = {
      issueKey,
      startAt: nowLocal(),
      endAt: null,
    };

    // Dein Repo schreibt, generiert die ID und gibt das fertige DTO-Array zurück!
    const [savedDto] = await this.repository.write([rawEntry]);

    if (!savedDto) {
      throw new Error("Der Eintrag konnte nicht im Repository erstellt werden.");
    }

    // Wir nutzen die vom Repo erzeugte ID für den VS Code State
    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY_ID_KEY, savedDto.id);
    await this.context.globalState.update(this.ACTIVE_ISSUE_KEY, issueKey);

    return structuredClone(savedDto);
  }

  /**
   * Erstelle eine manuelle Buchung (z.B. für Meetings).
   */
  async addEntry(issueKey: string, startAt: string, endAt: string): Promise<TimeEntry> {
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      issueKey,
      startAt,
      endAt,
    };

    // FIX: Liefert jetzt ein sauberes flaches Array für das Repository
    const writeEntries = this.normalizeTimeSpan(entry);
    await this.repository.write(writeEntries);

    return structuredClone(entry);
  }

  /**
   * Stoppt den aktuellen Timer.
   */
  async stopTracking(): Promise<void> {
    const id = this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY);
    if (!id) return;

    const entry = await this.repository.findById(id);
    if (!entry) return;

    // End-Zeit setzen
    entry.endAt = nowLocal();

    // FIX: Normalisierte Einträge flach an das neue Repository übergeben
    const writeEntries = this.normalizeTimeSpan(entry);
    await this.repository.write(writeEntries);

    // Timer-State aufräumen
    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY_ID_KEY, undefined);
    await this.context.globalState.update(this.ACTIVE_ISSUE_KEY, undefined);
  }

  /**
   * Mappt ein Zeitintervall (Start + Ende) auf storage-taugliche TimeEntries.
   * NUTZT JETZT DATE-FNS: Absolut sicher gegen Zeitzonen- und Schaltjahr-Fehler!
   */
  private normalizeTimeSpan(entry: TimeEntry): TimeEntry[] {
    // 💡 date-fns vergleicht rein die Kalendertage (Uhrzeit wird ignoriert)
    const dayDifference = differenceInCalendarDays(entry.endAt!, entry.startAt);

    // 1. Gleicher Kalendertag (Differenz ist 0): Keine Magie nötig
    if (dayDifference === 0) {
      return [{ ...entry }];
    }

    const result: TimeEntry[] = [];

    // 2. Erster Tag: Vom ursprünglichen startAt bis zum harten Tagesende (23:59:59)
    result.push({
      ...entry,
      endAt: endOfDay(entry.startAt),
    });

    // 3. Zwischen-Tage: Ganze Tage auffüllen
    const dateRunner = new Date(entry.startAt);

    // Wir laufen von Tag 1 bis kurz vor dem End-Tag
    for (let i = 1; i < dayDifference; i++) {
      const nextDay = addDays(dateRunner, i);
      result.push(this.repository.createTimeEntry(entry.issueKey, startOfDay(nextDay), endOfDay(nextDay)));
    }

    // 4. Letzter Tag: Von Tagesanfang (00:00:00) bis zum echten endAt
    const lastDay = new Date(entry.endAt!);
    const lastEntry = this.repository.createTimeEntry(entry.issueKey, startOfDay(lastDay), entry.endAt!);
    result.push(lastEntry);

    return result;
  }

  // ========================================================================
  // Query Operations
  // ========================================================================

  async getDay(date: string): Promise<TimeEntryList> {
    const entries = await this.repository.getDay(date);
    return {
      entries,
      count: entries.length,
      totalSeconds: entries.reduce((sum, e) => sum + this.calcDuration(e.startAt, e.endAt), 0),
    };
  }

  async getPeriod(startDate: string, endDate?: string): Promise<TimeEntryList> {
    const end = endDate ?? dateLocal();
    const results = await this.repository.getBetween(startDate, end);
    const entries = results.flatMap((r) => r.entries);

    return {
      entries,
      count: entries.length,
      totalSeconds: entries.reduce((sum, e) => sum + this.calcDuration(e.startAt, e.endAt), 0),
    };
  }

  /**
   * FIX: Das Repository gibt jetzt ein flaches Array zurück.
   * Wir gruppieren die Suchergebnisse hier im Service sauber nach Datum für deine UI!
   */
  async getByIssueKey(issueKey: string): Promise<{ date: string; entries: TimeEntry[] }[]> {
    const allMatches = await this.repository.getByIssueKey(issueKey);
    const groups = new Map<string, TimeEntry[]>();

    for (const entry of allMatches) {
      const dayKey = entry.startAt.substring(0, 10);
      const list = groups.get(dayKey) ?? [];
      list.push(entry);
      groups.set(dayKey, list);
    }

    return Array.from(groups.entries())
      .map(([date, entries]) => ({ date, entries }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMonth(month: string): Promise<TimesData> {
    const monthData = await this.repository.getMonth(month);
    return monthData ?? {};
  }

  // ========================================================================
  // State Helpers
  // ========================================================================

  isTracking(issueKey: string): boolean {
    return this.getActiveIssueKey() === issueKey;
  }

  getActiveTimerRef(): string | null {
    return this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY) ?? null;
  }

  getActiveIssueKey(): string | null {
    return this.context.globalState.get<string>(this.ACTIVE_ISSUE_KEY) ?? null;
  }

  async getActiveTimer(): Promise<TimeEntry | null> {
    const key = this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY) ?? null;
    if (key) {
      return await this.repository.findById(key);
    }
    return null;
  }

  private calcDuration(startAt: string, endAt: string | null = null): number {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt ?? new Date()).getTime();
    return Math.floor((endTime - startTime) / 1000);
  }
}
