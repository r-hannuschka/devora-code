import { DEVORA_CODE_WIDGET, type DevoraCodeWidget } from '@/core/widget';
import { createElapsedTimer } from '@/util/time';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngxs/store';
import { SessionStateSelectors } from '../../+state';

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
  attached(): void {}

  readonly title = 'Aktive Session';

  // --- Session data ---
  protected readonly activeSession = this.store.selectSignal(SessionStateSelectors.activeSession);
  protected readonly startAt = computed(() => this.activeSession()?.entry.startAt ?? null);
  protected readonly isPaused = computed(() => this.activeSession()?.paused ?? false);

  // --- Live elapsed timer ---
  protected readonly elapsed = createElapsedTimer(this.startAt, this.isPaused);
}
