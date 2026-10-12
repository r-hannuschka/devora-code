import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry } from "@devora-code/api";
import { addMonths, format } from "date-fns";
import { inject, singleton } from "tsyringe";
import { FileType, Uri, workspace, type ExtensionContext } from "vscode";
import { StorageWriteException } from "./exceptions/storage-write.exception";
import type { TimeEntryDTO, TimesDataDTO } from "./model/time-entry.dto";

@singleton()
export class TimesheetRepository {
  private readonly encoder = new TextEncoder();
  private readonly storageDir: Uri;

  constructor(@inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext) {
    this.storageDir = Uri.joinPath(context.globalStorageUri, "booking-data");
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

    for (const month of fileNames) {
      const monthData = await this.readMonth(month);
      if (!monthData) continue;

      for (const [date, entries] of Object.entries(monthData)) {
        if (date >= startDate && date <= endDate) {
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

  async write(entries: TimeEntry[]): Promise<TimeEntryDTO[]> {
    const buffer = new Map<string, TimesDataDTO>();
    const written: TimeEntryDTO[] = [];

    // 1. Schütze historische Daten: Bestehende Dateien vorab einlesen
    for (const entry of entries) {
      const yearMonth = format(entry.startAt, "yyyy-MM");
      if (!buffer.has(yearMonth)) {
        const existingData = await this.readMonth(yearMonth);
        buffer.set(yearMonth, existingData ?? {});
      }
    }

    // 2. Neue Einträge in den Buffer mergen
    for (const entry of entries) {
      const dto = { ...entry, id: entry.id ?? crypto.randomUUID() };
      const yearMonth = format(entry.startAt, "yyyy-MM");
      const day = format(entry.startAt, "yyyy-MM-dd");

      const currentMonthData = buffer.get(yearMonth)!;
      const currentDayEntries = currentMonthData[day] ?? [];

      // Falls ID schon existiert (Update), alten Eintrag ersetzen, sonst anhängen
      const existingIndex = currentDayEntries.findIndex((e) => e.id === dto.id);
      if (existingIndex !== -1) {
        currentDayEntries[existingIndex] = dto;
      } else {
        currentDayEntries.push(dto);
      }

      currentMonthData[day] = currentDayEntries;
      written.push(dto);
    }

    // 3. Parallel auf die Platte feuern – blockiert deine Webview UI nicht!
    const writePromises = Array.from(buffer.entries()).map(([fileName, data]) =>
      this.writeMonth(fileName, data).catch((error) => {
        console.error(`Fehler beim Speichern von ${fileName}:`, error);
      }),
    );
    await Promise.all(writePromises);

    return written;
  }

  // FIX: Kalender-Rundungsfehler bei date-fns eliminiert
  private getFilenamesFromRange(startDate: string, endDate: string): string[] {
    const months = new Set<string>();
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      months.add(format(current, "yyyy-MM"));
      current = addMonths(current, 1);
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
