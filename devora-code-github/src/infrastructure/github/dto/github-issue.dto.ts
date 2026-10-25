import type { Octokit } from "@octokit/rest";

export type GitHubIssueDTO = Awaited<ReturnType<Octokit["rest"]["issues"]["listForRepo"]>>["data"][number];