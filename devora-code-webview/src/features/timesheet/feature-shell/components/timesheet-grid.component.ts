import { SessionApi } from '@/core/session';
import { CdkTableModule } from '@angular/cdk/table';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimesheetService, ViewMode } from './timesheet.service';

/**
 * Zeiterfassungs-Tabelle mit Wochen-/Tages-Switch.
 *
 * Dünne Schicht über BookingsDatasource — alles Berechnete lebt im Service.
 * SessionApi: Timer Lifecycle (resetSession)
 */
@Component({
  selector: 'devora-code-timesheet-grid',
  standalone: true,
  imports: [
    CdkTableModule,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './timesheet-grid.component.html',
  styleUrl: 'timesheet-grid.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [TimesheetService],
  host: {
    class: 'd-flex flex-column overflow-hidden'
  }
})
export class TimesheetGridComponent {
  protected readonly datasource = inject(TimesheetService);
  private readonly session = inject(SessionApi);
  protected readonly displayedColumns = ['date', 'issueKey', 'start', 'end', 'duration'];
  protected readonly ViewMode = ViewMode;

  protected resetSession(): void {
    this.session.resetSession().subscribe(() => this.datasource.reload());
  }
}

