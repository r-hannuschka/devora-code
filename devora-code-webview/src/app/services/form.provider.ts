import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  type MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { Locale } from 'date-fns';

export interface DateProviderOptions {
  locale?: Locale;
  formats?: any;
}

/**
 * Factory-Funktion, die die EnvironmentProvider für den DateFnsAdapter zurückgibt.
 */
export function provideAppFormConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic',
        appearance: 'fill',
        floatLabel: 'always',
      } satisfies MatFormFieldDefaultOptions,
    },
  ]);
}
