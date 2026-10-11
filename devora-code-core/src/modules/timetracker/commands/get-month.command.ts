import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { TimeEntry, TimesData } from "@devora-code/api";
import { container } from "tsyringe";
import { TimeTrackerService } from "../domain/time-tracker.service";

interface GetMonthCommand {
  type: "timetracker:get-month";
  payload: { month: string };
}

@RegisterCommand("timetracker:get-month")
export class GetMonthHandler implements CommandHandler<Record<string, TimeEntry[]>> {
  constructor(private command: GetMonthCommand) {}

  async execute(): Promise<TimesData> {
    const service = container.resolve(TimeTrackerService);
    return service.getMonth(this.command.payload.month);
  }
}
