import { IssueApi, TimeTrackerApi, LoggerFacade } from '@/core/api';
import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { Locale } from 'date-fns';
import { IssueVsCode } from './jira-vscode';
import { LoggerVsCode } from './logger-vscode';
import { TimeTrackerVsCode } from './time-tracker-vscode';

export interface DateProviderOptions {
  locale?: Locale;
  formats?: any;
}

/**
 * Factory-Funktion, die die EnvironmentProvider für den DateFnsAdapter zurückgibt.
 */
export function provideAppApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: IssueApi,
      useClass: IssueVsCode,
    },
    {
      provide: TimeTrackerApi,
      useClass: TimeTrackerVsCode,
    },
    {
      provide: LoggerFacade,
      useClass: LoggerVsCode,
    },
  ]);
}
