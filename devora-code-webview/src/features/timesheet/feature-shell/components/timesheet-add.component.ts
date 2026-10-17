import { provideAppDateAdapter } from '@/core/provider';
import { FetchActiveSession } from '@/core/session';
import { TimesheetApi } from '@/core/timesheet';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { Store } from '@ngxs/store';
import { format, set } from 'date-fns';
import { take } from 'rxjs';

@Component({
  selector: 'devora-code-timesheet-add',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    FormField
  ],
  providers: provideAppDateAdapter(),
  templateUrl: './timesheet-add.component.html'
})
export class TimesheetAddComponent {
  private readonly timesheet = inject(TimesheetApi);
  private readonly store = inject(Store);

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

  private readonly apiPayload = computed(() => {
    const { date, startAt, endAt, issueKey } = this.form().value();
    const endDate = set(date, this.extractTime(endAt));
    const startDate = set(date, this.extractTime(startAt));

    return {
      issueKey,
      endAt: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      startAt: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
    };
  });

  protected submitted = signal<false>(false);

  onSubmit() {
    if (this.form().invalid()) {
      return;
    }

    this.timesheet
      .addEntry(this.apiPayload())
      .pipe(take(1))
      .subscribe({
        complete: () => this.store.dispatch(new FetchActiveSession()),
      });
  }

  private extractTime(date: Date) {
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
    };
  }
}
