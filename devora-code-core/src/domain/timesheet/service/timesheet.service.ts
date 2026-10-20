import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { LoggerService } from "@/infrastructure/logger";
import { TimeEntryDTO, TimesheetRepository, type TimesDataDTO } from "@/infrastructure/timesheet";
import { dateLocal, normalizeTimeSpan } from "@/util/time";
import type { TimeEntry, TimesData } from "@devora-code/api/core";
import type { TimeEntryList, TimesheetRange } from "@devora-code/api/timesheet";
import { format, isWithinInterval } from "date-fns";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";
import { TimesheetRawValidator } from "./timesheet-raw.validator";

@singleton()
export class TimesheetService {
  private readonly ACTIVE_TIME_ENTRY = "activeTimeEntry";

  constructor(
    private readonly repository: TimesheetRepository,
    private readonly logger: LoggerService,
    private readonly rawValidator: TimesheetRawValidator,
    @inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext,
  ) {}

  // ========================================================================
  // Write Operations
  // ========================================================================

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

  /**
   * Schiebt einen aktiven Timer ein und spaltet das originale Entry auf.
   *
   * Beispiel: [source ────── ∞)  →  [source ─ start) [insert] [end ────── ∞)
   */
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

  // ========================================================================
  // Query Operations
  // ========================================================================

  /** Alle Entries eines einzelnen Tages */
  async getDay(date: string): Promise<TimeEntryList> {
    const entries = await this.repository.getDay(date);
    return this.summarize(entries);
  }

  /** Entries eines Datumsbereichs (zurückfiltert offene Timer vom Vormonat) */
  async getRaw(startDate: string, endDate: string): Promise<TimesDataDTO> {
    // Vormonat einbeziehen, da offene Tasks vom Vormonat noch nicht abgeschlossen sein können

    const months = await this.repository.getRange(startDate, endDate);
    const raw = Object.assign({}, ...months) as TimesDataDTO;
    const matches: TimesDataDTO = {};

    const rangeStart = format(startDate, "yyyy-MM-dd");
    const rangeEnd = format(endDate, "yyyy-MM-dd");

    for (const [date, entries] of Object.entries(raw)) {
      if (date < rangeStart || date > rangeEnd) {
        continue;
      }
      matches[date] = entries;
    }

    return matches;
  }

  /** Alle Entries eines Monats */
  async getMonth(month: string): Promise<TimesData> {
    const monthData = await this.repository.getMonth(month);
    return monthData ?? {};
  }

  /** Alle Entries eines Datumsbereichs als flaches Array mit Aggregation */
  async getPeriod(startDate: string, endDate?: string): Promise<TimeEntryList> {
    const entries: TimeEntry[] = [];
    for (const list of Object.values(await this.getRaw(startDate, endDate ?? dateLocal()))) {
      entries.push(...list);
    }

    return this.summarize(entries);
  }

  /** Suche nach Issue-Key, gruppiert und sortiert nach Datum (für die UI) */
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

  // ========================================================================
  // Sync Operations
  // ========================================================================

  /**
   * Synchronisiert rohe Timesheet-Daten in den lokalen Speicher.
   * Bestehende Daten in der gegebenen Range werden überschrieben,
   * Daten außerhalb der Range bleiben erhalten.
   */
  async syncFromRaw(raw: TimesData, range: TimesheetRange) {
    const fileName = format(range.minDate, "yyyy-MM");

    const errors = this.rawValidator.validate(raw, range);
    if (errors !== null) {
      for (const [_, validationError] of Object.entries(errors)) {
        this.logger.error(`[Timesheet]: Validierung fehl geschlagen: ${validationError.message}`);
      }
      throw new Error(`Synchronisation ist fehl geschlagen`);
    }

    const existingFileData = (await this.repository.getMonth(fileName)) ?? {};

    // 1. Bestehende Daten außerhalb der Range behalten
    const filteredExisting: TimesData = {};
    for (const [dateStr, entries] of Object.entries(existingFileData)) {
      if (!isWithinInterval(dateStr, { start: range.minDate, end: range.maxDate })) {
        filteredExisting[dateStr] = entries;
      }
    }

    // 2. Neue Daten mit gefilterten Bestandsdaten mergen
    const mergedData: TimesData = {
      ...filteredExisting,
      ...raw,
    };

    // 3. Ergebnis schreiben (Validator sichert Monatsgrenzen)
    await this.repository.writeFile(fileName, mergedData);
  }

  // ========================================================================
  // Private Helpers
  // ========================================================================

  private calcDuration(startAt: string, endAt: string | null = null): number {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt ?? new Date()).getTime();
    return Math.floor((endTime - startTime) / 1000);
  }

  private summarize(entries: TimeEntry[]): TimeEntryList {
    return {
      entries,
      count: entries.length,
      totalSeconds: entries.reduce((sum, e) => sum + this.calcDuration(e.startAt, e.endAt), 0),
    };
  }
}
