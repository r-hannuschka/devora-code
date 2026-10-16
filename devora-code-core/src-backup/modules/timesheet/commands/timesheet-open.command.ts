import type { TimesheetOpenCommand } from "@devora-code/api/timesheet";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { Uri, ViewColumn, window, workspace } from "vscode";
import { TimesheetService } from "../domain/timesheet.service";

@RegisterCommand("timesheet:open")
export class TimesheetOpenHandler implements CommandHandler<void> {
  constructor(private command: TimesheetOpenCommand) {}

  async execute(): Promise<void> {
    const service = container.resolve(TimesheetService);
    const { payload } = this.command;

    const raw = await service.getRaw(payload.startAt, payload.endAt);
    const modifier = (key: string, value: unknown) => {
      if (key === "id") {
        return undefined;
      }
      return value;
    };
    const rawJSON = JSON.stringify(raw, modifier, 2);

    // 1. Prüfen, ob ein Workspace geöffnet ist
    const workspaceFolders = workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      window.showErrorMessage("Kein aktiver Workspace gefunden. Timesheet kann nicht geöffnet werden.");
      return;
    }

    // 2. Pfad direkt im Root-Verzeichnis des Projekts erstellen
    const projectRootUri = workspaceFolders[0]!.uri;
    const fileUri = Uri.joinPath(projectRootUri, `.timesheets/${payload.startAt}_${payload.endAt}.devora-timesheet`);

    try {
      await workspace.fs.writeFile(fileUri, Buffer.from(rawJSON, "utf8"));
      const document = await workspace.openTextDocument(fileUri);
      await window.showTextDocument(document, {
        preview: false,
        viewColumn: ViewColumn.Beside,
      });
    } catch (error) {
      window.showErrorMessage(`Fehler beim Erstellen der Timesheet-Datei: ${error}`);
    }
  }
}
