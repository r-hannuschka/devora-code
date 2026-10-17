import type { TimeEntry } from "@devora-code/api/core";
import type { StartSessionCommand } from "@devora-code/api/session";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { SessionService } from "../service/session.service";

@RegisterCommand("session:start")
export class StartSessionHandler implements CommandHandler<TimeEntry> {
  constructor(private command: StartSessionCommand) {}

  async execute(): Promise<TimeEntry> {
    const service = container.resolve(SessionService);
    const { payload } = this.command;

    if (!payload) {
      throw new Error("Es wurde kein IssueKey uebergeben");
    }

    return service.start(payload.issueKey);
  }
}
