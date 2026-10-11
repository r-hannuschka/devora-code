import type { PortalRoute } from '@/core/portal-router';

export const routes: PortalRoute[] = [
  {
    path: 'jira:issue-list',
    component: () =>
      import('../components/issues-list.component').then((m) => m.IssueIssuesListComponent),
  },
  {
    path: 'jira:issue-detail',
    component: () =>
      import('../components/issue-details.component').then((m) => m.IssueDetailsComponent),
  },
];
