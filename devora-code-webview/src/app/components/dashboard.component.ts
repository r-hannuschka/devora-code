import { WidgetComponent } from '@/core/widget';
import { ActiveSessionWidgetComponent } from '@/domain/session/widgets';
import { TimesheetChartComponent, RaceWidgetComponent } from '@/domain/tracking/widgets';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'devora-code-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    WidgetComponent,
    TimesheetChartComponent,
    RaceWidgetComponent,
    ActiveSessionWidgetComponent
  ],
})
export class DashboardComponent {}
