import { singleton } from "tsyringe";
import { DevoraCodeSettings } from "@devora-code/sdk";

export interface CoreSettings {
  projectName: string;
  timesheetStorageDir: string;
  backupStorageDir: string;
}

@singleton()
export class SettingsService extends DevoraCodeSettings<CoreSettings> {
  protected key = 'devora-code';
}
