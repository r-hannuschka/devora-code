import "reflect-metadata";

import type { ISatelliteController } from "@devora-code/sdk";
import { container } from "tsyringe";
import { GitHubCommandRouter } from "./domain/routing/command.router";

// import commands so they are in bundle
import "./domain/commands/list.command";
import "./domain/commands/get-issue-detail.command";

export function activate(): ISatelliteController {
  const commandController = container.resolve(GitHubCommandRouter);
  return commandController;
}

export function deactivate(): void {
  // noop;
}
