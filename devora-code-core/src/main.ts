import "reflect-metadata";
import { container } from "tsyringe";
import * as vscode from "vscode";

import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { WorkpulseWebviewModule } from "@/modules/webview";

// module importieren, muessen wir tun damit sie im bundle sind
import "@/core/logger";
import "@/modules/timetracker";
import { SatelliteService } from "@/domain/satellite";

export async function activate(context: vscode.ExtensionContext) {
  container.registerInstance(EXTENSION_CONTEXT_TOKEN, context);

  const webviewDisposable = vscode.commands.registerCommand("devora-code.openWebview", () => {
    container.resolve(WorkpulseWebviewModule).openDashboard();
  });

  context.subscriptions.push(webviewDisposable);
  vscode.commands.executeCommand('devora-code.activated');

  const satelliteService = container.resolve(SatelliteService);
  return {
    registerSubModule: (satellite: any) => {
      satelliteService.registerSatellite(satellite);
    },
  };
}

export function deactivate(): void {
  // @TODO shutdown time tracker

  container.clearInstances();
}
