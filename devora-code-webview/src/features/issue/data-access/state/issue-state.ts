import { inject, Injectable } from '@angular/core';
import { Action, State, type NgxsOnInit, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { IssueApi } from '@/core/api';
import { tap } from 'rxjs';
import { FetchCurrentFocusedTask, FetchTasks, SelectIssue } from './issue-state.actions';
import type { IssueStateModel } from './issue-state.model';

@State<IssueStateModel>({
  name: 'IssueState',
  defaults: {
    currentFocusTask: null,
    issues: null,
  },
})
@Injectable()
export class IssueState implements NgxsOnInit {
  private readonly jiraApi = inject(IssueApi);

  ngxsOnInit(ctx: StateContext<any>): void {
    ctx.dispatch(new FetchTasks());
  }

  @Action(FetchTasks)
  protected fetchTasks(ctx: StateContext<IssueStateModel>) {
    return this.jiraApi.list().pipe(tap((list) => ctx.setState(patch({ issues: list }))));
  }

  @Action(FetchCurrentFocusedTask)
  protected fetchCurrentFocusedTask(ctx: StateContext<IssueStateModel>) {
    return this.jiraApi.getCurrentInProgressTask().pipe(
      tap((issue) => {
        ctx.setState(patch({ currentFocusTask: issue }));
      }),
    );
  }

  @Action(SelectIssue)
  protected selectIssue(ctx: StateContext<IssueStateModel>, { issue }: SelectIssue) {
    ctx.setState(patch({ selectedIssue: issue }));
  }
}
