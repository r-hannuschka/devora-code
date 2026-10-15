import { RouteParams } from '@/core/portal-router';
import { SessionService } from '@/core/session';
import { Component, inject, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { IssueDetail, IssueListItem } from '@devora-code/api/issue';
import { of } from 'rxjs';
import { IssueService } from '../service/issue.service';
import { IssueSelectorComponent } from './issue-selector.component';

@Component({
  selector: 'jira-issue-details',
  templateUrl: './issue-details.component.html',
  imports: [IssueSelectorComponent],
})
export class IssueDetailsComponent {
  private readonly routeParams = inject<{ key?: IssueDetail['key'] }>(RouteParams);
  private readonly issueService = inject(IssueService);
  private readonly sessionService = inject(SessionService);

  /** Aktuell gewählter Issue-Key (aus Selector oder Route) */
  protected selectedKey = linkedSignal<string | null>(() => {
    const aktiveSession = this.sessionService.activeIssueKey();
    const routerKey = this.routeParams.key;

    return routerKey || aktiveSession || null;
  });

  /** Ausgabe eines Issues aus dem Selector – lädt Details */
  protected onIssueSelected(issue: IssueListItem) {
    this.selectedKey.set(issue.key);
  }

  protected readonly issueResource = rxResource({
    params: () => ({ key: this.selectedKey() }),
    stream: ({ params }) => {
      if (!params.key) {
        return of(null);
      }

      return this.issueService.getDetails(params.key);
    },
  });
}
