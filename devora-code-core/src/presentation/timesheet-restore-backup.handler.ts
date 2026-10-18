import { CommandRouter } from "@/domain/routing";
import { NotificationService } from "@/infrastructure/notification";
import type { TimesheetRestoreBackupCommand } from "@devora-code/api/timesheet";
import crypto from "crypto";
import { singleton } from "tsyringe";
import * as vscode from "vscode";
import { TimesheetBackupService } from "../domain/timesheet/service/timesheet-backup.service";

@singleton()
export class TimesheetRestoreBackupUiHandler {
  constructor(
    private readonly backupService: TimesheetBackupService,
    private readonly notificationService: NotificationService,
    private readonly commandRouter: CommandRouter,
  ) {}

  /**
   * Öffnet das native VS Code QuickPick und stößt bei Auswahl den Command-Router an.
   */
  async selectBackup(): Promise<void> {
    try {
      // 1. Loader anzeigen während das Repository scannt
      const backupUris = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Devora Code: Loading backups ...",
          cancellable: false,
        },
        async () => {
          return await this.backupService.list();
        },
      );

      if (backupUris.length === 0) {
        this.notificationService.showInfo("Keine Backups im Backup-Verzeichnis gefunden.");
        return;
      }

      // 2. QuickPick Items vorbereiten
      const quickPickItems: vscode.QuickPickItem[] = backupUris.map(([path, name]) => ({
        label: `$(file-zip) ${name}`,
        description: "Timesheet Backup Archiv",
        detail: `Pfad: ${path}`,
      }));

      // 3. Dropdown anzeigen
      const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: "Wählen Sie das wiederherzustellende Backup aus...",
        ignoreFocusOut: true,
        title: "Backup Wiederherstellung",
      });

      if (!selectedItem) {
        return; // Nutzer hat ESC gedrückt
      }

      const cleanName = selectedItem.label.replace("\$(file-zip) ", "");
      const fullZipFileName = `${cleanName}.zip`;

      // 4. Command in den Router jagen
      const command: TimesheetRestoreBackupCommand = {
        id: crypto.randomUUID(),
        type: "timesheet:restore-backup",
        payload: {
          file: fullZipFileName,
        },
      };
      this.commandRouter.execute(command);
    } catch (error) {}
  }
}
