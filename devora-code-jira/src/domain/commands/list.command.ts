import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import type { IssueList } from "@devora-code/api/issue";
import { container } from "tsyringe";
import { JiraSearchRepository } from "@/infrastructure/jira";

@RegisterCommand("issues:list")
export class FetchJiraIssuesHandler implements CommandHandler<IssueList> {
  async execute(): Promise<IssueList> {
    const service = container.resolve(JiraSearchRepository);
    return await service.getIssues();
  }
}
