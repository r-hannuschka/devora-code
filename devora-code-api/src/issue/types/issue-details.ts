import type { IssueListItem } from "./issue";

export interface IssueDetail extends IssueListItem {
  description: string | null;

  statusCategory: string;

  assignee: string | null;

  dueDate: string | null;

  url: string;
}
