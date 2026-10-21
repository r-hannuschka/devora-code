import { JiraIssueRepository } from "@/infrastructure/jira";
import type { GetIssueDetailCommand, IssueDetail } from "@devora-code/api/issue";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";

@RegisterCommand("issues:get-detail")
export class GetIssueDetailHandler implements CommandHandler<IssueDetail> {
  constructor(private readonly command: GetIssueDetailCommand) {}

  async execute(): Promise<IssueDetail> {
    const jiraIssueRepository = container.resolve(JiraIssueRepository);
    return await jiraIssueRepository.getIssueByKey(this.command.payload.key);
  }
}
