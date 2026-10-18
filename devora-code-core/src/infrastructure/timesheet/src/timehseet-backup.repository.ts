import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { LoggerService } from "@/infrastructure/logger";
import AdmZip from "adm-zip";
import { basename, join } from "path";
import { inject, singleton } from "tsyringe";
import { FileType, Uri, workspace, type ExtensionContext } from "vscode";

@singleton()
export class TimesheetBackupRepository {
  private readonly backupDir: Uri;

  constructor(
    @inject(EXTENSION_CONTEXT_TOKEN) context: ExtensionContext,
    private readonly loggerService: LoggerService,
  ) {
    this.backupDir = Uri.joinPath(context.globalStorageUri, "backup");
  }

  getStorageDirectoy() {
    return this.backupDir.fsPath;
  }

  async list(): Promise<Uri[]> {
    try {
      const dirEntries = await workspace.fs.readDirectory(this.backupDir);
      return dirEntries.map(([name]) => Uri.joinPath(this.backupDir, name));
    } catch(error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.loggerService.error(`[Timesheet]: could not list backup files. ${message}`);
      throw error;
    }
  }

  async write(fileName: string, bytes: Uint8Array) {
    try {
      if (!(await this.directoryExists())) {
        await this.createBackupDirectory();
      }

      await workspace.fs.writeFile(Uri.joinPath(this.backupDir, fileName), bytes);
      this.loggerService.info(`[Timesheet]: created backup under "${this.backupDir.fsPath}/${fileName}"`);
    } catch (error) {
      this.loggerService.error(`[Timesheet]: could not write backup file ${fileName} to ${this.backupDir.fsPath}`);
      throw error;
    }
  }

  async read(filename: string): Promise<Uint8Array> {
    try {
      if (!this.backupExists(filename)) {
        throw new Error(`Backup with name "${filename}" does not exists under directory ${this.backupDir}`);
      }

      const uri = Uri.joinPath(this.backupDir, filename);
      return workspace.fs.readFile(uri);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown error occured";
      this.loggerService.error(`[Timesheet]: ${message}`);
      throw error;
    }
  }

  private async directoryExists(): Promise<boolean> {
    try {
      const stat = await workspace.fs.stat(this.backupDir);
      return stat.type === FileType.Directory;
    } catch {
      return false;
    }
  }

  private async backupExists(filename: string): Promise<boolean> {
    if (!this.directoryExists) {
      return false;
    }

    if (!filename.endsWith(".zip")) {
      return false;
    }

    const stat = await workspace.fs.stat(Uri.joinPath(this.backupDir, filename));
    if (stat.type !== FileType.File) {
      return false;
    }
    return true;
  }

  private async createBackupDirectory() {
    try {
      await workspace.fs.createDirectory(this.backupDir);
      this.loggerService.info(`[Timesheet]: created new backup directory "${this.backupDir.fsPath}"`);
    } catch (error) {
      this.loggerService.error(`[Timesheet]: could not create backup directory ${this.backupDir.fsPath}`);
      throw error;
    }
  }
}
