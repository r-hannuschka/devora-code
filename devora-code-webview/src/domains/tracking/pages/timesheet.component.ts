import { Component, ViewEncapsulation } from '@angular/core';
import { TimesheetGridComponent } from '../features/timesheet-grid/timesheet-grid.component';

/**
 * Zeiterfassungs-Tabelle mit Wochen-/Tages-Switch.
 *
 * Dünne Schicht über BookingsDatasource — alles Berechnete lebt im Service.
 * SessionApi: Timer Lifecycle (resetSession)
 */
@Component({
  selector: 'devora-code-timesheet',
  standalone: true,
  imports: [TimesheetGridComponent],
  templateUrl: './timesheet.component.html',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'd-flex flex-column h-100 overflow-hidden',
  },
})
export class TimesheetComponent {}
