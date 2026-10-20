import { WidgetComponent } from '@/common/widget';
import { TimesheetChartComponent, RaceWidgetComponent } from '@/domains/tracking/widgets';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'devora-code-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    WidgetComponent,
    TimesheetChartComponent,
    RaceWidgetComponent
  ],
})
export class DashboardComponent {}
