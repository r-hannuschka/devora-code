import type { Command, CommandErrorResponse } from "@devora-code/api/core";
import type { ISatelliteController } from "@devora-code/sdk";
import { CommandController } from "@devora-code/sdk";
import { container, injectable } from "tsyringe";

@injectable()
export class GitHubCommandRouter implements ISatelliteController {
  private readonly commandController = container.resolve(CommandController);

  readonly id = "GitHubModule";

  async handleHostCommand(command: Command) {
    if (this.commandController.hasCommandHandler(command.type)) {
      return this.commandController.exec(command);
    }

    return {
      code: 404,
      error: new Error(`Could not find command ${command.type} inside GitHub Satellite Controller.`),
      id: command.id,
    } satisfies CommandErrorResponse;
  }
}
