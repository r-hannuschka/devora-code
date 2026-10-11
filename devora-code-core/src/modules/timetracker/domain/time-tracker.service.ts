import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry, TimeEntryList, TimesData } from "@devora-code/api";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";
import { TimesheetRepository } from "../infrastructure/timesheet.repository";

@singleton()
export class TimeTrackerService {
  private readonly ACTIVE_TIME_ENTRY_ID_KEY = "activeTimeEntryId";
  private readonly ACTIVE_ISSUE_KEY = "activeIssueKey";

  constructor(
    private readonly repository: TimesheetRepository,
    @inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext,
  ) {}

  // --- Timer Control ---

  /**
   * Starte ein neues Tracking für ein Issue.
   * Auto-Stop Pattern: Alter Timer wird beendet.
   */
  async startTracking(issueKey: string): Promise<TimeEntry> {
    const id = this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY);
    if (id) {
      await this.stopTracking();
    }

    const now = new Date().toISOString();
    const date = now.substring(0, 10);
    const newId = crypto.randomUUID();

    const entry: TimeEntry = {
      id: newId,
      issueKey,
      startAt: now,
      endAt: null,
    };

    await this.repository.add(date, entry);
    await this.repository.save();

    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY_ID_KEY, newId);
    await this.context.globalState.update(this.ACTIVE_ISSUE_KEY, issueKey);

    return structuredClone(entry);
  }

  /**
   * Stoppt den aktuellen Timer und gibt Ergebnis zurück.
   * Transaction Flush: Speichert und räumt auf.
   */
  async stopTracking(): Promise<void> {
    const id = this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY);
    if (!id) {
      return;
    }

    const entry = await this.repository.findById(id);
    if (entry) {
      const now = new Date().toISOString();
      await this.finishTracking(id, entry, now);
      await this.repository.save();
    }

    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY_ID_KEY, undefined);
    await this.context.globalState.update(this.ACTIVE_ISSUE_KEY, undefined);
  }

  /**
   * Beendet das Tracking und handled Tages-Grenzen.
   * Split-Across-Days Pattern: Für jeden Tag eine Entry.
   */
  private async finishTracking(id: string, entry: TimeEntry, now: string): Promise<void> {
    const startDayKey = entry.startAt.substring(0, 10);
    const endDayKey = now.substring(0, 10);

    // Szenario A: Gleicher Kalendertag (Standardfall) -> Direkt stoppen!
    if (startDayKey === endDayKey) {
      await this.repository.stopTracking(id, now);
      return;
    }

    // 1. Den allerersten Tag sauber bis kurz vor Mitternacht beenden
    const firstDayEnd = `${startDayKey}T23:59:59.999Z`;
    await this.repository.stopTracking(id, firstDayEnd);

    // 2. Folgender Tag als Iterationsstarter (nur Date-Arithmetik)
    const dateRunner = new Date(startDayKey);
    dateRunner.setDate(dateRunner.getDate() + 1);
    let currentDayKey = dateRunner.toISOString().substring(0, 10);

    let dayCount = 0;
    const MAX_DAYS = 366; // Safety limit gegen Endlosschleifen

    // 3. Stur Tag für Tag als ISO-Strings wegschreiben
    while (currentDayKey <= endDayKey && dayCount < MAX_DAYS) {
      const isLastDay = currentDayKey === endDayKey;
      const dayEnd = isLastDay ? now : `${currentDayKey}T23:59:59.999Z`;

      const dayEntry: TimeEntry = {
        id: crypto.randomUUID(),
        issueKey: entry.issueKey,
        startAt: `${currentDayKey}T00:00:00.000Z`,
        endAt: dayEnd,
      };

      await this.repository.add(currentDayKey, dayEntry);

      // Nächster Kalendertag
      dateRunner.setDate(dateRunner.getDate() + 1);
      currentDayKey = dateRunner.toISOString().substring(0, 10);
      dayCount++;
    }
  }

  // --- Query Operations ---

  /**
   * Alle Einträge eines Tages + Gesamtdauer.
   * Aggregation Pattern.
   */
  async getDay(date: string): Promise<TimeEntryList> {
    const entries = await this.repository.getDay(date);
    return {
      entries,
      count: entries.length,
      totalSeconds: entries.reduce((sum, e) => sum + this.calcDuration(e.startAt, e.endAt), 0),
    };
  }

  /**
   * Alle Einträge über einen Zeitraum + Gesamtdauer.
   * Range Query Pattern.
   */
  async getPeriod(startDate: string, endDate?: string): Promise<TimeEntryList> {
    const end = endDate ?? new Date().toISOString().substring(0, 10);
    const results = await this.repository.getBetween(startDate, end);
    const entries = results.flatMap((r) => r.entries);

    return {
      entries,
      count: entries.length,
      totalSeconds: entries.reduce((sum, e) => sum + this.calcDuration(e.startAt, e.endAt), 0),
    };
  }

  /**
   * Alle Einträge für ein spezifisches Issue über alle Tage.
   */
  async getByIssueKey(issueKey: string): Promise<{ date: string; entries: TimeEntry[] }[]> {
    return this.repository.getByIssueKey(issueKey);
  }

  /**
   * Alle Einträge eines spezifischen Monats (YYYY-MM).
   */
  async getMonth(month: string): Promise<TimesData> {
    const monthData = await this.repository.getMonth(month);
    return monthData ?? {};
  }

  // --- State Helpers ---

  /**
   * Prüft, ob das übergebene Issue gerade tracked wird.
   * State Query Pattern.
   */
  isTracking(issueKey: string): boolean {
    return this.getActiveIssueKey() === issueKey;
  }

  /**
   * Gibt die ID des aktuell laufenden Timers zurück (oder null).
   */
  getActiveTimerRef(): string | null {
    return this.context.globalState.get<string>(this.ACTIVE_TIME_ENTRY_ID_KEY) ?? null;
  }

  /**
   * Gibt das Issue Key des aktuell laufenden Timers zurück (oder null).
   */
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

  // --- Private Helpers ---

  /**
   * Berechnet Dauer in Sekunden zwischen startAt und endAt.
   * Live-Duration für aktive Timer (endAt=null).
   */
  private calcDuration(startAt: string, endAt: string | null): number {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt ?? new Date()).getTime();
    return Math.floor((endTime - startTime) / 1000);
  }
}
