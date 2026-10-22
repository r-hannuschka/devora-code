import type { ActiveSession } from "@devora-code/api/session";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { SessionService } from "../service/session.service";

@RegisterCommand("session:pause")
export class SessionPauseHandler implements CommandHandler<ActiveSession | null> {
  async execute(): Promise<ActiveSession | null> {
    const service = container.resolve(SessionService);
    return service.pauseActiveSession();
  }
}
