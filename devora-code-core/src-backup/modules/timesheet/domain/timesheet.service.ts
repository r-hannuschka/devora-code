import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimeEntryDTO, TimesheetRepository, type TimesDataDTO } from "@/core/infrastructure";
import { LoggerService } from "@/core/logger";
import { NotificationService } from "@/core/notification";
import { dateLocal, normalizeTimeSpan } from "@/util/time";
import type { TimeEntry, TimesData } from "@devora-code/api/core";
import type { TimeEntryList } from "@devora-code/api/timesheet";
import { format, startOfMonth, subMonths } from "date-fns";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";

@singleton()
export class TimesheetService {
  private readonly ACTIVE_TIME_ENTRY = "activeTimeEntry";

  constructor(
    private readonly repository: TimesheetRepository,
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService,
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

  async getRaw(startDate: string, endDate: string): Promise<TimesDataDTO> {
    // Immer auf den vorigen Monat wechseln da es sein kann das der Vormat
    // noch einen offenen Task hat
    const prevMonth = format(subMonths(startOfMonth(startDate), 1), "yyyy-MM-dd");

    const months = await this.repository.getRange(prevMonth, endDate);
    const raw = Object.assign({}, ...months) as TimesDataDTO;
    const matches: TimesDataDTO = {};

    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");

    for (const [date, entries] of Object.entries(raw)) {
      if (date < start || date > end) {
        // Offene Timer vor dem Start-Datum nachschieben
        const openEntries = entries.filter((e) => e.endAt === null);
        if (openEntries.length > 0) {
          matches[date] = openEntries;
        }
        continue;
      }
      matches[date] = entries;
    }

    return matches;
  }

  async getPeriod(startDate: string, endDate?: string): Promise<TimeEntryList> {
    const entries: TimeEntry[] = [];
    for (const list of Object.values(await this.getRaw(startDate, endDate ?? dateLocal()))) {
      entries.push(...list);
    }

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

  async syncFromRaw(raw: TimesData) {
    const groupedByMonth = new Map<String, TimesData>();
    for (const [date, entries] of Object.entries(raw)) {
      const yearMonth = format(date, "yyyy-MM");
      if (!groupedByMonth.has(yearMonth)) {
        groupedByMonth.set(yearMonth, { [date]: [] });
      }

      const bufferedTimesData = groupedByMonth.get(yearMonth) ?? {};
      const bufferedEntries = bufferedTimesData[date] ?? [];

      groupedByMonth.set(yearMonth, {
        ...bufferedTimesData,
        [date]: [...bufferedEntries, ...entries],
      });
    }

    const bufferedRaw: Record<string, TimesData> = Object.fromEntries(groupedByMonth);
    return this.syncTimesData(bufferedRaw);
  }

  private async syncTimesData(data: Record<string, TimesData>) {
    const writePromises = [];

    for (const [fileName, timesData] of Object.entries(data)) {
      const write$ = this.repository
        .getMonth(fileName)
        .catch(() => ({}) as TimesData)
        // --- replace data and by new entries
        .then((raw: TimesData = {}) => ({ ...raw, ...timesData }))
        // --- map data to dto
        .then((data: TimesData) => this.repository.mapTimesDataToDTO(data)) // map to dto
        // --- write to repository
        .then((data: TimesDataDTO) => this.repository.writeMonth(fileName, data))
        .catch(() => {
          this.logger.error(`[Timesheet]: could not sync file ${fileName}.json with timesdata`, JSON.stringify(timesData));
          this.notificationService.showError(`[Timesheet]: could not sync file ${fileName}.json. Open log file for further informations. `);
          return null;
        });

      writePromises.push(write$);
    }

    return Promise.all(writePromises);
  }

  private calcDuration(startAt: string, endAt: string | null = null): number {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt ?? new Date()).getTime();
    return Math.floor((endTime - startTime) / 1000);
  }
}
