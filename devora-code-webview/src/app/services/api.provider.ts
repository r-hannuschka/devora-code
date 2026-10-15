import { IssueApi, LoggerFacade } from '@/core/api';
import { SessionApi } from '@/core/session';
import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { Locale } from 'date-fns';
import { IssueVsCode } from './jira-vscode';
import { LoggerVsCode } from './logger-vscode';
import { TimesheetApi } from '@/core/timesheet';
import { TimesheetApiService } from './timesheet-api.service';
import { SessionApiService } from './session-api.service';

export interface DateProviderOptions {
  locale?: Locale;
  formats?: any;
}

/**
 * Factory-Funktion, die die EnvironmentProvider für die API-Service注册 zurückgibt.
 *
 * SessionApi: Timer Lifecycle (start, stop, reset, getActive)
 * TimesheetApi: Data CRUD (add, getPeriod, getMonth)
 *
 * Veraltet: TimeTrackerApi (aufgespalten in SessionApi + TimesheetApi)
 */
export function provideAppApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: IssueApi,
      useClass: IssueVsCode,
    },
    {
      provide: SessionApi,
      useClass: SessionApiService,
    },
    {
      provide: TimesheetApi,
      useClass: TimesheetApiService,
    },
    {
      provide: LoggerFacade,
      useClass: LoggerVsCode,
    },
  ]);
}
