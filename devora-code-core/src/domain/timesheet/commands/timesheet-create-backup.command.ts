import { NotificationService } from "@/infrastructure/notification";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { TimesheetBackupService } from "../service/timesheet-backup.service";

@RegisterCommand("timesheet:create-backup")
export class TimesheetCreateBackupHandler implements CommandHandler<void> {
  async execute(): Promise<void> {
    const notificationService = container.resolve(NotificationService);
    const backupService = container.resolve(TimesheetBackupService);

    try {
      await backupService.createBackup();
      notificationService.showInfo(`[Timesheet]: Backup erfolgreich`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      notificationService.showError(`[Timesheet]: Backup ist fehl geschlagen:\n\n${message}`);
      // --- Throw error so command bus propagate this as error response
      throw error;
    }
  }
}
