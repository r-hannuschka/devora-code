import { CommandController } from "@devora-code/sdk/command";
import type { ISatelliteController } from "@devora-code/sdk/core";
import type { Command } from "@devora-code/api";
import { container, injectable } from "tsyringe";

import "./commands/get-focus-task";
import "./commands/get-issue-detail.command";
import "./commands/list.command";

@injectable()
export class JiraCommandController implements ISatelliteController {
  private readonly commandController = container.resolve(CommandController);

  public readonly id = "JiraModule";

  public readonly commands = ["issues:list", "issues:get-detail", "focus:get-task"] as const;

  public handleHostCommand(command: Command) {
    return this.commandController.exec(command);
  }
}
