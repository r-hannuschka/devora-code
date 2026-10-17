import { singleton } from "tsyringe";
import { workspace } from "vscode";
import type { StatusMapping, IssueTypeMapping } from "@devora-code/api/issue";

export type SettingKey =
  | "JIRA_API_URL"
  | "JIRA_API_TOKEN"
  | "JIRA_USER_NAME"
  | "JIRA_PROJECT_KEY"
  | "ISSUE_TYPE_MAPPING"
  | "STATUS_MAPPING";

@singleton()
export class SettingsService {
  get(key: "JIRA_API_URL"): string | undefined;
  get(key: "JIRA_API_TOKEN"): string | undefined;
  get(key: "JIRA_USER_NAME"): string | undefined;
  get(key: "JIRA_PROJECT_KEY"): string | undefined;
  get(key: "ISSUE_TYPE_MAPPING"): IssueTypeMapping;
  get(key: "STATUS_MAPPING"): StatusMapping;
  get(key: SettingKey): unknown {
    return process.env[key] ?? workspace.getConfiguration("devora-code").get(key);
  }
}
