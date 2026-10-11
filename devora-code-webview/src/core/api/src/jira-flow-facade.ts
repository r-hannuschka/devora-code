import { InjectionToken } from '@angular/core';
import type { FocusedIssue, IssueList, IssueDetail } from '@devora-code/api';
import type { Observable } from 'rxjs';

export interface IIssueFlowFacade {
  getIssueByKey(key: string): Observable<IssueDetail | null>;

  list(): Observable<IssueList>;

  getCurrentInProgressTask(): Observable<FocusedIssue | null>;
}

export const IssueFlowFacade = new InjectionToken<IIssueFlowFacade>(
  'Issue Flow Facade um Daten von Issue abzugreifen',
);
