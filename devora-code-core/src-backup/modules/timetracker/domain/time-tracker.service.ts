import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry, TimesData } from "@devora-code/api/core";
import type { TimeEntryList } from "@devora-code/api/timesheet";
import { addDays, differenceInCalendarDays } from "date-fns";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";
import type { TimeEntryDTO } from "../infrastructure/model/time-entry.dto";
import { TimesheetRepository } from "../infrastructure/timesheet.repository";
import { dateLocal, endOfDay, nowLocal, startOfDay } from "./time-tracker.datetime-utils";

@singleton()
export class TimeTrackerService {
  private readonly ACTIVE_TIME_ENTRY = "activeTimeEntry";

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
    const activeTimeEntry = this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY);
    if (activeTimeEntry) {
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
    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY, savedDto);
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
  async stopTracking(): Promise<TimeEntryDTO[] | null> {
    const activeTimeEntry = this.context.globalState.get<TimeEntryDTO>(this.ACTIVE_TIME_ENTRY);
    if (!activeTimeEntry) return null;

    // End-Zeit setzen
    activeTimeEntry.endAt = nowLocal();

    // FIX: Normalisierte Einträge flach an das neue Repository übergeben
    const writeEntries = this.normalizeTimeSpan(activeTimeEntry);
    const entry = await this.repository.write(writeEntries);

    // Timer-State aufräumen
    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY, undefined);

    return entry;
  }

  /**
   * Mappt ein Zeitintervall (Start + Ende) auf storage-taugliche TimeEntries.
   * NUTZT JETZT DATE-FNS: Absolut sicher gegen Zeitzonen- und Schaltjahr-Fehler!
   */
  private normalizeTimeSpan(entry: TimeEntry): TimeEntry[] {
    // 💡 date-fns vergleicht rein die Kalendertage (Uhrzeit wird ignoriert)
    const dayDifference = differenceInCalendarDays(entry.endAt ?? nowLocal(), entry.startAt);

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
    const lastDay = new Date(entry.endAt ?? dateLocal());
    const lastEntry = this.repository.createTimeEntry(entry.issueKey, startOfDay(lastDay), entry.endAt);

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

  async splitActiveTimer(toInsert: TimeEntry, source: TimeEntry): Promise<TimeEntryDTO[]> {
    const { endAt: activeEndAt } = source;
    const { endAt: insertEndAt, startAt: insertStartAt } = toInsert;

    if (activeEndAt !== null) {
      throw new Error("[Timetracker]: Aktiver Timer wurde schon beendet.");
    }

    if (!insertEndAt) {
      throw new Error("[Timetracker]: Eintrag konnte nicht dazwischen geschoben werden da das Ende Datum fehlt.");
    }

    const normalizeTimeSpan = this.normalizeTimeSpan(toInsert);

    const newEntries: TimeEntry[] = [
      { ...source, endAt: insertStartAt },
      ...normalizeTimeSpan,
      { issueKey: source.issueKey, startAt: insertEndAt, endAt: null },
    ];

    const written = await this.repository.write(newEntries);
    const newActive = written.slice(-1)[0]!;

    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY, newActive);
    return written;
  }

  // ========================================================================
  // Session Reset
  // ========================================================================

  /**
   * Setzt die Session komplett zurück: aktiven Timer stoppen und globalState leeren.
   * Für den Fall dass rumgefummelt wurde und der Timer hängen bleibt.
   */
  async resetSession(): Promise<boolean> {
    const activeTimer = this.context.globalState.get<TimeEntryDTO>(this.ACTIVE_TIME_ENTRY);
    if (activeTimer) {
      activeTimer.endAt = nowLocal();
      await this.repository.write([activeTimer]);
    }
    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY, undefined);
    return true;
  }

  // ========================================================================
  // State Helpers
  // ========================================================================

  isTracking(issueKey: string): boolean {
    return this.getActiveIssueKey() === issueKey;
  }

  getActiveTimer(): TimeEntry | null {
    return this.context.globalState.get<TimeEntryDTO>(this.ACTIVE_TIME_ENTRY) ?? null;
  }

  getActiveIssueKey(): string | null {
    const activeTimer = this.getActiveTimer();
    return activeTimer?.issueKey ?? null;
  }

  getActiveTimerRef(): string | null {
    const activeTimer = this.getActiveTimer();
    return activeTimer?.id ?? null;
  }

  private calcDuration(startAt: string, endAt: string | null = null): number {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt ?? new Date()).getTime();
    return Math.floor((endTime - startTime) / 1000);
  }
}
