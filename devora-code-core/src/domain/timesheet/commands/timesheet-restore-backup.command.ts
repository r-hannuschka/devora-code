import { NotificationService } from "@/infrastructure/notification";
import type { TimesheetRestoreBackupPayload } from "@devora-code/api/timesheet";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import { container } from "tsyringe";
import { TimesheetBackupService } from "../service/timesheet-backup.service";

@RegisterCommand("timesheet:restore-backup")
export class TimesheetRestoreBackupHandler implements CommandHandler<void> {
  constructor(private readonly payload: TimesheetRestoreBackupPayload) {}

  async execute(): Promise<void> {
    const notificationService = container.resolve(NotificationService);
    const backupService = container.resolve(TimesheetBackupService);

    try {
      await backupService.restore(this.payload.file);
      notificationService.showInfo(`[Timesheet]: Backup erfolgreich wieder hergestellt.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      notificationService.showError(`[Timesheet]: Backup ist fehl geschlagen:\n\n${message}`);
      throw error;
    }
  }
}
