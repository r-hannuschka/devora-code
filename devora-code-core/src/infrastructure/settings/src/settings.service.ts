import { singleton } from "tsyringe";
import { DevoraCodeSettings } from "@devora-code/sdk";

export const DEVORA_CODE_SERVICES = ['issues'] as const;
export type DevoraCodeServices = typeof DEVORA_CODE_SERVICES[number];

export interface CoreSettings {
  projectName: string;
  timesheetStorageDir: string;
  backupStorageDir: string;
  services: Record<DevoraCodeServices, string>;
}

@singleton()
export class SettingsService extends DevoraCodeSettings<CoreSettings> {
  protected key = 'devora-code';
}
