import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import type { TimeEntry, TimesData } from "@devora-code/api";
import { inject, singleton } from "tsyringe";
import { ExtensionContext, Uri, workspace } from "vscode";
import { EntryNotFoundException } from "../domain/exceptions/entry-not-found.exception";
import { StorageWriteException } from "./exceptions/storage-write.exception";

/**
 * Repository für TimeTracker-Persistenz.
 *
 * Storage: pro Monat ne Datei (YYYY-MM.json) — verhindert riesige times.json.
 * Patterns: Lazy-Load, Transaction (Sammeln + Flush), Immutable Data
 */
@singleton()
export class TimesheetRepository {
  private readonly encoder = new TextEncoder();
  private readonly storageDir: Uri;

  private isDataInitialized = false;
  private data: TimesData = {};

  constructor(@inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext) {
    this.storageDir = Uri.joinPath(context.globalStorageUri, "booking-data");
    console.log(`[timetracker] Storage Dir: ${this.storageDir.fsPath}`);
  }

  // --- Read Operations ---

  /**
   * Alle Einträge eines Tages.
   * Direkt-Zugriff auf die Monat-Datei — kein Full-Load.
   */
  async getDay(date: string): Promise<TimeEntry[]> {
    const month = date.substring(0, 7);
    try {
      const data = await this.getMonthFile(month);
      return data[date] ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Alle Einträge (gesamte History).
   */
  async list(): Promise<TimesData> {
    return this.loadData();
  }

  /**
   * Einträge in Datumsbereich (inklusive Grenzen).
   * Range Query Pattern: Lädt nur die Monate die im Range liegen.
   */
  async getBetween(startDate: string, endDate: string): Promise<{ date: string; entries: TimeEntry[] }[]> {
    const results: { date: string; entries: TimeEntry[] }[] = [];
    const temp = new Date(startDate);

    while (temp <= new Date(endDate)) {
      const year = temp.getFullYear();
      const month = String(temp.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`;

      try {
        const data = await this.getMonthFile(monthKey);
        for (const [date, entries] of Object.entries(data)) {
          if (date >= startDate && date <= endDate) {
            results.push({ date, entries });
          }
        }
      } catch {
        // Monat existiert nicht, überspringen
      }

      temp.setMonth(temp.getMonth() + 1);
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Alle Einträge für ein spezifisches Issue über alle Tage.
   * Aggregation by Key Pattern: muss alle Monate durchsuchen.
   */
  async getByIssueKey(issueKey: string): Promise<{ date: string; entries: TimeEntry[] }[]> {
    const data = await this.loadData();
    const results: { date: string; entries: TimeEntry[] }[] = [];

    for (const [date, entries] of Object.entries(data)) {
      const matching = entries.filter((e) => e.issueKey === issueKey);
      if (matching.length > 0) {
        results.push({ date, entries: matching });
      }
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Alle Einträge eines spezifischen Monats.
   * Parameter: "2026-10" für Oktober 2026.
   */
  async getMonth(month: string): Promise<TimesData | undefined> {
    try {
      return await this.getMonthFile(month);
    } catch {
      console.debug(`[timetracker] Keine Einträge für ${month}`);
      return undefined;
    }
  }

  /**
   * Findet eine Entry nach ihrer ID und gibt Datum + Entry zurück.
   * ID-Lookup für Cross-Day Entries (Midnight-Split).
   */
  async findById(id: string): Promise<TimeEntry | null> {
    const data = await this.loadData();

    for (const [, entries] of Object.entries(data)) {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        return entry;
      }
    }
    return null;
  }

  // --- Write Operations (collected, flush at end) ---

  /**
   * Neue Entry hinzufügen und in Speicher aktualisieren.
   * Transaction Pattern: Sammeln (add), Flush (save).
   */
  async add(date: string, entry: TimeEntry): Promise<void> {
    const data = await this.loadData();
    const existing = data[date] ?? [];
    this.data = {
      ...data,
      [date]: [...existing, entry],
    };
  }

  /**
   * Setzt endAt für eine Entry (identifiziert über ID).
   * Transaction Pattern: ID-Lookup für Cross-Day Entries.
   */
  async stopTracking(id: string, endAt: string): Promise<void> {
    const data = await this.loadData();

    let foundDate: string | null = null;
    for (const [date, entries] of Object.entries(data)) {
      if (entries.some((e) => e.id === id)) {
        foundDate = date;
        break;
      }
    }

    if (!foundDate) {
      throw new EntryNotFoundException(`Eintrag mit ID ${id} nicht gefunden`);
    }

    const entries = data[foundDate]!;
    const newEntries = entries.map((entry) => {
      if (entry.id !== id) {
        return entry;
      }
      return { ...entry, endAt };
    });

    this.data = {
      ...data,
      [foundDate]: newEntries,
    };
  }

  /**
   * Löscht eine Entry.
   * Transaction Pattern: Sammeln, Flush später.
   */
  async deleteEntry(date: string, id: string): Promise<void> {
    const data = await this.loadData();
    if (!Array.isArray(data[date])) return;

    const entries = data[date];
    const newEntries = entries.filter((entry) => entry.id !== id);
    this.data = {
      ...data,
      [date]: newEntries,
    };
  }

  /**
   * Speichert alle ausstehenden Änderungen auf Disk.
   * Transaction Flush: Ein Schreib-Zugriff für alle Änderungen.
   */
  async save(): Promise<void> {
    if (this.isDataInitialized) {
      await this.saveData(this.data);
    }
  }

  // --- Private ---

  /**
   * Lädt Daten lazy und cached sie in this.data.
   *
   * Multi-File Pattern: Lädt alle YYYY-MM.json Dateien aus dem Storage-Verzeichnis
   * und merged sie zu einem einheitlichen TimesData-Objekt.
   * Backwards Compatibility: Falls keine Month-Dateien existieren, wird die
   * legacy times.json geladen (falls vorhanden).
   */
  private async loadData(): Promise<TimesData> {
    if (this.isDataInitialized) {
      return this.data;
    }

    const entries = await workspace.fs.readDirectory(this.storageDir);
    const monthFiles = entries.filter(([name]) => name.endsWith(".json"));

    // Lade alle Month-Dateien (YYYY-MM.json)
    for (const [filename] of monthFiles) {
      const uri = Uri.joinPath(this.storageDir, filename);
      try {
        const raw = await workspace.fs.readFile(uri);
        const fileData: TimesData = JSON.parse(new TextDecoder().decode(raw));
        this.data = { ...this.data, ...fileData };
      } catch {
        console.debug(`[timetracker] Konnte Datei ${filename} nicht laden, überspringe.`);
      }
    }

    this.isDataInitialized = true;
    return this.data;
  }

  /**
   * Schreibt Daten nach Month-Dateien auf Disk.
   *
   * Gruppierung: Alle Keys aus this.data nach Monat, pro Monat eine Datei.
   */
  private async saveData(data: TimesData): Promise<void> {
    try {
      const byMonth = new Map<string, TimesData>();

      // Gruppieren nach Monat
      for (const [date, entries] of Object.entries(data)) {
        const month = date.substring(0, 7); // "2026-10"
        if (!byMonth.has(month)) {
          byMonth.set(month, {});
        }
        byMonth.get(month)![date] = entries;
      }

      // Schreibe nur die Monate, die in this.data vorkommen
      for (const [month, monthData] of byMonth) {
        const uri = Uri.joinPath(this.storageDir, `${month}.json`);
        const bytes = this.encoder.encode(JSON.stringify(monthData) + "\n");
        await workspace.fs.writeFile(uri, bytes);
      }

      this.data = data;
    } catch (error) {
      throw new StorageWriteException("Konnte Daten nicht speichern", error instanceof Error ? error : new Error("Unbekannter Fehler"));
    }
  }

  /**
   * Lädt eine einzelne Month-Datei.
   */
  private async getMonthFile(month: string): Promise<TimesData> {
    const uri = Uri.joinPath(this.storageDir, `${month}.json`);
    const raw = await workspace.fs.readFile(uri);
    return JSON.parse(new TextDecoder().decode(raw));
  }
}
