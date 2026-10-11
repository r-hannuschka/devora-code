export interface WorkpulseWidgetAction {
  readonly key: string;

  readonly icon: string;
}

export interface DevoraCodeWidget {
  readonly title: string;

  readonly actions?: WorkpulseWidgetAction[];

  actionDispatched?(action: WorkpulseWidgetAction): void;
}
