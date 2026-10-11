import { ComponentPortal } from '@angular/cdk/portal';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  Injector,
  resource,
  Service,
  signal,
} from '@angular/core';
import { RouteParams, Routes } from './route';

@Service()
export class PortalRouterService {
  private readonly activeRoute = signal<{ path: string; params?: RouteParams } | null>(null);
  private readonly injector = inject(Injector);

  private readonly routeConfig = inject(Routes);
  private currentChildInjector: EnvironmentInjector | null = null;

  navigate<TParams extends RouteParams>(path: string, params?: TParams): void {
    this.activeRoute.set({
      path,
      params,
    });
  }

  readonly activeView = resource({
    params: () => ({ route: this.activeRoute() }),
    loader: async ({ params }) => {
      const { route } = params;

      const matchedRoute = this.routeConfig.find(({ path }) => path === route?.path);
      if (matchedRoute) {
        if (this.currentChildInjector) {
          this.currentChildInjector.destroy();
          this.currentChildInjector = null;
        }

        const newInjector = this.createInjector(route?.params);
        this.currentChildInjector = newInjector;

        return new ComponentPortal(
          await matchedRoute.component(),
          null,
          newInjector
        );
      }

      const routeEntry = this.routeConfig.find((routeEntry) => routeEntry.default === true);
      if (routeEntry) {
        return new ComponentPortal(await routeEntry.component());
      }

      throw new Error('Could not find any route');
    },
  });

  getCurrentPath(): string | null {
    return this.activeRoute()?.path ?? null;
  }

  private createInjector(params?: RouteParams) {
    const envInjector = this.injector.get(EnvironmentInjector);
    return createEnvironmentInjector(
      [
        {
          provide: RouteParams,
          useValue: params ?? {},
        },
      ],
      envInjector,
    );
  }
}
