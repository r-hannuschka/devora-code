import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import type { SendLogCommand } from "@devora-code/api/logger";
import { container } from "tsyringe";
import { LoggerService } from "@/infrastructure/logger";

@RegisterCommand("logger:send-log")
export class SendLogHandler implements CommandHandler<void> {
  constructor(private command: SendLogCommand) {}

  execute(): void {
    const logger = container.resolve(LoggerService);
    const { payload } = this.command;

    if (!payload) {
      return;
    }

    logger.log(payload.level, payload.message, payload.context);
  }
}
