import { JiraSettingsService } from "@/infrastructure/settings";
import type { IssueDetail, IssueListItem, IssueStatus, IssueType } from "@devora-code/api/issue";
import { singleton } from "tsyringe";
import { JiraSettings } from "../../settings/settings";
import type { IssueListItemDTO } from "../dtos/jira-issue-list.dto";
import type { JiraIssueDTO } from "../dtos/jira-issue.dto";

/**
 * Mapping — extrahiert die Typ-/Status-Resolution aus den Repositories.
 *
 * Liest IssueTypeMapping und StatusMapping aus den Settings und
 * mapi Jira-Namen auf die internen Typen/Status.
 */
@singleton()
export class JiraIssueMapper {
  private readonly issueMappings: JiraSettings["issueTypeMapping"] | null;
  private readonly issueMapKeys: (keyof JiraSettings["issueTypeMapping"])[];

  private readonly statusMappings: JiraSettings["statusMapping"] | null;
  private readonly statusKeys: (keyof JiraSettings["statusMapping"])[];

  constructor(private readonly settingsService: JiraSettingsService) {
    this.issueMappings = this.settingsService.get("issueTypeMapping");
    this.issueMapKeys = Object.keys(this.issueMappings ?? {}) as (keyof JiraSettings["issueTypeMapping"])[];

    this.statusMappings = this.settingsService.get("statusMapping");
    this.statusKeys = Object.keys(this.statusMappings ?? {}) as (keyof JiraSettings["statusMapping"])[];
  }

  /**
   * Mappt ein schlanke Issue (vom JQL-Search-Endpoint) auf IssueListItem.
   */
  mapToIssueListItem(dto: IssueListItemDTO): IssueListItem {
    const tracking = dto.fields.timetracking;

    return {
      key: dto.key,
      summary: dto.fields.summary,
      issueType: this.resolveIssueType(dto.fields.issuetype.name),
      priority: dto.fields.priority,
      status: this.resolveStatus(dto.fields.status.name),
      remainingTimeSeconds: tracking?.remainingEstimateSeconds ?? 0,
      timeSpentSeconds: tracking?.timeSpentSeconds ?? 0,
      url: "",
    };
  }

  /**
   * Mappt ein volles Jira Issue-Response (GET /issue/{key}) auf IssueDetail.
   */
  mapToIssueDetail(dto: JiraIssueDTO): IssueDetail {
    const fields = dto.fields;
    const timetracking = fields.timetracking;
    const status = fields.status;

    return {
      key: dto.key,
      summary: fields.summary,
      description: fields.description ?? null,
      issueType: this.resolveIssueType(fields.issuetype.name),
      status: this.resolveStatus(status?.name ?? ""),
      statusCategory: status?.statusCategory.name ?? "",
      priority: fields.priority,
      assignee: fields.assignee?.displayName ?? null,
      dueDate: fields.duedate ?? null,
      remainingTimeSeconds: timetracking.remainingEstimateSeconds ?? 0,
      timeSpentSeconds: timetracking.timeSpentSeconds ?? 0,
      url: dto.self,
    };
  }

  // ────────────────────────────────────────────────────────────
  // Typ-/Status-Resolution (geteilt)
  // ────────────────────────────────────────────────────────────

  private resolveIssueType(issuetypeName: string): IssueType {
    if (this.issueMapKeys.length === 0 || !this.issueMappings) {
      return "FEATURE";
    }

    const mapped = this.issueMappings[issuetypeName as keyof JiraSettings["issueTypeMapping"]];

    if (mapped) {
      return mapped as IssueType;
    }

    // TODO: notify logger we did not find any matching label
    return "FEATURE";
  }

  private resolveStatus(statusName: string): IssueStatus {
    if (this.statusKeys.length === 0 || !this.statusMappings) {
      return "TO_DO";
    }

    const mapped = this.statusMappings[statusName as keyof JiraSettings["statusMapping"]];

    if (mapped) {
      return mapped as IssueStatus;
    }

    console.warn(`[Unmapped status]: "${statusName}"`);
    return "TO_DO";
  }
}
