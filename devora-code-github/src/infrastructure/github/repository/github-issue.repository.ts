import type { IssueDetail, IssueList } from "@devora-code/api/issue";
import { singleton } from "tsyringe";
import { GitHubApiClient } from "../client/github-api.client";
import { GitHubIssueMapper } from "../mapper/github-issue.mapper";

/**
 * Retrieves raw GitHub issues from the API client and maps them to domain models.
 * Resolves the issue count and open-issue count in parallel for efficiency.
 */
@singleton()
export class GitHubIssueRepository {
  constructor(
    private readonly apiClient: GitHubApiClient,
    private readonly issueMapper: GitHubIssueMapper,
  ) {}

  /**
   * Fetches issues from the API client and maps them to clean domain DTOs.
   */
  async listIssues(page: number = 1): Promise<IssueList> {
    const [rawIssues, total] = await Promise.all([this.apiClient.listIssues(page), this.apiClient.openIssueCount()]);

    return {
      data: rawIssues.map((raw) => this.issueMapper.mapToIssueListItem(raw)),
      count: rawIssues.length,
      total: total,
    };
  }

  /**
   * Fetches issues from the API client and maps them to clean domain DTOs.
   */
  async queryByKey(key: number): Promise<IssueDetail> {
    const data = await this.apiClient.getIssue(key);
    return this.issueMapper.mapToIssueDetail(data);
  }
}
