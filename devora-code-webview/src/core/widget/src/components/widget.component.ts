import { Component, computed, contentChild, effect, untracked, ViewEncapsulation } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import type { DevoraCodeWidgetAction } from '../interfaces/widget';
import { DEVORA_CODE_WIDGET } from '../static/tokens';

@Component({
  selector: 'devora-code-widget',
  templateUrl: './widget.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatIconButton, MatIcon],
  host: {
    class: 'devora-code-widget',
  },
})
export class WidgetComponent {
  private readonly widget = contentChild(DEVORA_CODE_WIDGET);

  protected readonly widgetLoadedEffect = effect(() => {
    const loadedWidget = this.widget();
    if (!loadedWidget) {
      return;
    }

    untracked(() => loadedWidget.attached());
  });

  protected readonly title = computed(() => {
    const loadedWidget = this.widget();
    if (!loadedWidget) {
      return 'Loading ...';
    }
    return loadedWidget.title;
  });

  protected readonly actions = computed(() => {
    const { actions } = this.widget() ?? {};
    if (Array.isArray(actions) && actions.length > 0) {
      return actions;
    }
    return [];
  });

  protected dispatchAction(action: DevoraCodeWidgetAction) {
    const widget = this.widget();
    if (widget && widget.actionDispatched) {
      widget.actionDispatched(action);
    }
  }
}
