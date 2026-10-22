import { PortalRouterService } from '@/core/portal-router';
import { createElapsedTimer } from '@/util/time';
import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { SessionService } from '../providers/session-service';

@Component({
  selector: 'devora-code-running-session',
  templateUrl: './running-session-banner.component.html',
  imports: [MatIcon],
  standalone: true,
})
export class RunningSessionBannerComponent {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(PortalRouterService);

  // --- Data ---
  protected readonly activeKey = this.sessionService.activeIssueKey;
  protected readonly startAt = this.sessionService.activeStartAt;
  protected readonly isPaused = this.sessionService.isPaused;

  // --- Live elapsed timer ---
  protected readonly elapsed = createElapsedTimer(this.startAt, this.isPaused);

  // --- Actions ---
  pauseSession(): void {
    this.sessionService.pauseSession();
  }

  resumeSession(): void {
    this.sessionService.resumeSession();
  }

  stopSession(): void {
    this.sessionService.stopSession();
  }

  navigateToDetails(): void {
    const key = this.activeKey();
    if (key) {
      this.router.navigate('jira:issue-detail', { key });
    }
  }
}
