import { provideAppDateAdapter } from '@/core/provider';
import { Component, computed, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import type { TimesheetAddEntryPayload } from '@devora-code/api/timesheet';
import { format, set } from 'date-fns';

@Component({
  selector: 'devora-code-timesheet-add',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    MatButton,
    FormField
  ],
  providers: provideAppDateAdapter(),
  templateUrl: './add-time-entry.overlay-component.html',
})
export class AddTimeEntryOverlayComponent {
  readonly submitted = output<TimesheetAddEntryPayload>();

  private readonly formData = signal({
    date: new Date(),
    startAt: new Date(),
    endAt: new Date(),
    issueKey: '',
  });

  protected readonly form = form(this.formData, (schema) => {
    required(schema.date);
    required(schema.endAt);
    required(schema.issueKey);
    required(schema.startAt);
  });

  private readonly timeEntry = computed<TimesheetAddEntryPayload>(() => {
    const { date, startAt, endAt, issueKey } = this.form().value();
    const endDate = set(date, this.extractTime(endAt));
    const startDate = set(date, this.extractTime(startAt));

    return {
      issueKey,
      endAt: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      startAt: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
    };
  });

  protected onSubmit(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();

    if (this.form().invalid()) {
      return;
    }

    this.submitted.emit(this.timeEntry());
  }

  private extractTime(date: Date) {
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
    };
  }
}
