import type { PortalRoute } from '@/core/portal-router';

export const routes: PortalRoute[] = [
  {
    path: 'timetracker:bookings',
    component: () =>
      import('../components/timesheet.component').then((m) => m.TimesheetComponent),
  }
];
