import { GitHubSettingsService } from "@/infrastructure/settings";
import type { IssueDetail, IssueListItem, IssueStatus, IssueType } from "@devora-code/api/issue";
import { singleton } from "tsyringe";
import type { GitHubSettings } from "../../settings/settings";
import type { GitHubIssueDTO } from "../dto/github-issue.dto";

/**
 * Maps raw GitHub API issue data to domain issue models.
 * Resolves status and issue type from GitHub labels using configured mappings.
 */
@singleton()
export class GitHubIssueMapper {
  private readonly statusMappings: GitHubSettings["statusMap"] | null;
  private readonly statusKeys: (keyof GitHubSettings["statusMap"])[];

  private readonly issueMappings: GitHubSettings["issueTypeMap"] | null;
  private readonly issueMapKeys: (keyof GitHubSettings["issueTypeMap"])[];

  constructor(private readonly settingsService: GitHubSettingsService) {
    this.issueMappings = this.settingsService.get("issueTypeMap");
    this.issueMapKeys = Object.keys(this.issueMappings ?? {}) as (keyof GitHubSettings["issueTypeMap"])[];

    this.statusMappings = this.settingsService.get("statusMap");
    this.statusKeys = Object.keys(this.statusMappings ?? {}) as (keyof GitHubSettings["statusMap"])[];
  }

  mapToIssueListItem(issue: GitHubIssueDTO): IssueListItem {
    return {
      key: `#${issue.number}`,
      summary: issue.title ?? "",
      issueType: this.resolveIssueType(issue.labels),
      priority: {
        id: "",
        name: "normal"
      },
      status: this.resolveStatus(issue.labels),
      remainingTimeSeconds: 0,
      timeSpentSeconds: 0,
      url: issue.html_url
    };
  }

  mapToIssueDetail(issue: GitHubIssueDTO): IssueDetail {
    const data = this.mapToIssueListItem(issue);

    return {
      ...data,
      description: issue.body ?? '',
      statusCategory: '',
      assignee: issue.user?.login ?? 'unknown', 
      dueDate: null,
    };
  }

  /**
   * Resolves the issue type based on label mappings from settings.
   */
  private resolveIssueType(labels: GitHubIssueDTO["labels"]): IssueType {
    if (this.issueMapKeys.length === 0 || !this.issueMappings) {
      return "FEATURE";
    }

    const labelNames = labels.map((dto) => (typeof dto === "string" ? dto : (dto?.name ?? ""))).filter(Boolean);

    const matched = labelNames.find((name) => this.issueMapKeys.includes(name as keyof GitHubSettings["issueTypeMap"])) as
      | keyof GitHubSettings["issueTypeMap"]
      | undefined;

    if (matched && this.issueMappings[matched]) {
      return this.issueMappings[matched] as IssueType;
    }

    // TODO: notify logger we did not find any matching label
    return "FEATURE";
  }

  /**
   * Resolves the issue status based on label mappings from settings.
   */
  private resolveStatus(labels: GitHubIssueDTO["labels"]): IssueStatus {
    if (this.statusKeys.length === 0 || !this.statusMappings) {
      return "TO_DO";
    }

    const labelNames = labels.map((dto) => (typeof dto === "string" ? dto : (dto?.name ?? ""))).filter(Boolean);

    const matched = labelNames.find((name) => this.statusKeys.includes(name as keyof GitHubSettings["statusMap"])) as
      | keyof GitHubSettings["statusMap"]
      | undefined;

    if (matched && this.statusMappings[matched]) {
      return this.statusMappings[matched] as IssueStatus;
    }

    return "TO_DO";
  }
}
