import { Component, ViewEncapsulation } from '@angular/core';
import { TimesheetAddComponent } from '../features/timesheet-add/timesheet-add.component';
import { TimesheetGridComponent } from '../features/timesheet-grid/timesheet-grid.component';
import { TimesheetService } from '../service/timesheet.service';

/**
 * Zeiterfassungs-Tabelle mit Wochen-/Tages-Switch.
 *
 * Dünne Schicht über BookingsDatasource — alles Berechnete lebt im Service.
 * SessionApi: Timer Lifecycle (resetSession)
 */
@Component({
  selector: 'devora-code-timesheet',
  standalone: true,
  imports: [TimesheetAddComponent, TimesheetGridComponent],
  templateUrl: './timesheet.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [TimesheetService],
  host: {
    class: 'd-flex flex-column h-100 overflow-hidden',
  },
})
export class TimesheetComponent {}
