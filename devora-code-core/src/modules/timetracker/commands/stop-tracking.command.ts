import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { TimeTrackerService } from "../domain/time-tracker.service";

@RegisterCommand("timetracker:stop-tracking")
export class StopTrackingHandler implements CommandHandler {
  async execute(): Promise<void> {
    const service = container.resolve(TimeTrackerService);
    return service.stopTracking();
  }
}
