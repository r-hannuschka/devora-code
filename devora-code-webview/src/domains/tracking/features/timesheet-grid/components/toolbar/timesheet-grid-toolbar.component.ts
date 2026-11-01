import { Component, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { TimesheetGridService, ViewMode } from '../../timesheet-grid.service';
import { debounce, form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'devora-code-timesheet-grid-toolbar',
  imports: [
    MatButtonToggleModule,
    MatIcon,
    MatButtonModule,
    MatToolbar,
    MatToolbarRow,
    MatFormField,
    MatInput,
    MatSuffix,
    FormField,
  ],
  templateUrl: './timesheet-grid-toolbar.component.html',
  styleUrl: './timesheet-grid-toolbar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TimesheetGridToolbarComponent {
  private readonly searchModel = signal({ search: '' });

  protected readonly gridService = inject(TimesheetGridService);

  protected readonly searchForm = form(this.searchModel);

  protected readonly searchChangedEffect = effect(() => {
    this.gridService.search(this.searchForm.search().value());
  });

  protected readonly ViewMode = ViewMode;
}
