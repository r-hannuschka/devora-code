import { DevoraCodeSettings } from "@devora-code/sdk";
import { singleton } from "tsyringe";
import type { JiraSettings } from "./settings";

@singleton()
export class JiraSettingsService extends DevoraCodeSettings<JiraSettings> {
  protected key = "devora-code.jira";
}
