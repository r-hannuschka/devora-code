import { NotificationService } from "@/infrastructure/notification";
import type { TimesheetRestoreBackupCommand, TimesheetRestoreBackupPayload } from "@devora-code/api/timesheet";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";
import { TimesheetBackupService } from "../service/timesheet-backup.service";

@RegisterCommand("timesheet:restore-backup")
export class TimesheetRestoreBackupHandler implements CommandHandler<void> {
  constructor(private readonly command: TimesheetRestoreBackupCommand) {}

  async execute(): Promise<void> {
    const notificationService = container.resolve(NotificationService);
    const backupService = container.resolve(TimesheetBackupService);

    try {
      await backupService.restore(this.command.payload.file);
      notificationService.showInfo(`[Timesheet]: Backup wurde erfolgreich wieder hergestellt.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      notificationService.showError(`[Timesheet]: restore backup ist fehl geschlagen:\n\n${message}`);
      throw error;
    }
  }
}
