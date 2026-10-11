import { Component, computed, inject } from '@angular/core';
import {
  SafeHtmlPipe,
  WORKPULSE_WIDGET,
  workpulseTeaserComponent,
  type DevoraCodeWidget,
} from '@/common';
import { Store } from '@ngxs/store';
import { IssueStateSelectors } from '../../data-access';

@Component({
  selector: 'devora-code-current-focus-task',
  templateUrl: './current-focus-task-widget.component.html',
  imports: [SafeHtmlPipe, workpulseTeaserComponent],
  providers: [
    {
      provide: WORKPULSE_WIDGET,
      useExisting: CurrentFocusTaskWidgetComponent,
    },
  ],
  exportAs: 'currentFocusTask',
})
export class CurrentFocusTaskWidgetComponent implements DevoraCodeWidget {
  private readonly store = inject(Store);

  protected readonly focusedTask = this.store.selectSignal(IssueStateSelectors.currentFocusedTask);

  readonly title = 'Aktuellster Issue';

  readonly taskKey = computed(() => {
    return this.focusedTask()?.key ?? null;
  });
}
