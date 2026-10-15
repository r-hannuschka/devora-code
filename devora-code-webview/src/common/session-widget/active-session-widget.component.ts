import { DatePipe } from '@angular/common';
import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngxs/store';
import { SessionStateSelectors, StopSession } from '@/core/session/src/state';
import { DEVORA_CODE_WIDGET, type DevoraCodeWidget, type DevoraCodeWidgetAction } from '@/common';
import { createElapsedTimer } from '../utils/create-elapsed-timer';

@Component({
  selector: 'devora-code-active-session',
  templateUrl: './active-session-widget.component.html',
  imports: [DatePipe],
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: DEVORA_CODE_WIDGET, useExisting: ActiveSessionWidgetComponent }],
})
export class ActiveSessionWidgetComponent implements DevoraCodeWidget {
  private readonly store = inject(Store);

  // --- Widget contract ---

  readonly title = 'Aktive Session';

  readonly actions: DevoraCodeWidgetAction[] = [
    { icon: 'devora-code-icon-stop', key: '[Session]: stop session' },
  ];

  // --- Session data ---
  protected readonly activeSession = this.store.selectSignal(SessionStateSelectors.activeSession);
  protected readonly startAt = computed(() => this.activeSession()?.startAt ?? null);

  // --- Live elapsed timer ---
  protected readonly elapsed = createElapsedTimer(this.startAt);

  // --- Widget actions ---

  actionDispatched(action: DevoraCodeWidgetAction): void {
    if (action.key === '[Session]: stop session') {
      this.stop();
    }
  }

  // --- Internal methods ---

  private stop(): void {
    this.store.dispatch(new StopSession());
  }
}
