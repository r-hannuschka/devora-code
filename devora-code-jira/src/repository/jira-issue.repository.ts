import type { IssueDetail } from "@devora-code/api/issue";
import { singleton } from "tsyringe";
import { JiraApiClient } from "../infrastructure/jira-api-client";
import type { JiraIssueDTO } from "../infrastructure/model/jira-issue.dto";

@singleton()
export class JiraIssueRepository {
  constructor(private readonly api: JiraApiClient) {}

  /**
   * Holt Details eines Issues via GET /rest/api/2/issue/{issueIdOrKey}
   * Mappt das API-DTO auf das Domänenmodell JiraIssue.
   */
  async getIssueByKey(issueKey: string): Promise<IssueDetail> {
    const response = await this.api.get<JiraIssueDTO>(`/issue/${issueKey}`);
    return this.map(response);
  }

  // ────────────────────────────────────────────────────────────
  // Mapping
  // ────────────────────────────────────────────────────────────

  private map(dto: JiraIssueDTO): IssueDetail {
    const fields = dto.fields;
    const timetracking = fields.timetracking;
    const status = fields.status;

    return {
      key: dto.key,
      summary: fields.summary,
      description: fields.description,
      issueType: fields.issuetype.name,
      status: status?.name ?? "",
      statusCategory: status?.statusCategory.name ?? "",
      priority: fields.priority?.name ?? null,
      assignee: fields.assignee?.displayName ?? null,
      dueDate: fields.duedate ?? null,
      timeSpentSeconds: timetracking.timeSpentSeconds ?? 0,
      remainingTimeSeconds: timetracking.remainingEstimateSeconds ?? 0,
      url: dto.self,
    };
  }
}
