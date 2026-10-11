import { Selector } from '@ngxs/store';
import { IssueState } from './issue-state';
import type { IssueStateModel } from './issue-state.model';

export class IssueStateSelectors {
  @Selector([IssueState])
  static issues(ctx: IssueStateModel | undefined) {
    return ctx?.issues ?? null;
  }

  @Selector([IssueState])
  static selectedIssue(ctx: IssueStateModel | undefined) {
    return ctx?.selectedIssue;
  }

  @Selector([IssueState])
  static currentFocusedTask(ctx: IssueStateModel | undefined) {
    return ctx?.currentFocusTask;
  }
}
