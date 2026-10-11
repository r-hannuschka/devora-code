# Code Review — webview/

**Datum:** 2025-08-07
**Umfang:** Alle `.ts` und `.html` Dateien in `webview/src/`

---

## 🔴 Kritisch

### 1. Zwei State-Systeme gleichzeitig (KONFLIKT)

Zwei **komplett parallel laufende** State-Systeme existieren — sie widersprechen sich:

- **`core/state/`** — Custom `@Service()` + `signal()` + `fetchAndStore()`
- **`features/*/data-access/state/`** — NGXS `@State` + `@Action` + `@Selector`

```
core/state/jira-state.ts           ← @Service() Signal-Pattern
features/jira/data-access/state/jira-state.ts  ← @State/@Action NGXS (leer)

core/state/timetracker-state.ts    ← @Service() Signal-Pattern
features/timetracker/data-access/state/        ← @State/@Action NGXS (leer)
```

TimerButtonsComponent importiert `StartTracking`/`StopTracking` aus NGXS data-access — aber die Actions und Handler sind leer. **Die Buttons dispatchen in den Nirvana.**

### 2. TimerButtonsComponent — NGXS-Actions ohne Handler

`timer-buttons.component.ts` dispatcht NGXS-Actions:
```typescript
this.store.dispatch(new StartTracking({ issueKey: key }));
this.store.dispatch(new StopTracking());
```

Die `@Action`-Handler in `data-access/state/timetracker-state.ts` sind leer.
Das bedeutet: **Start/Stop tut nichts.**

### 3. TimerButtonsComponent — falsche HTML-Elemente

`timer-buttons.component.html` nutzt `<div>` statt `<button>`:
```html
<div (click)="start()">start</div>  <!-- kein button, kein Keyboard, kein ARIA -->
<div (click)="stop()">Stop</div>    <!-- auch Stop groß — inkonsistent -->
```

### 4. Circular Dependency in `core/state/`

`core/state/jira-state.ts`:
```typescript
import { JiraFlowFacade } from '..';  // core/index.ts → interfaces
```

`core/state/timetracker-state.ts`:
```typescript
import { TimeTrackerFlowFacade } from '..';
```

`core/index.ts` exportiert **nur** Interfaces. Das funktioniert technisch, aber es ist fragil — jeder der später eine konkrete Facade in core/state importiert, bricht die Circular Dependency.

---

## 🟠 Schwerwiegend

### 5. Timetracker-NGXS-Actions: `activeTimer` nicht auf `null` setzen bei `StopTracking`

```typescript
@Action(StopTracking)
protected stopTracking(ctx: StateContext<TimetrackerStateModel>) {
  return this.tracker.stopTracking().pipe(
    tap(() => ctx.setState(patch({ activeTimer: null })))  // OK, aber nicht getestet
  );
}
```

Problem: `tracker.stopTracking()` returnt `{ duration, date, id }` — kein TimeEntry. Der Handler setzt auf `null` was korrekt ist, aber wenn der Fetch davor fehlschlägt, bleibt der alte State.

### 6. WidgetComponent hat hardcoded Reload-Button

```html
<div class="jf-widget-footer">
  <button class="jf-btn" role="button">Reload</button>  <!-- hardcoded, ruft refresh() nie auf -->
</div>
```

Sollte den `refresh()` der eingebetteten Widget-Komponente aufrufen.

### 7. Dashboard importiert beides: WidgetSystem und TimerButtonsComponent

```typescript
imports: [
  WidgetComponent,          // Widget-System (title + toolbar + body)
  TimerButtonsComponent,    // standalone — wird nicht in Widget gerendert
]
```

In `dashboard.component.html`:
```html
<jiraflow-widget>
  <jiraflow-timer-buttons [issueKey]="..." toolbar></jiraflow-timer-buttons>
  <jiraflow-current-focus-task #currentFocusTask></jiraflow-current-focus-task>
</jiraflow-widget>

<jiraflow-widget>
  <jiraflow-active-timer-widget></jiraflow-active-timer-widget>
</jiraflow-widget>
```

Die `timer-buttons` werden **im** Widget gerendert (toolbar), aber `TimerButtonsComponent` ist ein eigenständiges Component — es wird nicht über das Widget-System verwaltet. Inkonsistentes Pattern.

### 8. TimetrackerState: startTracking/stopTracking — kein Error-Handling

```typescript
startTimer(key: string) {
  this.tracker.startTracking(key)
    .pipe(take(1))
    .subscribe({
      next: (timer) => { this._activeTimer.set(timer); },
      // kein error: {} ← Fehler bleibt stillschweigend swallowed
    });
}
```

### 9. `loadEntries` verwendet `new Date().toISOString()` zum Fixieren des Datums

```typescript
loadEntries(force = false) {
  this.fetchAndStore(
    this.tracker.getPeriod(new Date().toISOString()),  // Immer "heute" als Startdatum
    this._entries,
    force
  );
}
```

Das ist hardcoded "heute" — kein Ende-Datum. `getPeriod` erwartet `startDate` + optional `endDate`.

### 10. JiraIssuesListComponent nutzt rxResource direkt auf Facade, CurrentFocusTaskWidget nutzt Store

Inkonsistente Daten-Hol-Strategie im gleichen Feature:

```typescript
// issues-list.component.ts — direkt zur Facade
resource = rxResource({ stream: () => this.jiraFlowFacade.list() })

// current-focus-task-widget.component.ts — über Store/NGXS
this.store.selectSignal(JiraStateSelectors.currentFocusedTask)
```

### 11. `activeTimer`-Widget zeigt nur IssueKey, nichts weiter

```html
@if (activeTimer(); as activeSession) {
  <p>{{ activeSession.issueKey }}</p>
}
```

Kein Running-Timer, kein Datum, kein Start/Stop — das Widget tut nichts.

---

## 🟡 Moderate

### 12. `StopTracking` Command sendet leeres `issueKey`

```typescript
// time-tracker-vscode.ts
stopTracking(): Observable<{ duration: number; date: string; id: string }> {
  const command: StopTrackingCommand = {
    type: 'timetracker:stop-tracking',
    payload: { issueKey: '' },  // leeres Payload
  };
  return this.vscodeBridge.request<...>(command);
}
```

`stopTracking()` braucht gar kein `issueKey` — das Payload ist überflüssig.

### 13. `issues-list.component.html` zeigt nur Count/Total, keine Issues

```html
@if (resource.hasValue()) {
  <div>Count: {{ resource.value().count }}</div>
  <div>Total Issues: {{ resource.value().total }}</div>
}
```

Die eigentliche Issue-Liste (`data`) wird nicht gerendert.

### 14. SafeHtmlPipe: `bypassSecurityTrustHtml()` ohne Validierung

```typescript
transform(value: string | null | undefined): SafeHtml {
  if (!value) return '';
  return this.sanitizer.bypassSecurityTrustHtml(value);
}
```

`bypassSecurityTrustHtml()` umgeht Angulars XSS-Schutz. Das ist okay für Jira-Daten (Server-seitig), aber es gibt keine Warnung/Comment.

### 15. PortalRouterService: `activeRoute` Signal ist setzbar, aber nirgendwo genutzt

```typescript
setRoute(route: Routes): void {
  this.activeRoute.set(route);
}
```

Niemand ruft `setRoute()` auf — es ist toter Code.

### 16. TimerButtonsComponent `input<string | null>` — `null` Default erlaubt

```typescript
readonly issueKey = input<string | null>(null);
```

Wenn `issueKey` nicht gebunden ist, ist es `null`. Der `start()`-Check (`if (!key) return`) verhindert zwar den Dispatch, aber die Buttons sind trotzdem sichtbar — verwirrend.

### 17. `timer-widget.component.ts` — `refresh()` nicht implementiert

```typescript
refresh(): void {
  // not implemented
}
```

Das Widget wird über das Widget-System verwaltet (`WidgetComponent.contentChild(JIRA_FLOW_WIDGET)`), aber `refresh()` macht nichts.

---

## 🟢 Geringfügig

### 18. `title = signal('Deine Mudda')` in FocusTaskWidget

```typescript
title = signal('Deine Mudda');  // Testwert — sollte Titel sein
```

### 19. `WidgetComponent.title` — kein "Loading ..." nach kurzer Zeit ausblenden

```typescript
protected readonly title = computed(() => {
  const loadedWidget = this.widget();
  if (!loadedWidget) {
    return 'Loading ...';  // Bleibt ewig wenn Widget nicht geladen
  }
  return loadedWidget.title();
});
```

### 20. `app.ts` vs `app.component.ts` — benannt als `App` nicht `AppComponent`

```typescript
// app.ts (nicht app.component.ts)
@Component({
  selector: 'app-root',
  ...
})
export class App { ... }
```

Abweichung vom Angular-Konvention.

### 21. `timer-buttons.component.html` — keine CSS-Klassen oder Styling

```html
<div (click)="start()">start</div>
<div (click)="stop()">Stop</div>
```

Keine `jf-btn` Klasse, keine Disabled-States.

---

## Zusammenfassung

| Schweregrad | Anzahl |
|-------------|--------|
| 🔴 Kritisch | 4 |
| 🟠 Schwerwiegend | 7 |
| 🟡 Moderat | 6 |
| 🟢 Geringfügig | 4 |

### Wichtigste Hebel:

1. **Entscheide: `core/state/` (Signal) oder `features/*/data-access/state/` (NGXS)?** Nicht beides.
2. **TimerButtonsComponent muss funktionieren** — entweder die NGXS-Actions füllen ODER auf `core/state/TimetrackerState` umstellen.
3. **TimerButtonsComponent HTML:** `<div>` → `<button>`, `Stop` → `stop`
