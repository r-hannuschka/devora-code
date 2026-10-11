import { inject } from '@angular/core';
import type {
  FocusedIssue,
  GetFocusTaskCommand,
  GetIssueDetailCommand,
  GetIssuesCommand,
  IssueDetail,
  IssueList,
} from '@devora-code/api';
import type { IssueApi } from '@/core/api';
import type { Observable } from 'rxjs';
import { VsCodeBridge } from './vscode-bridge';

export class IssueVsCode implements IssueApi {
  private readonly vscodeBridge = inject(VsCodeBridge);

  list(): Observable<IssueList> {
    const command: GetIssuesCommand = {
      id: crypto.randomUUID(),
      type: 'issues:list',
    };
    return this.vscodeBridge.request<IssueList>(command);
  }

  getCurrentInProgressTask(): Observable<FocusedIssue | null> {
    const command: GetFocusTaskCommand = {
      id: crypto.randomUUID(),
      type: 'focus:get-task',
    };
    return this.vscodeBridge.request<FocusedIssue | null>(command);
  }

  getIssueByKey(key: string): Observable<IssueDetail | null> {
    const command: GetIssueDetailCommand = {
      id: crypto.randomUUID(),
      type: 'issues:get-detail',
      payload: { key },
    };
    return this.vscodeBridge.request<IssueDetail | null>(command);
  }
}
