import { Component, inject, input, output } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { IssueListItem } from '@devora-code/api/issue';
import { IssueSelectorService } from '../service/issue-selector.service';

/**
 * Wiederverwendbare Issue-Auswahl per Autocomplete.
 *
 * input: aktueller issueKey – zeigt gewähltes Issue im Input an
 * output: selected – Parent entscheidet was passiert
 *         (Widget = navigate, Details = reload)
 */
@Component({
  selector: 'devora-code-issue-selector',
  templateUrl: './issue-selector.component.html',
  imports: [MatAutocomplete, MatAutocompleteTrigger, MatOption, MatFormFieldModule, MatInputModule],
  providers: [IssueSelectorService],
})
export class IssueSelectorComponent {
  protected readonly selectorService = inject(IssueSelectorService);

  /** Emit bei Issue-Auswahl */
  protected readonly selected = output<IssueListItem>();

  /** Aktiver Issue-Key (z.B. aus Route oder Session) */
  readonly issueKey = input<string | null>(null);

  protected displayWithIssueKey(item: IssueListItem | undefined): string {
    return item ? `${item.key} – ${item.summary}` : '';
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option as MatOption<IssueListItem>;
    this.selectorService.selectIssue(selectedOption.value);
    this.selectorService.setFilter('');
    this.selected.emit(selectedOption.value);
  }
}
