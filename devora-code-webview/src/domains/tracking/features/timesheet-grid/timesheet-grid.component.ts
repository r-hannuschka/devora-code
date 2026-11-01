import { SessionApi } from '@/core/api';
import { CdkTableModule } from '@angular/cdk/table';
import { DatePipe } from '@angular/common';
import { Component, effect, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AddTimeEntryOverlay } from './components/add-entry-overlay/add-time-entry.overlay';
import { TimesheetGridToolbarComponent } from './components/toolbar/timesheet-grid-toolbar.component';
import { TimesheetGridService } from './timesheet-grid.service';
import { PaginationComponent, PaginationController } from '@/common/pagination';

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
    MatIconModule,
    MatButtonModule,
    TimesheetGridToolbarComponent,
    DatePipe,
    PaginationComponent
  ],
  templateUrl: './timesheet-grid.component.html',
  styleUrl: 'timesheet-grid.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [TimesheetGridService, AddTimeEntryOverlay, PaginationController],
  host: {
    class: 'd-flex flex-column overflow-hidden',
  },
})
export class TimesheetGridComponent {
  private readonly paginationController = inject(PaginationController);
  private readonly session = inject(SessionApi);

  protected readonly datasource = inject(TimesheetGridService);
  protected readonly displayedColumns = ['date', 'issueKey', 'start', 'end', 'duration'];

  protected resetSession(): void {
    this.session.resetSession().subscribe(() => this.datasource.reload());
  }
}
