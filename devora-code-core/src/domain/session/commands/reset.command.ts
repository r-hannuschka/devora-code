import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { SessionService } from "../service/session.service";

@RegisterCommand("session:clear")
export class ResetSessionHandler implements CommandHandler<boolean> {
  async execute(): Promise<boolean> {
    const service = container.resolve(SessionService);
    return service.resetSession();
  }
}
