import type { IssueListItem } from "@devora-code/api/issue";

export class FetchTasks {
  static readonly type = '[Issue] fetch current tasks';

  constructor(public readonly force = false ){}
}

export class FetchCurrentFocusedTask {
  static readonly type = '[Issue] fetch current focused task';
}

export class SelectIssue {
  static readonly type = '[Issue] selektiere Issue';

  constructor(public readonly issue?: IssueListItem) {}
}