import { CdkPortalOutlet, CdkPortalOutletAttachedRef } from '@angular/cdk/portal';
import { Component, inject } from '@angular/core';
import { PortalRouterService } from '@/core/portal-router';
import { ToolbarComponent } from './components/toolbar.component';

@Component({
  imports: [CdkPortalOutlet, ToolbarComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  host: {
    class: 'devora-code'
  }
})
export class App {

  private attachedPortal: CdkPortalOutletAttachedRef | null = null;

  protected readonly portalRouterService = inject(PortalRouterService);

  protected onPortalAttached(portalRef: CdkPortalOutletAttachedRef) {
    if (this.attachedPortal) {
      this.attachedPortal.destroy();
      this.attachedPortal = null
    }
    this.attachedPortal = portalRef;
  }
}
