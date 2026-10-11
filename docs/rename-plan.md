# Brand Rename: Workpulse → Devora Code

## Übersicht

Alle Vorkommen von "workpulse" in den 4 Root-Projekten auf "devoracode" umbenennen.
Jeder Kontext hat eigene Regeln — kein pauschales Suchen&Ersetzen.

---

## Phase 1: Directory Names

### Regel
Directory-Namen in allen Root-Verzeichnissen umbenennen.

### Änderungen
| Alt | Neu |
|-----|-----|
| `workpulse-core/` | `devoracode-core/` |
| `workpulse-webview/` | `devoracode-webview/` |
| `workpulse-jira/` | `devoracode-jira/` |
| `workpulse-sdk/` | `devoracode-sdk/` |
| `api/` | `devoracode-api/` |

### Nacharbeiten
- Alle Import-Pfade anpassen (relativ zu neuem Verzeichnisnamen)
- `angular.json` paths aktualisieren
- `tsconfig.json` paths/aliases aktualisieren

---

## Phase 2: NPM Package Scopes + Package Names

### Regel
Package-Namen in package.json umbenennen, package-lock.json wird neu generiert.

### NPM Package Scope (`@workpulse` → `@devoracode`)
| Alt | Neu |
|-----|-----|
| `@workpulse/api` | `@devoracode/api` |
| `@workpulse/common` | `@devoracode/common` |
| `@workpulse/core` | `@devoracode/core` |
| `@workpulse/issue` | `@devoracode/issue` |
| `@workpulse/timetracker` | `@devoracode/timetracker` |
| `@workpulse/vscode` | `@devoracode/vscode` |
| `@workpulse/webview` | `@devoracode/webview` |

### NPM Package Namen (`workpulse-` → `devoracode-`)
| Alt | Neu |
|-----|-----|
| `workpulse-core` | `devoracode-core` |
| `workpulse-webview` | `devoracode-webview` |
| `workpulse-jira` | `devoracode-jira` |
| `workpulse-sdk` | `devoracode-sdk` |
| `workpulse-api` | `devoracode-api` |

### Dateien
- Jedes `package.json`
- `package-lock.json` neu generieren (`npm install`)

---

## Phase 3: NPM Imports in TypeScript

### Regel
Import-Pfade mit `@devoracode/...` aktualisieren.

### Pattern
- **Suche nach**: `from '@workpulse/` und `import.*from.*@workpulse/`
- **Ersetzen mit**: `@devoracode/`
- **Betroffen**: Alle `.ts`-Dateien

### Wichtige Import-Pfade
```typescript
// Vorher
import { ... } from '@workpulse/core/portal-router';
import { ... } from '@workpulse/core/api';
import { ... } from '@workpulse/core/state';
import { ... } from '@workpulse/issue/data-access';
import { ... } from '@workpulse/timetracker/data-access';
import { ... } from '@workpulse/common/widget';

// Nachher
import { ... } from '@devoracode/core/portal-router';
import { ... } from '@devoracode/core/api';
import { ... } from '@devoracode/core/state';
import { ... } from '@devoracode/issue/data-access';
import { ... } from '@devoracode/timetracker/data-access';
import { ... } from '@devoracode/common/widget';
```

---

## Phase 4: CSS Klassen

### Regel
CSS-Klassennamen im SCSS umbenennen. Pattern: `workpulse-` → `devora-code-`

### Klassengruppen

| Gruppe | Alt | Neu |
|--------|-----|-----|
| **Layout** | `workpulse-dashboard`, `workpulse-page`, `workpulse-header-toolbar` | `devora-code-dashboard`, `devora-code-page`, `devora-code-header-toolbar` |
| **Komponenten** | `workpulse-bookings`, `workpulse-month-bookings` | `devora-code-bookings`, `devora-code-month-bookings` |
| **Buttons/Controls** | `workpulse-btn`, `workpulse-primary` | `devora-code-btn`, `devora-code-primary` |
| **Labels/Info** | `workpulse-loading`, `workpulse-error`, `workpulse-label` | `devora-code-loading`, `devora-code-error`, `devora-code-label` |
| **Issue** | `workpulse-issue-row`, `workpulse-issue-*` | `devora-code-issue-row`, `devora-code-issue-*` |
| **Teaser** | `workpulse-teaser`, `workpulse-teaser-content`, `workpulse-teaser-toggle` | `devora-code-teaser`, `devora-code-teaser-content`, `devora-code-teaser-toggle` |
| **Icons** | `workpulse-icon-*` (17 Icons) | `devora-code-icon-*` |

### Icon-Klassen
```
workpulse-icon-bookings       → devora-code-icon-bookings
workpulse-icon-bug            → devora-code-icon-bug
workpulse-icon-chevron        → devora-code-icon-chevron
workpulse-icon-extension      → devora-code-icon-extension
workpulse-icon-feature        → devora-code-icon-feature
workpulse-icon-open           → devora-code-icon-open
workpulse-icon-preview        → devora-code-icon-preview
workpulse-icon-query          → devora-code-icon-query
workpulse-icon-refresh        → devora-code-icon-refresh
workpulse-icon-search         → devora-code-icon-search
workpulse-icon-speed          → devora-code-icon-speed
workpulse-icon-start          → devora-code-icon-start
workpulse-icon-stop           → devora-code-icon-stop
workpulse-icon-task-list      → devora-code-icon-task-list
workpulse-icon-test           → devora-code-icon-test
workpulse-icon-today          → devora-code-icon-today
workpulse-icon-toolkit        → devora-code-icon-toolkit
```

### Dateien
- `.scss` Dateien im `theme/` und `components/`
- `.html` Templates wo Klassen referenziert werden
- Font-Symbol-Datenbank (workpulse.svg/font-face)

---

## Phase 5: Component Selectors

### Regel
Angular Component `selector` Attribute umbenennen. Pattern: `workpulse-` → `devora-code-`

### Selectors
| Alt | Neu |
|-----|-----|
| `workpulse-widget` | `devora-code-widget` |
| `workpulse-bookings` | `devora-code-bookings` |
| `workpulse-month-bookings` | `devora-code-month-bookings` |
| `workpulse-teaser` | `devora-code-teaser` |
| `workpulse-issue-selector-widget` | `devora-code-issue-selector-widget` |
| `workpulse-active-session` | `devora-code-active-session` |
| `workpulse-timer-buttons` | `devora-code-timer-buttons` |

### Dateien
- `@Component({ selector: 'workpulse-...' })` in allen TS-Dateien
- Verweisende Templates: `<workpulse-...>` → `<devora-code-...>`

---

## Phase 6: TypeScript Klassen, Interfaces, Konstanten

### Regel
Namen von Klassen, Interfaces und Konstanten umbenennen.

### Klassen & Interfaces (PascalCase)
| Alt | Neu |
|-----|-----|
| `WorkpulseWebview` | `DevoraCodeWebview` |
| `WorkpulseWebviewModule` | `DevoraCodeWebviewModule` |
| `WorkpulseWidget` | `DevoraCodeWidget` |
| `WorkpulseWidgetAction` | `DevoraCodeWidgetAction` |
| `workpulseTeaserComponent` | `devoraCodeTeaserComponent` |

### Konstanten (UPPER_CASE)
| Alt | Neu |
|-----|-----|
| `WORKPULSE_WIDGET` | `DEVORA_CODE_WIDGET` |

### Vorkommen
- Class declarations: `export class WorkpulseWidget implements WorkpulseWidget`
- Token: `provide: WORKPULSE_WIDGET`
- Interface: `interface WorkpulseWidget`

---

## Checklist

- [ ] Phase 1: Directory Names
- [ ] Phase 2: NPM Package Scopes + Package Names
- [ ] Phase 3: NPM Imports in TypeScript
- [ ] Phase 4: CSS Klassen
- [ ] Phase 5: Component Selectors
- [ ] Phase 6: TypeScript Klassen, Interfaces, Konstanten

---

## Wichtige Hinweise

1. **Reihenfolge einhalten** — zuerst Verzeichnisse, dann Imports, dann CSS/Selectors
2. **package-lock.json** nach Phase 2 neu generieren
3. **Font-Dateien** — workpulse.svg/font-face enthält Klassennamen als Unicode-Glyph-Referenzen
4. **README.md** — Dokumentation und Screenshots nicht vergessen
5. **VS Code Extension** — manifest.json (package.json) enthält Namen und Beschreibung
6. **Testen nach jeder Phase** — `npm install` + `ng build` + `ng serve`
