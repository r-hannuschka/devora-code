import type { FocusedIssue, IssueListItem, IssueList } from '@devora-code/api/issue';

export interface IssueStateModel {
  issues: IssueList | null;

  selectedIssue?: IssueListItem;

  currentFocusTask: FocusedIssue | null;
}
