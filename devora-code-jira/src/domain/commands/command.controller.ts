import type { Command } from "@devora-code/api/core";
import type { ISatelliteController } from "@devora-code/sdk";
import { CommandController } from "@devora-code/sdk";
import { container, injectable } from "tsyringe";

import "./get-focus-task";
import "./get-issue-detail.command";
import "./list.command";

@injectable()
export class JiraCommandController implements ISatelliteController {
  private readonly commandController = container.resolve(CommandController);

  public readonly id = "JiraModule";

  public readonly commands = ["issues:list", "issues:get-detail", "focus:get-task"] as const;

  public handleHostCommand(command: Command) {
    return this.commandController.exec(command);
  }
}
