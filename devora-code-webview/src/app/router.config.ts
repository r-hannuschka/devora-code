import type { PortalRoute } from '@/core/portal-router';
import { routes as jiraRoutes } from '@/feature/issue/feature-shell';
import { routes as timesheetRoutes } from '@/domain/tracking';

export const routerConfig: PortalRoute[] = [
  {
    path: 'dashboard',
    component: () => import('./components/dashboard.component').then((m) => m.DashboardComponent),
  },
  ...jiraRoutes,
  ...timesheetRoutes
];
