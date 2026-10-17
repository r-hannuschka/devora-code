import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { GetPeriodCommand, TimeEntryList } from "@devora-code/api/timesheet";
import { container } from "tsyringe";
import { TimesheetService } from "../service/timesheet.service";

@RegisterCommand("timesheet:get-period")
export class GetPeriodHandler implements CommandHandler<TimeEntryList> {
  constructor(private command: GetPeriodCommand) {}

  async execute(): Promise<TimeEntryList> {
    const service = container.resolve(TimesheetService);
    const { payload } = this.command;

    if (!payload || !payload.startDate) {
      return { entries: [], count: 0, totalSeconds: 0 };
    }

    return service.getPeriod(payload.startDate, payload.endDate);
  }
}
