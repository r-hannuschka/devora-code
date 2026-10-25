import { GitHubIssueRepository } from "@/infrastructure/github";
import type { IssueList } from "@devora-code/api/issue";
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import { container } from "tsyringe";

@RegisterCommand("issues:list")
export class FetchGitHubIssuesHandler implements CommandHandler<IssueList> {
  async execute(): Promise<IssueList> {
    const repository = container.resolve(GitHubIssueRepository);
    return await repository.listIssues();
  }
}
