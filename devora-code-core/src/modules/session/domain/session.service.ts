import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimesheetRepository, type TimeEntryDTO } from "@/core/infrastructure";
import { normalizeTimeSpan, nowLocal } from "@/util/time";
import type { TimeEntry } from "@devora-code/api/core";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";

@singleton()
export class SessionService {
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
  async start(issueKey: string): Promise<TimeEntry> {
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
   * Stoppt den aktuellen Timer.
   */
  async stopTracking(): Promise<TimeEntryDTO[] | null> {
    const activeTimeEntry = this.context.globalState.get<TimeEntryDTO>(this.ACTIVE_TIME_ENTRY);
    if (!activeTimeEntry) return null;

    // End-Zeit setzen
    activeTimeEntry.endAt = nowLocal();

    // FIX: Normalisierte Einträge flach an das neue Repository übergeben
    const writeEntries = normalizeTimeSpan(activeTimeEntry);
    const entry = await this.repository.write(writeEntries);

    // Timer-State aufräumen
    await this.context.globalState.update(this.ACTIVE_TIME_ENTRY, undefined);

    return entry;
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
}
