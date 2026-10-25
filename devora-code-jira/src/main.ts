import "reflect-metadata";

import type { ISatelliteController } from "@devora-code/sdk";
import { container } from "tsyringe";
import { JiraCommandRouter } from "./domain/routing/command.router";

// import commands so they are in bundle
import "./domain/commands/get-issue-detail.command";
import "./domain/commands/list.command";

export function activate(): ISatelliteController {
  const commandController = container.resolve(JiraCommandRouter);
  return commandController;
}

export function deactivate(): void {
  // noop;
}
