import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry } from "@devora-code/api/core";
import { addMonths, differenceInCalendarMonths, format } from "date-fns";
import { inject, singleton } from "tsyringe";
import { FileType, Uri, workspace, type ExtensionContext } from "vscode";
import { StorageWriteException } from "./exceptions/storage-write.exception";
import type { TimeEntryDTO, TimesDataDTO } from "./model/time-entry.dto";
import { flatten, groupByDay, groupByMonth, mergeEntries, toDto } from "./timesheet.operations";

@singleton()
export class TimesheetRepository {
  private readonly encoder = new TextEncoder();
  private readonly storageDir: Uri;

  constructor(@inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext) {
    this.storageDir = Uri.joinPath(context.globalStorageUri, "booking-data");
  }

  /** Liefert den Pfad zur Monatsdatei (ohne zu prüfen ob sie existiert) */
  getMonthFileUri(month: string): Uri {
    return Uri.joinPath(this.storageDir, `${month}.json`);
  }

  private async readMonth(month: string): Promise<TimesDataDTO | undefined> {
    try {
      const raw = await workspace.fs.readFile(Uri.joinPath(this.storageDir, `${month}.json`));
      return JSON.parse(new TextDecoder().decode(raw));
    } catch {
      return undefined;
    }
  }

  private async writeMonth(month: string, data: TimesDataDTO): Promise<void> {
    try {
      if (!(await this.storageDirectoryExists())) {
        await workspace.fs.createDirectory(this.storageDir);
      }
      const bytes = this.encoder.encode(JSON.stringify(data, null, 2) + "\n");
      await workspace.fs.writeFile(Uri.joinPath(this.storageDir, `${month}.json`), bytes);
    } catch (error) {
      throw new StorageWriteException("Konnte Daten nicht speichern", error instanceof Error ? error : new Error("Unbekannter Fehler"));
    }
  }

  async getDay(date: string): Promise<TimeEntry[]> {
    const month = format(date, "yyyy-MM");
    const monthData = await this.readMonth(month);
    if (!monthData || !monthData[date]) return [];
    return monthData[date];
  }

  async findById(id: string): Promise<TimeEntry | null> {
    try {
      const dirEntries = await workspace.fs.readDirectory(this.storageDir);
      const monthFiles = dirEntries.filter(([name]) => name.endsWith(".json"));

      for (const [filename] of monthFiles) {
        const month = filename.replace(".json", "");
        const monthData = await this.readMonth(month);
        if (!monthData) continue;

        for (const entries of Object.values(monthData)) {
          const entry = entries.find((e) => e.id === id);
          if (entry) return entry;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  async getMonth(month: string): Promise<TimesDataDTO | undefined> {
    return await this.readMonth(month);
  }

  async getBetween(startDate: string, endDate: string): Promise<{ date: string; entries: TimeEntry[] }[]> {
    const fileNames = this.getFilenamesFromRange(startDate, endDate);
    const results: { date: string; entries: TimeEntry[] }[] = [];

    const sanitizedStartDate = format(startDate, "yyyy-MM-dd");
    const sanitizedEndDate = format(endDate, "yyyy-MM-dd");

    for (const month of fileNames) {
      const monthData = await this.readMonth(month);
      if (!monthData) continue;

      for (const [date, entries] of Object.entries(monthData)) {
        if (date >= sanitizedStartDate && date <= sanitizedEndDate) {
          results.push({ date, entries });
        }
      }
    }
    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getByIssueKey(issueKey: string): Promise<TimeEntry[]> {
    try {
      const dirEntries = await workspace.fs.readDirectory(this.storageDir);
      const monthFiles = dirEntries.filter(([name]) => name.endsWith(".json"));
      const results: TimeEntry[] = [];

      for (const [filename] of monthFiles) {
        const month = filename.replace(".json", "");
        const monthData = await this.readMonth(month);
        if (!monthData) continue;

        for (const entries of Object.values(monthData)) {
          const matches = entries.filter((e) => e.issueKey === issueKey);
          results.push(...matches);
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  createTimeEntry(issueKey: string, startAt: string, endAt: string | null = null): TimeEntry {
    return { id: crypto.randomUUID(), issueKey, startAt, endAt };
  }

  /**
   * Pro betroffenem Monat: Datei einlesen, Einträge mergen (Update per ID, sonst neu),
   * Datei komplett neu schreiben. Gibt die Einträge mit ihren IDs in Eingabereihenfolge zurück.
   */
  async write(entries: TimeEntry[]): Promise<TimeEntryDTO[]> {
    const dtos = entries.map(toDto);

    await Promise.all(
      [...groupByMonth(dtos)].map(async ([month, group]) => {
        debugger;
        const current = (await this.readMonthForWrite(month)) ?? {};
        await this.writeMonth(month, groupByDay(mergeEntries(flatten(current), group)));
      }),
    );

    return dtos;
  }

  /** Nur "Datei fehlt" ist ein leerer Monat. Kaputtes JSON oder andere Fehler werfen. */
  private async readMonthForWrite(month: string): Promise<TimesDataDTO | undefined> {
    let raw: Uint8Array;
    try {
      const stat = await workspace.fs.stat(Uri.joinPath(this.storageDir, `${month}.json`));
      if (!stat || stat.type !== FileType.File) {
        return;
      }
      raw = await workspace.fs.readFile(Uri.joinPath(this.storageDir, `${month}.json`));
    } catch (error) {
      if ((error as { code?: string } | undefined)?.code === "FileNotFound") return undefined;
      throw error;
    }
    return JSON.parse(new TextDecoder().decode(raw));
  }

  // FIX: Kalender-Rundungsfehler bei date-fns eliminiert
  private getFilenamesFromRange(startDate: string, endDate: string): string[] {
    const months = new Set<string>();
    const monthDiff = differenceInCalendarMonths(endDate, startDate);

    for (let i = 0; i <= monthDiff; i++) {
      const toAdd = addMonths(startDate, i);
      months.add(format(toAdd, "yyyy-MM"));
    }
    return Array.from(months);
  }

  private async storageDirectoryExists(): Promise<boolean> {
    try {
      const stat = await workspace.fs.stat(this.storageDir);
      return stat.type === FileType.Directory;
    } catch {
      return false;
    }
  }
}
