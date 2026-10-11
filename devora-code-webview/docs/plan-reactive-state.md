# Plan: Reactive State

## Problem

Komponenten kommunizieren nur **unidirektional** über postMessage. Wenn der Timer gestartet oder gestoppt wird, aktualisiert sich **nichts** anders — kein Focus-Widget, kein Timer-Widget, kein Dashboard.

## Ziel

Komponenten aktualisieren sich automatisch, wenn sich der Zustand ändert — ohne Ngxs, Redux, State-Machine.

## Konzept

### StateService (Singleton pro Feature)

Jeder Feature-State ist ein **Service** mit `providedIn: 'root'`. Er hält die **Source of Truth** via `rxResource`. Components referenzieren den State, nicht die Facade.

```
Component ── injects ──> StateService
                                  │
                            rxResource (source of truth)
                                  │
                            Facade ──> VsCodeBridge ──> postMessage
```

### rxResource mit refreshKey

```typescript
@Injectable({ providedIn: 'root' })
export class TimetrackerState {
  private readonly facade = inject(TimeTrackerFlowFacade);
  private readonly refresh = signal(0);

  activeTimer = rxResource({
    params: () => this.refresh(),
    loader: () => this.facade.getActiveTimer(),
  });

  get value(): TimeEntry | null {
    return this.activeTimer.value();
  }

  async startTracking(key: string) {
    await firstValueFrom(this.facade.startTracking(key));
    this.refresh.update(n => n + 1);
  }

  async stopTracking() {
    await firstValueFrom(this.facade.stopTracking());
    this.refresh.update(n => n + 1);
  }
}
```

### Nutzung in der Component

```typescript
@Component({
  selector: 'jiraflow-current-focus-task',
  templateUrl: './current-focus-task-widget.component.html',
})
export class CurrentFocusTaskWidgetComponent {
  private readonly state = inject(TimetrackerState);

  get activeTimer() {
    return this.state.activeTimer.value();
  }

  start() { this.state.startTracking(this.taskKey()); }
  stop()  { this.state.stopTracking(); }
}
```

Wenn `startTracking()` oder `stopTracking()` den `refresh`-Signal inkrementiert, aktualisiert sich die rxResource **in jeder Komponente**, die sie referenziert — automatisch, reaktiv.

## Dateiänderungen

| Datei | Änderung |
|-------|----------|
| `app/services/timetracker-state.service.ts` | **Neu** — StateService für Timer |
| `app/services/jira-state.service.ts` | **Neu** — StateService für Jira |
| `features/common/components/timer-buttons/timer-buttons.component.ts` | Facade → `TimetrackerState` |
| `features/timetracker/components/timer-widget.component.ts` | Facade → `TimetrackerState` |
| `features/jira/widgets/current-focus-task-widget.component.ts` | Buttons einbetten, State nutzen |

## Dateien (nicht erstellt)

```
app/services/timetracker-state.service.ts
app/services/jira-state.service.ts
```

## Abhängigkeiten

- `rxjs` (`firstValueFrom`) — bereits installiert
- Keine neuen Dependencies
