import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import type { IssueDetail, IssueListItem } from '@workpulse/api';
import { createElapsedTimer } from '@workpulse/common/utils';
import { RouteParams } from '@workpulse/core/portal-router';
import { SessionStateSelectors } from '@workpulse/core/state';
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
  private readonly store = inject(Store);
  private readonly issueService = inject(IssueService);

  private readonly activeSessionKey = this.store.selectSignal(
    SessionStateSelectors.activeSessionKey,
  );

  /** Aktuell gewählter Issue-Key (aus Selector oder Route) */
  protected selectedKey = signal<string | null>(
    this.routeParams.key ?? this.activeSessionKey(),
  );

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

  /** true wenn kein Key über RouteParams kam, also Session-Fallback */
  protected readonly isFromSession = computed(() => {
    return this.routeParams.key == null && this.activeSessionKey() !== null;
  });

  /** Live-Timer für die aktive Session */
  protected readonly elapsed = createElapsedTimer(
    this.store.selectSignal(SessionStateSelectors.activeSessionStartAt),
  );
}
