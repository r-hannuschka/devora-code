import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_RIPPLE_GLOBAL_OPTIONS, type RippleGlobalOptions } from '@angular/material/core';
import { IssueState } from '@/feature/issue/data-access';
import { TimetrackerState } from '@/feature/timetracker/data-access';
import { provideStore } from '@ngxs/store';
import { IssueFlowFacade, LoggerFacade, TimeTrackerFlowFacade } from '@/core/api';
import { providePortalRouter } from '@/core/portal-router';
import { SessionState } from '@/core/state';
import { routerConfig } from './router.config';
import { IssueVsCode } from './services/jira-vscode';
import { TimeTrackerVsCode } from './services/time-tracker-vscode';
import { LoggerVsCode } from './services/logger-vscode';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  type MatFormFieldDefaultOptions,
} from '@angular/material/form-field';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideStore([SessionState, IssueState, TimetrackerState]),
    providePortalRouter(routerConfig),
    {
      provide: MAT_RIPPLE_GLOBAL_OPTIONS,
      useValue: { disabled: true } satisfies RippleGlobalOptions,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic',
        appearance: 'fill',
        floatLabel: 'always',
      } satisfies MatFormFieldDefaultOptions,
    },
    {
      provide: IssueFlowFacade,
      useClass: IssueVsCode,
    },
    {
      provide: TimeTrackerFlowFacade,
      useClass: TimeTrackerVsCode,
    },
    {
      provide: LoggerFacade,
      useClass: LoggerVsCode,
    },
  ],
};
