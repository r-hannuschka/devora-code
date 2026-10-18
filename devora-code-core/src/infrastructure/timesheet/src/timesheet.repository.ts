import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry, TimesData } from "@devora-code/api/core";
import { addMonths, differenceInCalendarMonths, format } from "date-fns";
import { inject, singleton } from "tsyringe";
import { FileType, Uri, workspace, type ExtensionContext } from "vscode";
import { StorageWriteException } from "./exception/storage-write.exception";
import type { TimeEntryDTO, TimesDataDTO } from "./model/time-entry.dto";
import { flatten, groupByDay, groupByMonth, mergeEntries, toDto } from "./timesheet.operations";

@singleton()
export class TimesheetRepository {
  private readonly encoder = new TextEncoder();

  /** Pfade &amp; Initialisierung */
  private readonly storageDir: Uri;

  constructor(@inject(EXTENSION_CONTEXT_TOKEN) context: ExtensionContext) {
    this.storageDir = Uri.joinPath(context.globalStorageUri, "booking-data");
  }

  getStorageUri(): Uri {
    return Uri.parse(this.storageDir.toString());
  }

  getMonthFileUri(month: string): Uri {
    return Uri.joinPath(this.storageDir, `${month}.json`);
  }

  /** Verzeichnis-Operationen */

  async list(dirUri: Uri = this.storageDir): Promise<Uri[]> {
    try {
      const dirEntries = await workspace.fs.readDirectory(dirUri);
      const files: Uri[] = [];

      for (const [name, type] of dirEntries) {
        const entryUri = Uri.joinPath(dirUri, name);

        if (type === FileType.Directory) {
          files.push(...await this.list(entryUri));
          continue;
        }

        if (type === FileType.File && name.endsWith(".json")) {
          files.push(entryUri);
        }
      }

      return files;
    } catch {
      return []; // Verzeichnis existiert nicht oder kann nicht gelesen werden
    }
  }

  async readDirectory(): Promise<Uri[]> {
    try {
      const dirEntries = await workspace.fs.readDirectory(this.storageDir);
      return dirEntries.map(([name]) => Uri.joinPath(this.storageDir, name));
    } catch {
      return [];
    }
  }

  private async directoryExists(): Promise<boolean> {
    try {
      const stat = await workspace.fs.stat(this.storageDir);
      return stat.type === FileType.Directory;
    } catch {
      return false;
    }
  }

  /** Lese-Operationen */

  async getMonth(month: string): Promise<TimesDataDTO | undefined> {
    return await this.readMonth(month);
  }

  async getDay(date: string): Promise<TimeEntry[]> {
    const month = format(date, "yyyy-MM");
    const monthData = await this.readMonth(month);
    if (!monthData || !monthData[date]) return [];
    return monthData[date];
  }

  async getRange(startDate: string, endDate: string): Promise<TimesDataDTO[]> {
    const fileNames = this.getFilenamesFromRange(startDate, endDate);
    const fileContents = await Promise.all(fileNames.map((month) => this.getMonth(month)));
    return fileContents.filter((data): data is TimesDataDTO => data !== undefined);
  }

  async getByIssueKey(issueKey: string): Promise<TimeEntry[]> {
    const results: TimeEntry[] = [];

    try {
      const monthFiles = await this.getMonthFiles();

      for (const month of monthFiles) {
        const monthData = await this.readMonth(month);
        if (!monthData) continue;

        for (const entries of Object.values(monthData)) {
          const matches = entries.filter((e) => e.issueKey === issueKey);
          results.push(...matches);
        }
      }
    } catch {
      // noop – leeres Ergebnis
    }

    return results;
  }

  async findById(id: string): Promise<TimeEntry | null> {
    try {
      const monthFiles = await this.getMonthFiles();

      for (const month of monthFiles) {
        const monthData = await this.readMonth(month);
        if (!monthData) continue;

        for (const entries of Object.values(monthData)) {
          const entry = entries.find((e) => e.id === id);
          if (entry) return entry;
        }
      }
    } catch {
      // noop – nicht gefunden
    }

    return null;
  }

  /** Schreib-Operationen */

  async write(entries: TimeEntry[], path = this.storageDir): Promise<TimeEntryDTO[]> {
    const dtos = entries.map(toDto);

    await Promise.all(
      [...groupByMonth(dtos)].map(async ([month, group]) => {
        const current = (await this.readMonthForWrite(month)) ?? {};
        await this.writeFile(month, groupByDay(mergeEntries(flatten(current), group)), path);
      }),
    );

    return dtos;
  }

  async writeFile(month: string, data: TimesData, dir = this.storageDir): Promise<void> {
    const sanitized = this.mapTimesDataToDTO(data);

    try {
      if (!(await this.directoryExists())) {
        await workspace.fs.createDirectory(this.storageDir);
      }

      const bytes = this.encoder.encode(JSON.stringify(sanitized, null, 2) + "\n");
      await workspace.fs.writeFile(Uri.joinPath(dir, `${month}.json`), bytes);
    } catch (error) {
      throw new StorageWriteException("Konnte Daten nicht speichern", error instanceof Error ? error : new Error("Unbekannter Fehler"));
    }
  }

  /** Hilfsoperationen */

  createTimeEntry(issueKey: string, startAt: string, endAt: string | null = null): TimeEntry {
    return { id: crypto.randomUUID(), issueKey, startAt, endAt };
  }

  // --- private ---

  private async readMonth(month: string): Promise<TimesDataDTO | undefined> {
    try {
      const raw = await workspace.fs.readFile(Uri.joinPath(this.storageDir, `${month}.json`));
      return JSON.parse(new TextDecoder().decode(raw));
    } catch {
      return undefined;
    }
  }

  private async readMonthForWrite(month: string): Promise<TimesDataDTO | undefined> {
    let raw: Uint8Array;
    try {
      const stat = await workspace.fs.stat(Uri.joinPath(this.storageDir, `${month}.json`));
      if (!stat || stat.type !== FileType.File) return undefined;
      raw = await workspace.fs.readFile(Uri.joinPath(this.storageDir, `${month}.json`));
    } catch (error) {
      if ((error as { code?: string } | undefined)?.code === "FileNotFound") return undefined;
      throw error;
    }
    return JSON.parse(new TextDecoder().decode(raw));
  }

  private async getMonthFiles(): Promise<string[]> {
    const dirEntries = await workspace.fs.readDirectory(this.storageDir);
    return dirEntries
      .filter(([name]) => name.endsWith(".json"))
      .map(([filename]) => filename.replace(".json", ""));
  }

  private getFilenamesFromRange(startDate: string, endDate: string): string[] {
    const months = new Set<string>();
    const monthDiff = differenceInCalendarMonths(endDate, startDate);

    for (let i = 0; i <= monthDiff; i++) {
      months.add(format(addMonths(startDate, i), "yyyy-MM"));
    }

    return Array.from(months);
  }

  private mapTimesDataToDTO(data: TimesData): TimesDataDTO {
    const normalized: TimesDataDTO = {};
    for (const [date, entries] of Object.entries(data)) {
      normalized[date] = entries.map((entry) => ({
        ...entry,
        id: entry.id || crypto.randomUUID(),
      }));
    }
    return normalized;
  }
}
