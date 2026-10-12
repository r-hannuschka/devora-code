import { Component, inject, input } from '@angular/core';
import { StartSession, StopSession } from '@/core/session/src/state';
import { Store } from '@ngxs/store';

@Component({
  selector: 'devora-code-timer-buttons',
  standalone: true,
  templateUrl: './timer-buttons.component.html',
})
export class TimerButtonsComponent {
  private readonly store = inject(Store);

  readonly issueKey = input<string | null>(null);

  start(): void {
    const key = this.issueKey();
    if (!key) return;
    this.store.dispatch(new StartSession({ issueKey: key }));
  }

  stop(): void {
    this.store.dispatch(new StopSession());
  }
}
