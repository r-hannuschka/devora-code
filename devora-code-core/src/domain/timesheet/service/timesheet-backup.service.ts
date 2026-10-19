import { TimesheetBackupRepository, TimesheetRepository } from "@/infrastructure/timesheet";
import AdmZip from "adm-zip";
import { format, isMatch } from "date-fns";
import { basename, dirname, relative } from "path";
import { singleton } from "tsyringe";
import { Uri } from "vscode";

@singleton()
export class TimesheetBackupService {
  constructor(
    private readonly timesheetRepository: TimesheetRepository,
    private readonly timesheetBackupRepository: TimesheetBackupRepository,
  ) {}

  // --- list all existing backups
  async list(): Promise<[string, string][]> {
    const entries = await this.timesheetBackupRepository.list();
    const filtered = entries.filter((uri) => uri.fsPath.endsWith('.zip'))
    return filtered.map(({ fsPath }) => [fsPath, basename(fsPath)]);
  }

  // --- remove 1 backup file
  delete() {}

  // --- create backup from all files
  async createBackup() {
    const storageBasePath = this.timesheetRepository.getStorageUri().fsPath;
    const timesheetEntries = await this.timesheetRepository.list();

    if (timesheetEntries.length === 0) {
      return;
    }

    const zip = new AdmZip();
    for (const entry of timesheetEntries) {
      const relativePath = relative(storageBasePath, entry.fsPath);
      const zipFolder = dirname(relativePath);
      zip.addLocalFile(entry.fsPath, zipFolder === "." ? "" : zipFolder);
    }

    const buffer = zip.toBuffer();
    const fileName = `${format(Date.now(), "yyyy-MM-dd'T'HH-mm-ss")}.timesheet-backup.zip`;

    await this.timesheetBackupRepository.write(fileName, buffer);
  }

  async restore(file: string) {
    const buffer = await this.timesheetBackupRepository.read(file);
    const baseStorageUri = this.timesheetRepository.getStorageUri();
    const zip = new AdmZip(Buffer.from(buffer));
    const zipEntries = zip.getEntries();
    const errors = [];

    for (const entry of zipEntries) {
      try {
        if (entry.isDirectory) {
          continue; // Reine Ordner-Einträge überspringen
        }

        // --- resolve file name and relative path
        const relativeFilePath = entry.entryName;
        const fileName = basename(relativeFilePath, ".json");

        // --- validate file name
        if (!isMatch(fileName, "yyyy-MM")) {
          throw new Error(`Invalide file name found`);
        }

        // --- convert json to timesdata
        const fileBytes = entry.getData(); // Rohe Bytes der JSON-Datei
        const timesData = JSON.parse(fileBytes.toString());

        // --- get target directory
        const subFolder = dirname(relativeFilePath);
        const targetDir = subFolder === "." ? baseStorageUri : Uri.joinPath(baseStorageUri, subFolder);

        // --- write timesheet
        await this.timesheetRepository.writeFile(fileName, timesData, targetDir);
      } catch (error) {
        errors.push({ name: entry.entryName, error });
      }
    }

    return {
      success: errors.length === 0,
      errors: structuredClone(errors),
    };
  }
}
