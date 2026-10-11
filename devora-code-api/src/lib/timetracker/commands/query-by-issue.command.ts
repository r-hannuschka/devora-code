import type { Command } from "../../core";

/** Time-Entries nach Issue suchen */
export interface QueryByIssuePayload {
  query: string;
  limit?: number;
}

export type QueryByIssueCommand = Command<"timetracker:query-by-issue", QueryByIssuePayload>;
