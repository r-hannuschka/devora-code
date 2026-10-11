import { ActiveSessionWidgetComponent } from '@/common/session-widget';
import { WidgetComponent } from '@/common/widget';
import { MonthBookingsComponent } from '@/feature/timetracker/feature-shell';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'devora-code-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    WidgetComponent,
    MonthBookingsComponent,
    ActiveSessionWidgetComponent,
  ],
})
export class DashboardComponent {}
