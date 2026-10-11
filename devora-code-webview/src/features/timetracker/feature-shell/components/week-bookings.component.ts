import { CdkTableModule } from '@angular/cdk/table';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { BookingsDatasource, ViewMode } from './bookings.service';

/**
 * Zeiterfassungs-Tabelle mit Wochen-/Tages-Switch.
 *
 * Dünne Schicht über BookingsDatasource — alles Berechnete lebt im Service.
 */
@Component({
  selector: 'devora-code-bookings',
  standalone: true,
  imports: [CdkTableModule, MatButtonToggleModule, MatIcon],
  templateUrl: './week-bookings.component.html',
  styleUrl: './week-bookings.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [BookingsDatasource],
})
export class WeekBookingsComponent {
  protected readonly datasource = inject(BookingsDatasource);
  protected readonly displayedColumns = ['date', 'issueKey', 'start', 'end', 'duration'];
  protected readonly ViewMode = ViewMode;
}
