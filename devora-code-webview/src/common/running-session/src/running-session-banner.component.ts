import { Component, computed, inject } from '@angular/core';
import { PortalRouterService } from '@/core/portal-router';
import { SessionService } from '@/core/session';
import { createElapsedTimer } from '@/common/utils';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'devora-code-running-session',
  templateUrl: './running-session-banner.component.html',
  imports: [MatIcon],
  standalone: true,
})
export class RunningSessionBannerComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(PortalRouterService);

  // --- Data ---
  protected readonly activeKey = this.session.activeIssueKey;
  protected readonly startAt = this.session.activeStartAt;

  // --- Live elapsed timer ---
  protected readonly elapsed = createElapsedTimer(this.startAt);

  // --- Actions ---
  stopSession(): void {
    this.session.stopSession();
  }

  navigateToDetails(): void {
    const key = this.activeKey();
    if (key) {
      this.router.navigate('jira:issue-detail', { key });
    }
  }
}
