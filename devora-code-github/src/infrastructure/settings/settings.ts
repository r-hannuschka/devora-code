/**
 * GitHub Settings — configures the connection to a GitHub repository.
 *
 * Unlike Jira, GitHub has no workflow status.
 * Status is determined solely by labels.
 * "closed" Issues are always mapped to DONE.
 */
export interface GitHubSettings {
  /** GitHub Personal Access Token or GITHUB_TOKEN */
  accessToken: string;

  /** GitHub Enterprise API base URL (optional, empty = github.com) */
  baseUrl: string;

  /** GitHub Organization or username */
  owner: string;

  /** GitHub Repository name */
  repo: string;

  /** GitHub Labels → internal issue types (BUG | FEATURE) */
  issueTypeMap: Record<string, "BUG" | "FEATURE">;

  /**
   * GitHub Labels → internal status (TO_DO, IN_PROGRESS, TEST, DONE).
   * Only relevant for "open" Issues — "closed" Issues are always mapped to DONE.
   */
  statusMap: Record<string, "TO_DO" | "IN_PROGRESS" | "TEST" | "DONE">;
}
