# Devora Code

VS Code Extension für Jira-Tasks – Zeit tracking direkt aus dem Editor, ohne Browser-Wechsel.

---

## Was ist Devora Code?

Devora Code ist eine **VS Code Extension**, mit der du deine Zeit für Jira-Tasks trackst – direkt aus VS Code, ohne zum Browser zu wechseln. Du bist im Editor, klickst auf "Devora Code öffnen", siehst deine Tasks, startest den Timer. Fertig.

Es basiert auf einem **extensiblen Plugin-System**: Der Core bringt das Fundament (Command-System, Webview, Logger). Jira ist der erste Satellite – weiter könnten folgen: Confluence, GitHub, CI-Pipelines.

---

## Projektstruktur

```
devora-code-api/          → Shared Types (Commands, DTOs, Mappings)
devora-code-core/         → VS Code Extension Core
devora-code-jira/         → Jira-Satellite (Issue-Loading, Time-Tracking)
devora-code-sdk/          → Command-Pattern (Controller, Registry, Decorator)
devora-code-webview/      → Angular Dashboard (Issues, Timer, Timesheet)
```

### Kurzübersicht

| Paket | Tech | Zweck |
|-------|------|-------|
| `devora-code-api` | TypeScript | Shared Types – keine Logik, nur Interfaces |
| `devora-code-core` | TS · Vite · tsyringe | Core: Webview, CommandRouter, Settings, Logger |
| `devora-code-jira` (Satellit) | TS · Vite · tsyringe | Jira: Issues laden, Focus-Task, Timer |
| `devora-code-sdk` | TS · tsc | Command-Pattern: Controller, Registry, @RegisterCommand |
| `devora-code-webview` | Angular 22 · NGXS | Dashboard: Issues, Timer, Timesheet |

---

## Schnellstart

### 1. Dependencies installieren

```bash
npm install
```

### 2. Satellit konfigurieren

Jeder Satellit bringt seine eigene Konfiguration mit (z.B. Jira-URL, Token). Details im jeweiligen Satelliten-Paket.

### 3. Extension starten

```bash
code .
# Drücke F5 → Debug-Session startet die Extension mit Webview
```

### 4. Dashboard öffnen

```
Ctrl+Shift+P / Cmd+Shift+P
→ "Devora Code: open webview"
```

---

## Entwicklung

```bash
# Einmal bauen
npm run build:all

# Watch-Modus für Core, Jira und Webview
npm run watch:all

# Webview Dev-Server
cd devora-code-webview && npm start
# Angular HMR auf localhost:4200

# Browser-Modus (keine VS Code nötig, Commands werden geloggt)
```

---

## Lizenz

MIT – Ralf Hannuschka

