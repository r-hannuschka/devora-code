import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { TimeEntry } from "@devora-code/api/core";
import { container } from "tsyringe";
import { SessionService } from "../domain/session.service";

@RegisterCommand("session:get-active")
export class GetActiveTimerHandler implements CommandHandler<TimeEntry | null> {
  async execute(): Promise<TimeEntry | null> {
    const service = container.resolve(SessionService);
    return service.getActiveTimer();
  }
}
