import { providePortalRouter } from '@/core/portal-router';
import { SessionState } from '@/core/session/src/state';
import { IssueState } from '@/feature/issue/data-access';
import { TimetrackerState } from '@/feature/timesheet/data-access';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideStore } from '@ngxs/store';
import { routerConfig } from './router.config';
import { provideAppApi } from './services/api.provider';
// import { provideAppDateAdapter } from './services/date.provider';
import { provideAppFormConfig } from './services/form.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideStore([SessionState, IssueState, TimetrackerState]),
    providePortalRouter(routerConfig),
    // provideAppDateAdapter(),
    provideAppApi(),
    provideAppFormConfig(),
  ],
};
