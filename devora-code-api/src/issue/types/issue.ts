import type { IssueType } from "./mappings";
import type { IssueStatus } from "./mappings";

export interface IssueListItem {
  id: string;
  key: string;
  summary: string;
  issueType: IssueType;
  priority: {
    id: string;
    name: string;
  };
  status: IssueStatus;
  remainingTimeSeconds: number | undefined;
  timeSpentSeconds: number | undefined;
}

export interface IssueList {
  total: number;
  count: number;
  data: IssueListItem[];
}

/**
 * Das aktuelle Fokus-Task des Users.
 * Semantisch: genau EIN Issue, das der User gerade verfolgt (in-progress).
 * Gleiche Struktur wie JiraIssue, aber eigener Typ fuer klare Abgrenzung.
 */
export interface FocusedIssue extends IssueListItem {
  url: string;
  description: string | null;
}
