import { InjectionToken } from '@angular/core';
import type { FocusedIssue, IssueList, IssueDetail } from '@devora-code/api';
import type { Observable } from 'rxjs';

export interface IssueApi {
  getIssueByKey(key: string): Observable<IssueDetail | null>;

  list(): Observable<IssueList>;

  getCurrentInProgressTask(): Observable<FocusedIssue | null>;
}

export const IssueApi = new InjectionToken<IssueApi>(
  'Issue Flow Facade um Daten von Issue abzugreifen',
);
