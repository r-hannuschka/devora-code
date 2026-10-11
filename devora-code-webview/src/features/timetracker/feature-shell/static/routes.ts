import type { PortalRoute } from '@/core/portal-router';

export const routes: PortalRoute[] = [
  {
    path: 'timetracker:bookings',
    component: () =>
      import('../components/week-bookings.component').then((m) => m.WeekBookingsComponent),
  },
  {
    path: 'timetracker:meetings',
    component: () =>
      import('../components/meeting-form.component').then((m) => m.MeetingFormComponent),
  },
];
