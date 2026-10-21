import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import type { TimeEntry } from "@devora-code/api/core";
import { container } from "tsyringe";
import { SessionService } from "../service/session.service";

@RegisterCommand("session:get-active")
export class GetActiveTimerHandler implements CommandHandler<TimeEntry | null> {
  async execute(): Promise<TimeEntry | null> {
    const service = container.resolve(SessionService);
    return service.getActiveTimer();
  }
}
