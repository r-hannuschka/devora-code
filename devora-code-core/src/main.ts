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
import { TimesheetDocumentValidatorService } from "./domain/timesheet";
import type { TimesheetCreateBackupCommand, TimesheetRestoreBackupCommand } from "@devora-code/api/timesheet";
import { TimesheetRestoreBackupUiHandler } from "./presentation/timesheet-restore-backup.handler";

export async function activate(context: vscode.ExtensionContext) {
  container.registerInstance(EXTENSION_CONTEXT_TOKEN, context);
  const commandRouter = container.resolve(CommandRouter);

  // --- Enable Validation
  const timesheetDocumentValidationService = container.resolve(TimesheetDocumentValidatorService);
  timesheetDocumentValidationService.initialize();

  // --- Register Command Listeners
  const webviewDisposable = [
    // --- open devora code dashboard
    vscode.commands.registerCommand("devora-code.openWebview", () => {
      container.resolve(WebviewModule).openDashboard();
    }),

    // --- sync open file with timesheet data storage
    vscode.commands.registerCommand("devora-code.timesheet-sync-raw", () => {
      const command: TimesheetSyncFromRawCommand = {
        id: crypto.randomUUID(),
        type: "timesheet:sync-from-raw",
      };
      commandRouter.execute(command);
    }),

    // --- create full backup
    vscode.commands.registerCommand("devora-code.create-backup", () => {
      const command: TimesheetCreateBackupCommand = {
        id: crypto.randomUUID(),
        type: "timesheet:create-backup",
      };
      commandRouter.execute(command);
    }),

    // --- restore backup
    vscode.commands.registerCommand("devora-code.restore-backup", () => {
      container.resolve(TimesheetRestoreBackupUiHandler).selectBackup();
    }),

    // --- we have to otherwise we get an error
    vscode.commands.registerCommand("devora-code.activated", () => void 0),
  ];
  context.subscriptions.push(...webviewDisposable);

  // --- notify satellits we are up and running
  vscode.commands.executeCommand("devora-code.activated");

  // --- register satellits
  const satelliteService = container.resolve(SatelliteService);
  return {
    registerSubModule: (satellite: any) => {
      satelliteService.registerSatellite(satellite);
    },
  };
}

export function deactivate(): void {
  container.clearInstances();

  // deactivate satellites
}
