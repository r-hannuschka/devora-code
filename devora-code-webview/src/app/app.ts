import { PortalRouterService } from '@/core/portal-router';
import { RunningSessionBannerComponent } from '@/domain/session';
import { CdkPortalOutlet, CdkPortalOutletAttachedRef } from '@angular/cdk/portal';
import { Component, inject } from '@angular/core';
import { ToolbarComponent } from './components/toolbar.component';

@Component({
  imports: [CdkPortalOutlet, ToolbarComponent, RunningSessionBannerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  host: {
    class: 'devora-code d-flex flex-column h-100',
  },
})
export class App {
  private attachedPortal: CdkPortalOutletAttachedRef | null = null;

  protected readonly portalRouterService = inject(PortalRouterService);

  protected onPortalAttached(portalRef: CdkPortalOutletAttachedRef) {
    if (this.attachedPortal) {
      this.attachedPortal.destroy();
      this.attachedPortal = null;
    }
    this.attachedPortal = portalRef;
  }
}
