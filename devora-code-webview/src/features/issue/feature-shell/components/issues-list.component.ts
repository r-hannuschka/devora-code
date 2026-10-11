import { CdkTableModule } from '@angular/cdk/table';
import { Component, effect, inject, model, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import type { IssueListItem } from '@devora-code/api';
import { PortalRouterService } from '@/core/portal-router';
import { IssueService } from '../service/issue.service';

@Component({
  selector: 'jira-issues-list',
  templateUrl: './issues-list.component.html',
  styleUrl: './issues-list.component.scss',
  imports: [
    CdkTableModule,
    MatMiniFabButton,
    MatIconButton,
    MatIcon,
    MatInput,
    MatFormField,
    MatSuffix,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class IssueIssuesListComponent {
  private readonly router = inject(PortalRouterService);

  protected readonly issueService = inject(IssueService);

  protected readonly suche = model<string>('');

  constructor() {
    effect(() => {
      console.log(this.suche());
      this.issueService.suche.set(this.suche());
    });
  }

  protected displayedColumns = ['key', 'summary', 'priority', 'actions'];

  protected trackByIssueKey(index: number, item: IssueListItem): string {
    return item.key;
  }

  protected startSession($event: MouseEvent, issue: IssueListItem) {
    $event.stopImmediatePropagation();
    $event.preventDefault();

    this.issueService.startSession(issue);
  }

  protected stopSession($event: MouseEvent) {
    $event.stopImmediatePropagation();
    $event.preventDefault();

    this.issueService.stopSession();
  }

  protected gotoDetails(issueKey: string) {
    this.router.navigate('jira:issue-detail', { key: issueKey });
  }
}
