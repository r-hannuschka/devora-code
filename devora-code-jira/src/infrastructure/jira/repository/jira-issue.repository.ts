import { JiraSettingsService } from "@/infrastructure/settings";
import type { IssueDetail, IssueList } from "@devora-code/api/issue";
import { singleton } from "tsyringe";
import { JiraApiClient } from "../client/jira-api-client";
import type { IssueListDTO } from "../dtos/jira-issue-list.dto";
import type { JiraIssueDTO } from "../dtos/jira-issue.dto";
import { JiraIssueMapper } from "../mapper/jira-issue.mapper";

/**
 * Greift auf die Jira REST API v2 zu — Einzeltickets und Listen.
 * Mapping-Logik ist in JiraIssueMapper ausgelagert.
 *
 * Kombination aus dem ehemaligen JiraIssueRepository (getByKey)
 * und JiraSearchRepository (list via JQL).
 */
@singleton()
export class JiraIssueRepository {
  constructor(
    private readonly api: JiraApiClient,
    private readonly issueMapper: JiraIssueMapper,
    private readonly settings: JiraSettingsService,
  ) {}

  /**
   * Holt ein einzelnes IssueByKey aus der Jira API und mappt es.
   */
  async getIssueByKey(issueKey: string): Promise<IssueDetail> {
    const dto = await this.api.get<JiraIssueDTO>(`/issue/${issueKey}`);
    return this.issueMapper.mapToIssueDetail(dto);
  }

  /**
   * Führt eine JQL-Abfrage aus und mapiert die Ergebnisse.
   * Schliesst DONE-Issues explizit aus (sofern gemappt).
   */
  async listIssues(): Promise<IssueList> {
    const projectKey = this.settings.get("projectKey");
    const statusMapping = this.settings.get("statusMapping") ?? {};

    const doneLabelFilter = Object.entries(statusMapping)
      .filter(([, status]) => status === "DONE")
      .map(([key]) => `status != "${key}"`)
      .join(" AND ");

    const baseQuery = `project = ${projectKey} AND assignee = currentUser()`;
    const jql = doneLabelFilter ? `${baseQuery} AND ${doneLabelFilter}` : baseQuery;

    const response = await this.api.post<IssueListDTO>("/search", {
      jql,
      maxResults: 50,
      fields: ["summary", "issuetype", "priority", "status", "timetracking"],
    });

    const mappedIssues = response.issues.map((dto) => this.issueMapper.mapToIssueListItem(dto));

    return {
      total: response.total,
      count: mappedIssues.length,
      data: mappedIssues,
    };
  }
}
