import { LoggerService } from "@/infrastructure/logger";
import { SettingsService } from "@/infrastructure/settings";
import { resolveWorkspaceUri } from "@devora-code/sdk";
import { singleton } from "tsyringe";
import { FileType, Uri, workspace } from "vscode";

@singleton()
export class TimesheetBackupRepository {
  private backupDir: Uri | null = null;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly loggerService: LoggerService,
  ) {}

  getStorageDirectoy() {
    return this.backupStorageDir.fsPath;
  }

  private get backupStorageDir(): Uri {
    if (!this.backupDir) {
      this.backupDir = resolveWorkspaceUri(this.settingsService.get("backupStorageDir"), "./.devora-code/backups");
    }

    return this.backupDir;
  }

  async list(): Promise<Uri[]> {
    try {
      const dirEntries = await workspace.fs.readDirectory(this.backupStorageDir);
      return dirEntries.map(([name]) => Uri.joinPath(this.backupStorageDir, name));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.loggerService.error(`[Timesheet]: could not list backup files. ${message}`);
      throw error;
    }
  }

  async write(fileName: string, bytes: Uint8Array) {
    try {
      if (!(await this.directoryExists())) {
        await this.createBackupDirectory();
      }

      await workspace.fs.writeFile(Uri.joinPath(this.backupStorageDir, fileName), bytes);
      this.loggerService.info(`[Timesheet]: created backup under "${this.backupStorageDir.fsPath}/${fileName}"`);
    } catch (error) {
      this.loggerService.error(`[Timesheet]: could not write backup file ${fileName} to ${this.backupStorageDir.fsPath}`);
      throw error;
    }
  }

  async read(filename: string): Promise<Uint8Array> {
    try {
      if (!this.backupExists(filename)) {
        throw new Error(`Backup with name "${filename}" does not exists under directory ${this.backupStorageDir}`);
      }

      const uri = Uri.joinPath(this.backupStorageDir, filename);
      return workspace.fs.readFile(uri);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown error occured";
      this.loggerService.error(`[Timesheet]: ${message}`);
      throw error;
    }
  }

  private async directoryExists(): Promise<boolean> {
    try {
      const stat = await workspace.fs.stat(this.backupStorageDir);
      return stat.type === FileType.Directory;
    } catch {
      return false;
    }
  }

  private async backupExists(filename: string): Promise<boolean> {
    if (!(await this.directoryExists())) {
      return false;
    }

    if (!filename.endsWith(".zip")) {
      return false;
    }

    const stat = await workspace.fs.stat(Uri.joinPath(this.backupStorageDir, filename));
    if (stat.type !== FileType.File) {
      return false;
    }
    return true;
  }

  private async createBackupDirectory() {
    try {
      await workspace.fs.createDirectory(this.backupStorageDir);
      this.loggerService.info(`[Timesheet]: created new backup directory "${this.backupStorageDir.fsPath}"`);
    } catch (error) {
      this.loggerService.error(`[Timesheet]: could not create backup directory ${this.backupStorageDir.fsPath}`);
      throw error;
    }
  }
}
