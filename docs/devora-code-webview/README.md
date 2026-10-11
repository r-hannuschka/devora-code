# Devora Code Webview

Angular 22 Webview für die Devora Code VS Code Extension. Dashboard für Jira-Ticket-Verwaltung und Time-Tracking im Editor.

## Features

| Feature | Route | Beschreibung |
|---------|-------|-------------|
| **Dashboard** | `dashboard` | Startseite mit aktivem Timer, Issue-Liste, Bookings |
| **Aufgabenliste** | `jira:issue-list` | Jira-Tickets, Suche, Start/Stop Timer |
| **Issue-Details** | `jira:issue-detail` | Ticket-Details mit Status, Priority, Description |
| **Wochenansicht** | `timetracker:bookings` | Erfasste Zeiten als Tabelle (KW- oder Tagesmodus) |
| **Meetings** | `timetracker:meetings` | Meeting-Einträge erfassen (Datum, Uhrzeit, Anzahl) |

## Schichten

| Schicht | Beschreibung |
|---------|-------------|
| **App** | DI-Provider, Router-Config, Shell-Komponenten (Dashboard, Toolbar) |
| **Core** | Framework-Infrastruktur: API-Facades, PortalRouter, Global State (Session) |
| **Features** | Business-Logik: Issue-Management, Time-Tracking (eigene States + Komponenten) |
| **Common** | Wiederverwendbare UI-Komponenten (Widget, Session-Widget, Pipes, Utils) |

## Datenfluss

```
Component
  │
  ├──→ BookingsDatasource (computed reactive)
  │     └──→ TimeTrackerApi (NGXS Store)
  │
  ├──→ IssueApi (NGXS Store)
  │     └──→ VsCodeBridge → acquireVsCodeApi() → Extension
  │
  └──→ PortalRouterService (Navigation zwischen Routes)
```

## Entwicklung

```bash
# Dev-Server (Browser-Modus mit Mock)
ng serve

# Production Build (→ Extension Core)
ng build --configuration production
```

### Browser-Modus vs. VS Code

Im Browser (`ng serve`) funktioniert `acquireVsCodeApi()` nicht. Die `VsCodeBridge`
erkennt dies automatisch und schaltet in den **Mock-Modus**:

- Commands werden in die Console geloggt (`[VsCodeBridge Mock]`)
- Responses kommen sofort als `null` zurück
- Keine Hänger, UI ist testbar ohne VS Code Extension

## Styling

- **Angular Material** (CDK Table, Icons, Form Fields, Autocomplete)
- **SCSS**-Variablen für Icons, Farben, Spacing
- **Utility-Klassen** (Tailwind-ähnlich: `d-flex`, `gap-3`, `mb-3`, etc.)
- **BEM-ähnliche Struktur**: `.workpulse-<feature>-<element>`
