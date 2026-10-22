import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import type { ActiveSession } from "@devora-code/api/session";
import { container } from "tsyringe";
import { SessionService } from "../service/session.service";

@RegisterCommand("session:get-active")
export class GetActiveTimerHandler implements CommandHandler<ActiveSession | null> {
  async execute(): Promise<ActiveSession | null> {
    const service = container.resolve(SessionService);
    return service.getActiveTimer();
  }
}
