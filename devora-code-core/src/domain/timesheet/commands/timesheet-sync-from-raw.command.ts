import { NotificationService } from "@/infrastructure/notification";
import type { Command } from "@devora-code/api/core";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { commands, window, workspace } from "vscode";
import { TimesheetService } from "../service/timesheet.service";
import { LoggerService } from "@/infrastructure/logger";

export type TimesheetSyncFromRawCommand = Command<"timesheet:sync-from-raw">;

@RegisterCommand("timesheet:sync-from-raw")
export class TimesheetSyncFromRawHandler implements CommandHandler<void> {
  private readonly notificationService = container.resolve(NotificationService);
  private readonly loggerService = container.resolve(LoggerService);

  async execute(): Promise<void> {
    const activeEditor = window.activeTextEditor;
    const activeDocument = activeEditor?.document;

    if (!activeDocument || !activeDocument.fileName.endsWith(".devora-timesheet")) {
      return;
    }

    try {
      const content = activeDocument.getText();
      const raw = JSON.parse(content);

      const timesheetService = container.resolve(TimesheetService);
      await timesheetService.syncFromRaw(raw);

      // close active Editor
      await commands.executeCommand(`workbench.action.closeActiveEditor`);

      // Delete synced timesheet file
      await workspace.fs.delete(activeDocument.uri, { useTrash: false, recursive: false });
      this.notificationService.showInfo(`[Devora Code]: Timesheet sync successful ${activeDocument.fileName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.loggerService.error(`[Timesheet]: synchronisation von ${activeDocument.fileName} ist fehl geschlagen`, message)
      throw new Error(`[Timesheet]: could not sync file ${activeDocument.fileName}. Error: ${message}`);
    }
  }
}
