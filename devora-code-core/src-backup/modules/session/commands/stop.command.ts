import type { TimeEntryDTO } from "@/core/infrastructure";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { SessionService } from "../domain/session.service";

@RegisterCommand("session:stop")
export class StopSessionHandler implements CommandHandler<TimeEntryDTO[] | null> {
  async execute(): Promise<TimeEntryDTO[] | null> {
    const service = container.resolve(SessionService);
    return service.stopTracking();
  }
}
