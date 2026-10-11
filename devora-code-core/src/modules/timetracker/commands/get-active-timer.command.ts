import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { TimeEntry } from "@devora-code/api";
import { container } from "tsyringe";
import { TimeTrackerService } from "../domain/time-tracker.service";

@RegisterCommand("timetracker:get-active-timer")
export class GetActiveTimerHandler implements CommandHandler<TimeEntry | null> {
  async execute(): Promise<TimeEntry | null> {
    const service = container.resolve(TimeTrackerService);
    return service.getActiveTimer();
  }
}
