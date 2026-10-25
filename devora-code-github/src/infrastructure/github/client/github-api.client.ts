import { GitHubSettingsService } from "@/infrastructure/settings";
import { Octokit } from "@octokit/rest";
import { singleton } from "tsyringe";
import type { GitHubIssueDTO } from "../dto/github-issue.dto";

@singleton()
export class GitHubApiClient {
  private readonly client: Octokit;

  constructor(private readonly settings: GitHubSettingsService) {
    this.client = this.createClient();
  }

  private createClient(): Octokit {
    const token = this.settings.get("accessToken");
    const baseUrl = this.settings.get("baseUrl") || undefined;

    if (!token) {
      throw new Error("GitHub API-Token missing");
    }

    return new Octokit({
      auth: token,
      ...(baseUrl ? { baseUrl } : {}),
      log: {
        debug: () => {},
        info: () => {},
        warn: (msg) => console.warn(`[GitHub]: ${msg}`),
        error: (msg) => console.error(`[GitHub]: ${msg}`),
      },
    });
  }

  /**
   * Lists all open issues from the configured repository as DTOs
   */
  async listIssues(page = 1): Promise<GitHubIssueDTO[]> {
    const owner = this.settings.get("owner");
    const repo = this.settings.get("repo");

    if (!owner || !repo) {
      throw new Error("Owner and/or repo not defined");
    }

    try {
      const { data } = await this.client.rest.issues.listForRepo({
        owner,
        repo,
        per_page: 50,
        page,
        state: "open",
      });

      // Return the raw data array
      return data;
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  async openIssueCount() {
    const owner = this.settings.get("owner");
    const repo = this.settings.get("repo");

    if (!owner || !repo) {
      throw new Error("Owner and/or repo not defined");
    }

    const { data } = await this.client.rest.repos.get({ owner, repo });
    return data.open_issues_count;
  }

  /**
   * Fetches a single issue by number and returns it as a raw record
   */
  async getIssue(issueNumber: number): Promise<GitHubIssueDTO> {
    const owner = this.settings.get("owner");
    const repo = this.settings.get("repo");

    if (!owner || !repo) {
      throw new Error("Owner and/or repo not defined");
    }

    try {
      const { data } = await this.client.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return data;
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  private wrapError(error: unknown): Error {
    if (error && typeof error === "object" && ("status" in error || "response" in error || "request" in error)) {
      const err = error as any;
      const status = err.status ?? err.response?.status;
      const method = err.request?.method ?? err.config?.method;
      const url = err.request?.url ?? err.config?.url;

      return new Error(`[GitHub ${status || "?"}] ${method || "?"} ${url || "?"}: ${this.getUserMessage(status)}`);
    }

    if (error instanceof Error) return error;
    return new Error(String(error));
  }

  private getUserMessage(status: number): string {
    switch (status) {
      case 401:
        return "GitHub token is invalid or expired";
      case 403:
        return "Rate limit exceeded or no access";
      case 404:
        return "Repository or issue not found";
      default:
        return "GitHub request failed";
    }
  }
}
