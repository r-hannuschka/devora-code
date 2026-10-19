import { RegisterCommand, type CommandHandler } from "@devora-code/sdk/command";
import type { GetIssueDetailCommand, IssueDetail } from "@devora-code/api/issue";
import { container } from "tsyringe";
import { JiraIssueRepository } from "../repository/jira-issue.repository";

@RegisterCommand("issues:get-detail")
export class GetIssueDetailHandler implements CommandHandler<IssueDetail> {
  constructor(private readonly command: GetIssueDetailCommand) {}

  async execute(): Promise<IssueDetail> {
    const jiraIssueRepository = container.resolve(JiraIssueRepository);
    return await jiraIssueRepository.getIssueByKey(this.command.payload.key);
  }
}
