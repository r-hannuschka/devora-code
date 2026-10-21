# Devora Code

VS Code Extension für Jira-Tasks – Zeiterfassung direkt aus dem Editor, ohne Browser-Wechsel.

---

## Was ist Devora Code?

Devora Code ist eine VS Code Extension, mit der du deine Zeit für Jira-Tasks trackst – direkt aus VS Code, ohne zum Browser zu wechseln. Du bist im Editor, klickst auf "Devora Code öffnen", siehst deine Tasks, startest den Timer. Fertig.

---

## Einrichtung

### 1. Extension installieren

Installiere Devora Code über die VS Code Extensions Marketplace oder lade die `.vsix` Datei direkt.

### 2. Einstellungen konfigurieren

Devora Code speichert seine Einstellungen **workspace-lokal** – nicht global in VS Code. So kannst du für jeden Workspace (z.B. verschiedene Projekte oder Mandanten) eigene Settings haben.

Es gibt **zwei Möglichkeiten**:

**Option A: `.vscode/settings.json` im Projektordner**

```json
{
  "devora-code.projectName": "meine-app",
  "devora-code.jira.apiUrl": "https://mein-jira.atlassian.net",
  "devora-code.jira.userName": "ich",
  "devora-code.jira.apiToken": "mein-token",
  "devora-code.jira.projectKey": "PROJ"
}
```

→ Gut für Team-fähige Einstellungen, die ihr gemeinsam nutzt.

**Option B: `.code-workspace` Datei** → Settings komplett extern, getrennt vom Code

```json
{
  "folders": [{ "path": "." }],
  "settings": {
    "devora-code.projectName": "meine-app",
    "devora-code.jira.apiUrl": "https://mein-jira.atlassian.net",
    "devora-code.jira.userName": "ich",
    "devora-code.jira.apiToken": "mein-token",
    "devora-code.jira.projectKey": "PROJ"
  }
}
```

→ Gut wenn du deine Settings komplett getrennt vom Code halten willst – die `.code-workspace` kann irgendwo liegen, muss nicht im Projekt sein.

### 3. Dashboard öffnen

```
Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux)
→ "Devora Code: open webview"
```

---

## Features

- Timer direkt im Editor starten & stoppen
- Tasks aus Jira laden (via `.code-workspace` konfiguriert)
- Timesheet für den aktuellen Monat
- Timesheet-Backup und -Restore

---

## Entwicklung

### Projektstruktur

```
devora-code-api/         → Shared Types (Commands, DTOs, Mappings)
devora-code-core/        → VS Code Extension (Webview, CommandRouter, Settings, Logger)
devora-code-jira/        → Jira-Satellite (Issues laden, Focus-Task, Timer)
devora-code-sdk/         → Command-Pattern (Controller, Registry, Decorator)
devora-code-webview/     → Angular Dashboard (Issues, Timer, Timesheet)
```

### Kurzübersicht

| Paket | Tech | Zweck |
|-------|------|-------|
| `devora-code-api` | TypeScript | Shared Types – Commands, DTOs, Mappings |
| `devora-code-core` | TS · Vite · tsyringe | VS Code Extension: Webview, Commands, Settings, Logger |
| `devora-code-jira` (Satellit) | TS · Vite · tsyringe | Jira: Issues laden, Focus-Task, Timer |
| `devora-code-sdk` | TypeScript | Command-Pattern: Controller, Registry, @RegisterCommand |
| `devora-code-webview` | Angular 22 · NGXS | Dashboard: Issues, Timer, Timesheet |

### Schnellstart

```bash
# Requires Node.js 24 (use nvm: nvm install 24 && nvm use 24)
# Dependencies installieren
npm install

# Alles bauen
npm run build:all
```

### Extension bauen und packen

```bash
# Extensions bauen (Core → Jira + Webview) und als .vsix packen
npm run package
# → .vsix Dateien in dist/
```

### Watch-Modus

```bash
# Alles im Watch-Modus (Core, Jira, Webview, API, SDK)
npm run watch:all
```

### Extension starten


```bash
code .
# Drücke F5 → Debug-Session startet die Extension mit Webview
```

---

MIT – Ralf Hannuschka
