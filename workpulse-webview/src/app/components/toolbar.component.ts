import { Component, inject, ViewEncapsulation } from '@angular/core';
import { PortalRouterService } from '@workpulse/core/portal-router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/**
 * Application-Header mit Navigation zwischen den Views.
 *
 * Zeigt die verfügbaren Routen als Tabs. Die aktive Route wird
 * durch Vergleich mit der aktuellen Route im PortalRouterService
 * hervorgehoben.
 */
@Component({
  selector: 'workpulse-header-toolbar',
  templateUrl: './toolbar.component.html',
  standalone: true,
  imports: [MatToolbar, MatButton, MatIcon],
  styleUrl: './toolbar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ToolbarComponent {
  private readonly router = inject(PortalRouterService);

  readonly navItems = [
    { path: 'dashboard', label: 'Workpulse', icon: "workpulse-icon-query_stats" },
    { path: 'timetracker:bookings', label: 'erfasste Zeiten', icon: "workpulse-icon-bookings" },
    { path: 'timetracker:meetings', label: 'Meetings', icon: "workpulse-icon-add_call" },
    { path: 'jira:issue-list', label: 'Aufgabenliste', icon: "workpulse-icon-task-list" },
    { path: 'jira:issue-detail', label: 'Issue Details', icon: "workpulse-icon-preview" },
  ];

  navigate(path: string): void {
    this.router.navigate(path);
  }

  isActive(path: string): boolean {
    return this.router.getCurrentPath() === path;
  }
}
