export interface DevoraCodeWidgetAction {
  readonly key: string;

  readonly icon: string;
}

export interface DevoraCodeWidget {
  readonly title: string;

  readonly actions?: DevoraCodeWidgetAction[];

  actionDispatched?(action: DevoraCodeWidgetAction): void;
}
