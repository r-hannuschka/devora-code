
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { AddEntryCommand, TimeEntry } from "@devora-code/api";
import { container } from "tsyringe";
import { TimeTrackerService } from "../domain/time-tracker.service";

@RegisterCommand("timetracker:add-entry")
export class AddEntryHandler implements CommandHandler<TimeEntry> {

  private readonly timetrackerService = container.resolve(TimeTrackerService);

  constructor(private command: AddEntryCommand) {}

  async execute(): Promise<TimeEntry> {
    const { payload } = this.command;

    if (!payload) {
      throw new Error("Es wurden keine Daten uebergeben");
    }

    // KOLLISIONS-CHECK: Wir blockieren den Vorzug, bevor Müll auf die Platte geht
    if (payload.endAt) {
      await this.guardAgainstCollision(payload.startAt, payload.endAt);
    }

    // Wenn payload.date gebraucht wird, passe das an; sonst reichen wir startAt/endAt weiter
    return this.timetrackerService.addEntry(payload.issueKey, payload.startAt, payload.endAt);
  }

  /**
   * Prüft zeitliche Überschneidungen mit existierenden Einträgen im gleichen Zeitraum.
   */
  private async guardAgainstCollision(
    newStartIso: string, 
    newEndIso: string
  ): Promise<void> {
    // 1. Nutzt deine optimierte date-fns Range-Query!
    const period = await this.timetrackerService.getPeriod(newStartIso, newEndIso);
    
    const startNew = new Date(newStartIso).getTime();
    const endNew = new Date(newEndIso).getTime();

    // 2. Standard-Überschneidungs-Formel: (StartA < EndB) && (EndA > StartB)
    for (const existing of period.entries) {
      const startExisting = new Date(existing.startAt).getTime();
      const endExisting = new Date(existing.endAt ?? new Date()).getTime();

      if (startNew < endExisting && endNew > startExisting) {
        throw new Error(
          `Zeitkonflikt: Der Eintrag überschneidet sich mit einer Buchung für '${existing.issueKey}'.`
        );
      }
    }
  }
}
