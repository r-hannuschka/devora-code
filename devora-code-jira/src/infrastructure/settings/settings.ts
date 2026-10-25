export interface JiraSettings {
  apiUrl: string;
  apiToken: string;
  userName: string;
  projectKey: string;
  issueTypeMapping: Record<string, "BUG" | "FEATURE">;
  statusMapping: Record<string, "TO_DO" | "IN_PROGRESS" | "TEST" | "DONE">;
}