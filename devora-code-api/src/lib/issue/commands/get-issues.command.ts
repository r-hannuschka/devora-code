
import type { Command } from "../../core";

/** Issue-Liste laden – optional Project-Filter */
export interface IssuesListPayload {
  projectKey?: string;
}

export type GetIssuesCommand = Command<"issues:list">;