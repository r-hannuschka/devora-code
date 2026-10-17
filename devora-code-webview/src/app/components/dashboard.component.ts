import { WidgetComponent } from '@/common/widget';
import { TimesheetChartComponent  } from '@/feature/timesheet/feature-shell/widgets';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'devora-code-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    WidgetComponent,
    TimesheetChartComponent
  ],
})
export class DashboardComponent {}
