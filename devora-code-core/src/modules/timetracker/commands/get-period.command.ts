import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { GetPeriodCommand, TimeEntryList } from "@devora-code/api";
import { container } from "tsyringe";
import { TimeTrackerService } from "../domain/time-tracker.service";

@RegisterCommand("timetracker:get-period")
export class GetPeriodHandler implements CommandHandler<TimeEntryList> {
  constructor(private command: GetPeriodCommand) {}

  async execute(): Promise<TimeEntryList> {
    const service = container.resolve(TimeTrackerService);
    const { payload } = this.command;

    if (!payload || !payload.startDate) {
      return { entries: [], count: 0, totalSeconds: 0 };
    }

    return service.getPeriod(payload.startDate, payload.endDate);
  }
}
