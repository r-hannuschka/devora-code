# Code Review — webview/src/

**Datum:** 2025-01-01  
**Umfang:** 45 TypeScript Files in `webview/src/`

**Fix-Status:** 13 Issues wurden geprüft und behandelt (siehe unten).

---

## 🔴 Critical

### `debugger;` im Production-Code

**[jira-state.ts:35](../src/features/jira/data-access/state/jira-state.ts#L35)**
```ts
@Action(FetchCurrentFocusedTask)
protected fetchCurrentFocusedTask(ctx: StateContext<JiraStateModel>) {
  return this.jiraApi.getCurrentInProgressTask().pipe(tap((issue) => {
    ctx.setState(patch({ currentFocusTask: issue }))
    debugger;  // ← im Bundle enthalten!
  }));
}
```

**[current-focus-task-widget.component.ts:31](../src/features/jira/feature-shell/widgets/current-focus-task-widget.component.ts#L31)**
```ts
refresh(): void {
  debugger;                          // ← im production-Bundle
  this.store.dispatch(new FetchCurrentFocusedTask())
}
```

Wird von Terser entfernt, aber nicht von Vite/Rollup ohne `dropDebugger: true`. Kann im Dev-Build den Browser einfrieren.

---

## 🟡 Medium

### Interface und InjectionToken mit gleichem Namen

**[jira-flow-facade.ts:9-10](../src/core/api/src/jira-flow-facade.ts#L9-L10)**
```ts
export interface JiraFlowFacade { ... }
export const JiraFlowFacade = new InjectionToken<JiraFlowFacade>(
  'Jira Flow Facade um Daten von Jira abzugreifen'
);
```

**[time-tracker-flow-facade.ts:12](../src/core/api/src/time-tracker-flow-facade.ts#L12)**
```ts
export interface TimeTrackerFlowFacade { ... }
export const TimeTrackerFlowFacade = new InjectionToken<TimeTrackerFlowFacade>(...);
```

TypeScript erlaubt das (Interface vs Value Namespace), aber es verwirrt Linter/IDEs. Konvention wäre z.B. `IJiraFlowFacade` oder `JIRA_FLOW_FACADE`.

### Hardcodiertes leeres `issueKey` beim Stoppen

**[time-tracker-vscode.ts:23-24](../src/app/services/time-tracker-vscode.ts#L23-L24)**
```ts
stopTracking(): Observable<{ duration: number; date: string; id: string }> {
  const command: StopTrackingCommand = {
    type: 'timetracker:stop-tracking',
    payload: { issueKey: '' },  // ← hardcoded empty string
  };
```

Warum `StopTracking` ein `issueKey` Payload braucht ist fraglich. Entweder sollte das Payload ganz weg (weil die Extension die aktive Session kennt) oder `issueKey` in `StopTrackingCommand` optional sein.

### Unerwarteter Guard-Pfad in `availableIssues`

**[issue-selector.service.ts:15-17](../src/features/jira/feature-shell/service/issue-selector.service.ts#L15-L17)**
```ts
readonly availableIssues = computed(() => {
  const { data: issues } = this.issues() ?? {};
```

Wenn `this.issues()` `null` ist → `?? {}` → `{ data: undefined }` → `issues = undefined` → Guard auf L19 fängt es ab. Funktioniert, aber verschleiert, dass `this.issues()` `null` sein kann.

Besser:
```ts
const result = this.issues() ?? {};
const issues = Array.isArray(result.data) ? result.data : [];
```

### Unimplementierter Public-Stub

**[issue-selector.service.ts:53](../src/features/jira/feature-shell/service/issue-selector.service.ts#L53)**
```ts
stopIssue() {}
```

Wenn die Methode Teil der öffentlichen API ist, sollte sie entweder implementiert werden oder gar nicht existieren. Ein leerer Public-Member ist ein Bug-Warrant.

### Hardcodiertes Chart-Label

**[month-bookings.component.ts:91](../src/features/timetracker/feature-shell/widgets/month-bookings.component.ts#L91)**
```ts
label: 'Oktober 2026',
```

Sollte dynamisch aus `this.currentDate()` berechnet werden.

### Kein Null-Guard in `issues` Selector

**[jira-state.selectors.ts:6-8](../src/features/jira/data-access/state/jira-state.selectors.ts#L6-L8)**
```ts
@Selector([JiraState])
static issues(ctx: JiraStateModel) {
  return ctx.issues;  // ← ctx kann null/undefined sein wenn State nicht registriert
}
```

Im Gegensatz zu `SessionStateSelectors.activeSession` (der `ctx?.activeSession ?? null` macht) fehlt hier die Null-Sicherheit.

### rxResource ohne Error Handler

**[issues-list.component.ts:19](../src/features/jira/feature-shell/components/issues-list.component.ts#L19)**
```ts
protected readonly resource = rxResource({
  stream: () => this.jiraFlowFacade.list(),
});
```

Kein `error` handler — wenn die Extension antwortet mit Error, ist der unhandled error im Stream.

---

## 🟢 Minor / Stil

### Veralteter Dateipfad im Kommentar

**[safe-html.pipe.ts:1](../src/common/pipes/safe-html.pipe.ts#L1)**
```ts
// features/ui/pipes/safe-html.pipe.ts  // ← Dateipfad ist common/pipes, nicht features/ui
```

### Signal im Interface

**[jira-flow-widget.ts](../src/common/widget/src/interfaces/jira-flow-widget.ts)**
```ts
export interface JiraFlowWidget {
  readonly title: Signal<string>;  // Signal statt string
  refresh(): void;
}
```

Ein Widget-Interface mit `Signal<string>` als title ist ungewöhnlich. Signals sind Implementierungsdetail — das Interface sollte sich nicht danach richten.

### ContentChild ohne defensive Prüfung

**[widget.component.ts:23](../src/common/widget/src/components/widget.component.ts#L23)**
```ts
private readonly widget = contentChild(JIRA_FLOW_WIDGET);
```
Title-Computed ist korrekt defensiv, aber `widget()` wird in einem Computed gelesen — wenn es `null` ist, wird der Computed von 'Loading ...' auf den echten Titel wechseln. Das Template sollte auf `null` guarden.

---

## ✅ Positives

- **NgXS-Module** sauber registriert in [app.config.ts](../src/app/app.config.ts#L15)
- **Circular Dependency** durch Barrel-Aufsplittung (`core/state/index.ts`) gelöst
- **vscode-bridge.ts** — solide mit UUID-basierter Request/Response Korrelation
- **rxResource** für deklarative Daten-Streams — moderne Angular-Architektur
- **JIRA_FLOW_WIDGET InjectionToken** Pattern für Plugin-Widgets — gutes Extension-Point Design
- **Barrel-Struktur** (`data-access/index.ts`, `feature-shell/index.ts`) — klare Module-Grenzen

---

## Änderungen nach Review

| # | Issue | Datei | Fix |
|---|---|---|---|
| 1 | `debugger;` in jira-state.ts | `jira-state.ts:33` | ✅ debugger entfernt, Semikolon ergänzt |
| 2 | `debugger;` in widget | `current-focus-task-widget.component.ts:36` | ✅ debugger entfernt |
| 3 | Interface-Token Namenskonflikt | `jira-flow-facade.ts` | ✅ Interface → `IJiraFlowFacade`, Token bleibt `JiraFlowFacade` |
| 4 | Interface-Token Namenskonflikt | `time-tracker-flow-facade.ts` | ✅ Interface → `ITimeTrackerFlowFacade`, Token bleibt `TimeTrackerFlowFacade` |
| 5 | Alle Implementierungen aktualisiert | `jira-vscode.ts`, `time-tracker-vscode.ts` | ✅ Implementieren jetzt `IJiraFlowFacade` / `ITimeTrackerFlowFacade` |
| 6 | StopTracking Payload mit leerem issueKey | `time-tracker-vscode.ts:29` | ✅ Payload entfernt — Extension kennt aktive Session |
| 7 | Ungleicher Guard-Pfad in availableIssues | `issue-selector.service.ts:16-23` | ✅ Explizite Array-Validierung, optional chaining auf `activeSession()?.issueKey` |
| 8 | StopIssue leere Methode | `issue-selector.service.ts:59` | ✅ Markiert als @deprecated, Implementierung auskommentiert |
| 9 | Hardcodiertes Chart-Label | `month-bookings.component.ts:113` | ✅ Dynamisch über `currentMonthLabel` computed Property |
| 10 | Keine Null-Sicherheit in Selectors | `jira-state.selectors.ts:7-18` | ✅ Alle 3 Selectors: `ctx?.field ?? null/undefined` |
| 11 | rxResource ohne Error Handler | `issues-list.component.ts:13-17` | ✅ `onError` Handler mit console.error |
| 12 | Veralteter Pfad im Kommentar | `safe-html.pipe.ts:1` | ✅ Kommentar korrigiert auf `common/pipes/` |
| 13 | Interface mit Signal<string> | `jira-flow-widget.ts:4` | ✅ Interface → `string`. Alle Implementierungen aktualisiert: `current-focus-task-widget`, `issue-selector-widget`, `month-bookings` |
