import { SessionApi } from '@/core/session';
import { CdkTableModule } from '@angular/cdk/table';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BookingsDatasource, ViewMode } from './bookings.service';

/**
 * Zeiterfassungs-Tabelle mit Wochen-/Tages-Switch.
 *
 * Dünne Schicht über BookingsDatasource — alles Berechnete lebt im Service.
 * SessionApi: Timer Lifecycle (resetSession)
 */
@Component({
  selector: 'devora-code-bookings',
  standalone: true,
  imports: [
    CdkTableModule,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './week-bookings.component.html',
  styleUrl: './week-bookings.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [BookingsDatasource],
})
export class WeekBookingsComponent {
  protected readonly datasource = inject(BookingsDatasource);
  private readonly session = inject(SessionApi);
  protected readonly displayedColumns = ['date', 'issueKey', 'start', 'end', 'duration'];
  protected readonly ViewMode = ViewMode;

  protected resetSession(): void {
    this.session.resetSession().subscribe(() => this.datasource.reload());
  }
}
