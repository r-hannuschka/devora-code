import { provideAppDateAdapter } from '@/core/provider';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'devora-code-meeting-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButton,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
  ],
  providers: provideAppDateAdapter(),
  templateUrl: './meeting-form.component.html',
})
export class MeetingFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    date: [new Date(), [Validators.required]],
    from: ['', [Validators.required]],
    to: ['', [Validators.required]],
    number: ['', [Validators.required]],
  });

  protected submitted = signal<false>(false);

  onSubmit() {
    if (this.form.invalid) return;
    this.submitted.set(false);
  }
}
