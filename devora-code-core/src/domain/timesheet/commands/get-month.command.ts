import type { TimeEntry, TimesData } from "@devora-code/api/core";
import type { GetMonthCommand } from "@devora-code/api/timesheet";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { TimesheetService } from "../service/timesheet.service";

@RegisterCommand("timesheet:get-month")
export class GetMonthHandler implements CommandHandler<Record<string, TimeEntry[]>> {
  constructor(private command: GetMonthCommand) {}

  async execute(): Promise<TimesData> {
    const service = container.resolve(TimesheetService);
    return service.getMonth(this.command.payload.month);
  }
}
