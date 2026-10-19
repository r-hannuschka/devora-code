import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { IssueList } from "@devora-code/api/issue";
import { container } from "tsyringe";
import { JiraSearchRepository } from "../repository/jira-search.repository";

@RegisterCommand("issues:list")
export class FetchJiraIssuesHandler implements CommandHandler<IssueList> {
  async execute(): Promise<IssueList> {
    const repository = container.resolve(JiraSearchRepository);
    return await repository.getIssues();
  }
}
