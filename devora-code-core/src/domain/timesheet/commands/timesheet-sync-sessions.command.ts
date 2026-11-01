import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { SessionService } from "@/domain/session";
import { TimesheetSanitizerService } from "../service/timesheet-sanitizer.service";

@RegisterCommand("timesheet:sanitize-sessions")
export class TimesheetSyncSessionsHandler implements CommandHandler<void> {
  private readonly sanitizer = container.resolve(TimesheetSanitizerService);
  private readonly sessionService = container.resolve(SessionService);

  async execute(): Promise<void> {
    await this.sanitizer.closeOpenTimers();
    await this.sessionService.syncWithRepository();
  }
}
