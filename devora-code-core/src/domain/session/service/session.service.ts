import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { SettingsService } from "@/infrastructure/settings";
import { TimesheetRepository, type TimeEntryDTO } from "@/infrastructure/timesheet";
import { normalizeTimeSpan, nowLocal } from "@/util/time";
import type { TimeEntry } from "@devora-code/api/core";
import type { ActiveSession } from "@devora-code/api/session";
import { inject, singleton } from "tsyringe";
import { ExtensionContext } from "vscode";

@singleton()
export class SessionService {
  private readonly storageKeyPrefix = "active-session";

  constructor(
    private readonly timesheetRepository: TimesheetRepository,
    private readonly settings: SettingsService,
    @inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext,
  ) {}

  private get storageKey(): string {
    const projectName = this.settings.get("projectName");
    return projectName ? `${this.storageKeyPrefix}:${projectName}` : this.storageKeyPrefix;
  }

  private get activeSession(): ActiveSession | null {
    return this.context.globalState.get<ActiveSession>(this.storageKey) ?? null;
  }

  // ========================================================================
  // Timer Control
  // ========================================================================

  async start(issueKey: string): Promise<ActiveSession> {
    if (this.activeSession && !this.activeSession.paused) {
      await this.stopTracking();
    }

    const rawEntry: TimeEntry = {
      issueKey,
      startAt: nowLocal(),
      endAt: null,
    };

    const [entryDto] = await this.timesheetRepository.write([rawEntry]);
    if (!entryDto) {
      throw new Error("Der Eintrag konnte nicht im Repository erstellt werden.");
    }

    const activeSession: ActiveSession = { paused: false, entry: entryDto };

    await this.context.globalState.update(this.storageKey, activeSession);
    return structuredClone(activeSession);
  }

  async resumeSession(): Promise<ActiveSession | null> {
    if (this.activeSession?.paused) {
      return this.start(this.activeSession.entry.issueKey);
    }
    return null;
  }

  async pauseActiveSession(): Promise<ActiveSession | null> {
    if (this.activeSession) {
      const writeEntries = normalizeTimeSpan({ ...this.activeSession.entry, endAt: nowLocal() });
      await this.timesheetRepository.write(writeEntries);

      await this.context.globalState.update(this.storageKey, { ...this.activeSession, paused: true });
      return this.activeSession;
    }
    return null;
  }

  /**
   * Stoppt den aktuellen Timer.
   */
  async stopTracking(): Promise<TimeEntryDTO[] | null> {
    if (!this.activeSession) return null;

    // Zeit-Entry beenden – die ID ist bereits im globalState, kein Query nötig
    const writeEntries = normalizeTimeSpan({ ...this.activeSession.entry, endAt: nowLocal() });
    await this.timesheetRepository.write(writeEntries);

    await this.context.globalState.update(this.storageKey, undefined);
    return writeEntries as TimeEntryDTO[];
  }

  // ========================================================================
  // Session Reset
  // ========================================================================

  /**
   * Setzt die Session komplett zurück: aktiven Timer stoppen und globalState leeren.
   * Für den Fall dass rumgefummelt wurde und der Timer hängen bleibt.
   */
  async resetSession(): Promise<boolean> {
    if (this.activeSession) {
      // Zeit-Entry im Repo beenden
      const writeEntries = normalizeTimeSpan({ ...this.activeSession.entry, endAt: nowLocal() });
      await this.timesheetRepository.write(writeEntries);
    }
    await this.context.globalState.update(this.storageKey, undefined);
    return true;
  }

  // ========================================================================
  // State Helpers
  // ========================================================================
  getActiveTimer(): ActiveSession | null {
    return this.activeSession;
  }
}
