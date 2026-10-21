import type { TimeEntry } from "@devora-code/api/core";
import type { TimesheetAddEntryCommand, TimesheetAddEntryPayload } from "@devora-code/api/timesheet";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { TimesheetService } from "../service/timesheet.service";
import { analyzeCollision, CollisionResolution } from "../util/collision";

@RegisterCommand("timesheet:add-entry")
export class AddEntryHandler implements CommandHandler<TimeEntry[]> {
  private readonly timesheetService = container.resolve(TimesheetService);

  constructor(private command: TimesheetAddEntryCommand) {}

  async execute(): Promise<TimeEntry[]> {
    const { payload } = this.command;

    const period = await this.timesheetService.getPeriod(payload.startAt, payload.endAt);
    if (period.count === 0) {
      return this.addEntry(payload);
    }

    const collision = analyzeCollision(period.entries, payload.startAt, payload.endAt);
    switch (collision.resolution) {
      case CollisionResolution.SPLIT: {
        return this.timesheetService.splitActiveTimer(payload, collision.conflictingEntry!);
      }

      case CollisionResolution.NONE: {
        return this.addEntry(payload);
      }

      case CollisionResolution.BLOCK: {
        throw new Error(
          `[Timetracker]: Zeitkonflikt: Der Eintrag überschneidet sich mit einer Buchung für: ${collision.conflictingEntry?.issueKey}.`,
        );
      }

      default:
        throw new Error("[Timetracker:AddEntry]: Unbekannte Kollisionsaufloesung");
    }
  }

  private addEntry({ startAt, issueKey, endAt }: TimesheetAddEntryPayload) {
    return this.timesheetService.addEntry(issueKey, startAt, endAt);
  }
}
