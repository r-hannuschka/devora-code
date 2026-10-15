import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimeEntryDTO, TimesheetRepository } from "@/core/infrastructure";
import { dateLocal, normalizeTimeSpan } from "@/util/time";
import type { TimeEntry, TimesData } from "@devora-code/api/core";
import type { TimeEntryList } from "@devora-code/api/timesheet";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";

@singleton()
export class TimesheetService {
  private readonly ACTIVE_TIME_ENTRY = "activeTimeEntry";

  constructor(
    private readonly repository: TimesheetRepository,
    @inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext,
  ) {}

  /**
   * Erstelle eine manuelle Buchung (z.B. für Meetings).
   */
  async addEntry(issueKey: string, startAt: string, endAt: string): Promise<TimeEntry[]> {
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      issueKey,
      startAt,
      endAt,
    };

    const writeEntries = normalizeTimeSpan(entry);
    const written = await this.repository.write(writeEntries);

    return structuredClone(written);
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

    const normalizedTimeSpan = normalizeTimeSpan(toInsert);

    const newEntries: TimeEntry[] = [
      { ...source, endAt: insertStartAt },
      ...normalizedTimeSpan,
      { issueKey: source.issueKey, startAt: insertEndAt, endAt: null },
    ];

    const written = await this.repository.write(newEntries);
    const newActive = written.slice(-1)[0]!;

    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY, newActive);
    return written;
  }

  private calcDuration(startAt: string, endAt: string | null = null): number {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt ?? new Date()).getTime();
    return Math.floor((endTime - startTime) / 1000);
  }
}
