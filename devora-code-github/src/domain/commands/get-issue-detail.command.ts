import { GitHubIssueRepository } from "@/infrastructure/github";
import type { GetIssueDetailCommand, IssueDetail } from "@devora-code/api/issue";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";

@RegisterCommand("issues:get-detail")
export class GetGitHubIssueDetailHandler implements CommandHandler<IssueDetail> {
  constructor(private readonly command: GetIssueDetailCommand) {}

  async execute(): Promise<IssueDetail> {
    const githubIssueRepository = container.resolve(GitHubIssueRepository);
    const { key } = this.command.payload;
    const keyMatch = key.match(/^#(?<key>\d+)$/);

    if (!keyMatch?.groups?.['key']) {
      throw new Error('No valid key passed');
    }

    const extractedKey = parseInt(keyMatch.groups['key'], 10);
    return await githubIssueRepository.queryByKey(extractedKey);
  }
}
