import { type Provider } from '@angular/core';
import { DateFnsAdapter, MAT_DATE_FNS_FORMATS } from '@angular/material-date-fns-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Locale } from 'date-fns';
import { de } from 'date-fns/locale/de';

export interface DateProviderOptions {
  locale?: Locale;
  formats?: any;
}

/**
 * Factory-Funktion, die die EnvironmentProvider für den DateFnsAdapter zurückgibt.
 */
export function provideAppDateAdapter(options?: DateProviderOptions): Provider[] {
  return [
    {
      provide: MAT_DATE_LOCALE,
      useValue: options?.locale ?? de,
    },
    {
      provide: DateAdapter,
      useClass: DateFnsAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: options?.formats ?? MAT_DATE_FNS_FORMATS,
    },
  ];
}
