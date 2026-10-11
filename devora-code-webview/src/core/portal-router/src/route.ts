import type { ComponentType } from '@angular/cdk/portal';
import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

export interface PortalRoute {
    path: string;
    default?: boolean;
    component: () => Promise<ComponentType<unknown>>
}

export const Routes = new InjectionToken<PortalRoute[]>('Routes for the portal router');

export type RouteParams = Record<string, unknown>;
export const RouteParams = new InjectionToken<RouteParams>('RouteParams');

export function providePortalRouter(config: PortalRoute[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: Routes,
      useValue: config,
    },
  ]);
}
