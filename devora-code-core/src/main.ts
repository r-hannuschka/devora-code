import "reflect-metadata";

import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { CommandRouter } from "@/domain/routing";
import { SatelliteService } from "@/domain/satellite";
import type { TimesheetSyncFromRawCommand } from "@/domain/timesheet/commands";
import { WebviewModule } from "@/domain/webview";
import { container } from "tsyringe";
import * as vscode from "vscode";

// module importieren, muessen wir tun damit sie im bundle sind
import "./app.module";

export async function activate(context: vscode.ExtensionContext) {
  container.registerInstance(EXTENSION_CONTEXT_TOKEN, context);
  const commandRouter = container.resolve(CommandRouter);

  const webviewDisposable = vscode.commands.registerCommand("devora-code.openWebview", () => {
    container.resolve(WebviewModule).openDashboard();
  });

  (vscode.commands.registerCommand("devora-code.timesheet-sync-raw", () => {
    const command: TimesheetSyncFromRawCommand = {
      id: crypto.randomUUID(),
      type: "timesheet:sync-from-raw",
    };
    commandRouter.execute(command);
  }),
    context.subscriptions.push(webviewDisposable));
  vscode.commands.executeCommand("devora-code.activated");

  const satelliteService = container.resolve(SatelliteService);
  return {
    registerSubModule: (satellite: any) => {
      satelliteService.registerSatellite(satellite);
    },
  };
}

export function deactivate(context: vscode.ExtensionContext): void {
  // @TODO shutdown time tracker
  container.clearInstances();
}
