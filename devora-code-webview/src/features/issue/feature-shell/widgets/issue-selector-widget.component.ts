import { DEVORA_CODE_WIDGET, type DevoraCodeWidget } from '@/core/widget';
import { PortalRouterService } from '@/core/portal-router';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import type { IssueListItem } from '@devora-code/api/issue';
import { IssueSelectorService } from '../service/issue-selector.service';

@Component({
  selector: 'devora-code-issue-selector-widget',
  templateUrl: './issue-selector-widget.component.html',
  imports: [MatAutocomplete, MatOption, MatAutocompleteTrigger],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './issue-selector-widget.component.scss',
  providers: [
    {
      provide: DEVORA_CODE_WIDGET,
      useExisting: IssueSelectorWidget,
    },
  ],
})
export class IssueSelectorWidget implements DevoraCodeWidget {
  private readonly routerService = inject(PortalRouterService);

  protected readonly issueSelectorService = inject(IssueSelectorService);

  readonly title = 'Issue Selektor';

  attached(): void {
  }

  protected displayWithIssueKey(item: IssueListItem): string {
    return `[${item.issueType}]: ${item.key}`;
  }

  protected onOptionSelected($event: MatAutocompleteSelectedEvent) {
    const selectedOption = $event.option as MatOption<IssueListItem>;
    this.issueSelectorService.selectIssue(selectedOption.value);
    this.issueSelectorService.setFilter('');
  }

  protected openDetails(key: IssueListItem['key']) {
    this.routerService.navigate('jira:issue-detail', { key });
  }
}
