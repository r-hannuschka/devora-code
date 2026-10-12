import { IssueApi, LoggerFacade } from '@/core/api';
import { SessionService } from '@/core/session';
import { FetchTasks, IssueStateSelectors } from '@/feature/issue/data-access';
import { computed, inject, Service, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { IssueDetail, IssueListItem } from '@devora-code/api';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';

/**
 * Service für Issue-Abfragen.
 *
 * Liefert Issue-Details (einzeln) und die komplette Issue-Liste
 * mit Tracking-Highlight für den aktiven Session-Issue.
 */
@Service()
export class IssueService {
  private readonly store = inject(Store);
  private readonly jiraApi = inject(IssueApi);
  private readonly logger = inject(LoggerFacade);
  private readonly sessionService = inject(SessionService);

  private readonly issueList = this.store.select(IssueStateSelectors.issues);

  readonly suche = signal<string>('');

  /** Issue-Liste mit Tracking-Highlight – der Issue mit aktivem Timer ist über isTracking erkennbar */
  readonly list = rxResource({
    params: () => ({ activeSession: this.sessionService.activeSession() }),
    stream: ({ params }) => {
      return this.issueList.pipe(
        map((list) => {
          if (!list) {
            return { count: 0, total: 0, data: [] as IssueListItem[] };
          }

          const { data } = list;
          const { activeSession } = params;

          // Markiere Issues mit aktivem Timer
          const mappedData = data.map((item) => ({
            ...item,
            isTracking: activeSession ? item.key === activeSession.issueKey : false,
          }));

          return { ...list, data: mappedData };
        }),
      );
    },
  });

  readonly data = computed(() => {
    const resource = this.list;

    if (resource.isLoading()) {
      return [];
    }

    if (resource.error()) {
      this.logger.error(
        `Issues konnten nicht geladen werden. Error: ${resource.error()?.message}`,
        'IssueService',
      );
      return [];
    }

    const suche = this.suche().trim().toLocaleLowerCase();
    const data = resource.value()?.data ?? [];

    console.log(data);
    if (!suche) {
      return data;
    }

    return data.filter(({ summary, key }) => {
      return [summary, key].some((value) => value.toLocaleLowerCase().includes(suche));
    });
  });

  /** Issue-Details via Issue REST API nach Key laden */
  getDetails(key: IssueDetail['key']) {
    return this.jiraApi.getIssueByKey(key);
  }

  reload() {
    this.store.dispatch(new FetchTasks());
  }

  startSession(issue: IssueListItem) {
    this.sessionService.startSession(issue.key);
  }

  stopSession() {
    this.sessionService.stopSession();
  }
}
