import { DevoraCodeSettings } from "@devora-code/sdk";
import { singleton } from "tsyringe";
import type { GitHubSettings } from "./settings";

@singleton()
export class GitHubSettingsService extends DevoraCodeSettings<GitHubSettings> {
  protected key = "devora-code.github";
}
