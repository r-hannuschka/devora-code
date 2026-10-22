import { SessionStateSelectors, StartSession } from '@/domain/session/+state';
import { IssueStateSelectors, SelectIssue } from '@/feature/issue/data-access';
import { computed, inject, Service, signal } from '@angular/core';
import { IssueListItem } from '@devora-code/api/issue';
import { Store } from '@ngxs/store';

@Service()
export class IssueSelectorService {
  private readonly store = inject(Store);

  private readonly activeSession = this.store.selectSignal(SessionStateSelectors.activeSession);
  private readonly issues = this.store.selectSignal(IssueStateSelectors.issues);
  private readonly filter = signal<string>('');

  readonly selectedIssue = this.store.selectSignal(IssueStateSelectors.selectedIssue);

  readonly availableIssues = computed(() => {
    const result = this.issues();
    const issues = result && Array.isArray(result.data) ? result.data : [];

    if (issues.length === 0) {
      return [];
    }

    const issueKey = this.activeSession()?.entry.issueKey;

    if (issueKey) {
      return issues.filter((issue) => issue.key !== issueKey);
    }

    return issues;
  });

  readonly filteredIssues = computed(() => {
    const list = this.availableIssues();
    const search = this.filter().toLowerCase().trim();

    if (!search) {
      return list;
    }

    // Sucht sowohl im Issue-Key (KVQAIP-123) als auch in der Summary (Titel)
    return list.filter(
      (issue) =>
        issue.key.toLowerCase().includes(search) || issue.summary?.toLowerCase().includes(search),
    );
  });

  selectIssue(issue?: IssueListItem) {
    this.store.dispatch(new SelectIssue(issue));
  }

  /** selektierten Issue starten */
  startIssue() {
    const selectedIssue = this.store.selectSnapshot(IssueStateSelectors.selectedIssue);
    if (selectedIssue) {
      this.store.dispatch(new StartSession({ issueKey: selectedIssue.key }));
    }
  }

  setFilter(filter = '') {
    this.filter.set(filter);
  }
}
