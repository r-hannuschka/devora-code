import { IssueApi, LoggerApi, SessionApi, TimesheetApi } from '@/core/api';
import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { Locale } from 'date-fns';
import { IssueVsCode } from './jira-vscode';
import { LoggerVsCode } from './logger-api.service';
import { SessionApiService } from './session-api.service';
import { TimesheetApiService } from './timesheet-api.service';

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
      provide: LoggerApi,
      useClass: LoggerVsCode,
    },
  ]);
}
