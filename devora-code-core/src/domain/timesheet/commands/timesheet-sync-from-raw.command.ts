import { basename } from "path";
import { LoggerService } from "@/infrastructure/logger";
import { NotificationService } from "@/infrastructure/notification";
import type { Command } from "@devora-code/api/core";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { commands, window, workspace } from "vscode";
import { TimesheetService } from "../service/timesheet.service";

export type TimesheetSyncFromRawCommand = Command<"timesheet:sync-from-raw">;

@RegisterCommand("timesheet:sync-from-raw")
export class TimesheetSyncFromRawHandler implements CommandHandler<void> {
  private readonly notificationService = container.resolve(NotificationService);
  private readonly loggerService = container.resolve(LoggerService);
  private readonly timesheetService = container.resolve(TimesheetService);

  async execute(): Promise<void> {
    const activeEditor = window.activeTextEditor;
    const activeDocument = activeEditor?.document;

    if (!activeDocument || !activeDocument.fileName.endsWith(".devora-timesheet")) {
      return;
    }

    try {
      const content = activeDocument.getText();
      const raw = JSON.parse(content);

      const [minDate, maxDate] = this.extractRange(activeDocument.fileName);
      await this.timesheetService.syncFromRaw(raw, { minDate, maxDate });

      // close active Editor
      await commands.executeCommand(`workbench.action.closeActiveEditor`);

      // Delete synced timesheet file
      await workspace.fs.delete(activeDocument.uri, { useTrash: false, recursive: false });
      this.notificationService.showInfo(`[Devora Code]: Timesheet sync successful ${activeDocument.fileName}`);

      this.loggerService.info(`[Timesheet]: Synchronisation erfolgreich fuer ${basename(activeDocument.fileName)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.loggerService.error(`[Timesheet]: synchronisation von ${activeDocument.fileName} ist fehl geschlagen. ${message}`);
      throw new Error(`[Timesheet]: could not sync file ${activeDocument.fileName}. Error: ${message}`);
    }
  }

  private extractRange(fileName: string): [string, string] {
    // Nur den Dateinamen ohne Pfad prüfen
    const baseName = basename(fileName);
    const regExp = /^(?<start>\d{4}-\d{2}-\d{2})_(?<end>\d{4}-\d{2}-\d{2})/;
    const match = baseName.match(regExp);

    if (match && match.groups) {
      const startDateStr = match.groups.start; // "2026-10-01"
      const endDateStr = match.groups.end; // "2026-10-31"

      if (!startDateStr || !endDateStr) {
        throw new Error("Invalid filename");
      }
      return [startDateStr, endDateStr];
    } else {
      throw new Error("Invalid filename");
    }
  }
}
