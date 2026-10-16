# Refactoring-Plan: Verzeichnisstruktur

## Zielstruktur

```
src/
├── domain/              ← Business-Logik
│   ├── session/
│   │   ├── commands/
│   │   │   ├── get-active.command.ts
│   │   │   ├── reset.command.ts
│   │   │   ├── start.command.ts
│   │   │   └── stop.command.ts
│   │   ├── service/
│   │   │   └── session.service.ts
│   │   └── index.ts
│   │
│   ├── timesheet/
│   │   ├── commands/
│   │   │   ├── add-entry.command.ts
│   │   │   ├── get-month.command.ts
│   │   │   ├── get-period.command.ts
│   │   │   ├── timesheet-open.command.ts
│   │   │   └── timesheet-sync-from-raw.command.ts
│   │   ├── service/
│   │   │   └── timesheet.service.ts
│   │   ├── util/
│   │   │   └── collision.ts
│   │   └── index.ts
│   │
│   ├── webview/
│   │   ├── src/
│   │   │   ├── exception/
│   │   │   │   ├── error.code.ts
│   │   │   │   └── missing_context.exception.ts
│   │   │   └── service/
│   │   │       └── webview.ts
│   │   ├── webview.module.ts
│   │   └── index.ts
│   │
│   ├── routing/
│   │   ├── command-router.ts
│   │   └── index.ts
│   │
│   └── satellite/
│       ├── satellite.service.ts
│       └── index.ts
│
├── infrastructure/      ← Technische Umsetzung
│   ├── timesheet/
│   │   ├── src/
│   │   │   ├── model/
│   │   │   │   └── time-entry.dto.ts
│   │   │   ├── timesheet.operations.ts
│   │   │   └── timesheet.repository.ts
│   │   └── index.ts
│   │
│   ├── exception/
│   │   └── src/
│   │       ├── base.exception.ts
│   │       ├── error.code.ts
│   │       ├── storage-not-found.exception.ts
│   │       ├── storage-write.exception.ts
│   │       └── timeout.exception.ts
│   │
│   ├── logger/
│   │   ├── commands/
│   │   │   └── send-log.command.ts
│   │   ├── service/
│   │   │   └── logger.service.ts
│   │   └── index.ts
│   │
│   ├── notification/
│   │   └── src/
│   │       └── notification.service.ts
│   │
│   ├── settings/
│   │   ├── index.ts
│   │   ├── settings.service.ts
│   │   └── settings.ts
│
├── core/                ← Framework
│   └── constants/
│       └── src/
│           └── token.ts
│
└── util/                ← Pure Utilities
    ├── time/
    │   ├── src/
    │   │   ├── create-time-entry.ts
    │   │   ├── normalize-time-span.ts
    │   │   └── time.ts
    │   └── index.ts
    └── common/
        └── index.ts
```

## Umsetzungsschritte

### 1. Ordnerstruktur erstellen
- `src/domain/` – Business-Logik (Services, Commands, Entities, Utils)
- `src/infrastructure/` – Technische Umsetzung (Repositories, Logger, Notifications, Settings, Exceptions)
- `src/core/` – Framework (nur noch constants)
- `src/util/` – Pure Utilities (unchanged)

### 2. Dateien verschieben

**Domain-Bereich:**
| Alt | Neu |
|---|---|
| `src/modules/session/*` | `src/domain/session/` |
| `src/modules/timesheet/*` | `src/domain/timesheet/` |
| `src/modules/timetracker/*` | `src/domain/timetracker/` |
| `src/modules/webview/*` | `src/domain/webview/` |
| `src/domain/routing/*` | `src/domain/routing/` (src/ Subdir löschen) |
| `src/domain/satellite/*` | `src/domain/satellite/` (src/ Subdir löschen) |

**Infrastructure-Bereich:**
| Alt | Neu |
|---|---|
| `src/core/infrastructure/*` | `src/infrastructure/timesheet/` |
| `src/core/exception/*` + `src/core/infrastructure/exceptions/*` | `src/infrastructure/exception/` |
| `src/core/logger/*` | `src/infrastructure/logger/` |
| `src/core/notification/*` | `src/infrastructure/notification/` |
| `src/core/settings/*` | `src/infrastructure/settings/` |

**Core-Bereich:**
| Alt | Neu |
|---|---|
| `src/core/constants/*` | `src/core/constants/` (src/ Subdir löschen) |

**Util-Bereich:**
| Alt | Neu |
|---|---|
| `src/util/time/*` | `src/util/time/` (src/ Subdir löschen) |

### 3. Barrel-Exports aktualisieren

Jedes Modul braucht einen korrekten `index.ts`:

```typescript
// src/domain/session/index.ts
export * from "./commands/get-active.command";
export * from "./commands/reset.command";
export * from "./commands/start.command";
export * from "./commands/stop.command";

// src/domain/timesheet/index.ts
export * from "./commands/add-entry.command";
export * from "./commands/get-month.command";
export * from "./commands/get-period.command";
export * from "./commands/timesheet-open.command";
export * from "./commands/timesheet-sync-from-raw.command";

// src/domain/webview/index.ts
export * from "./webview.module";

// src/infrastructure/logger/index.ts
export * from "./service/logger.service";
export * from "./commands/send-log.command";

// src/infrastructure/notification/index.ts
export * from "./src/notification.service";

// src/infrastructure/settings/index.ts
export * from "./src/settings.service";
export * from "./src/interfaces/jira-api-token.interface";
export * from "./src/interfaces/jira-user-name.interface";
export * from "./src/interfaces/jira-project-key.interface";
export type { IssueTypeMapping, IssueStatus } from "@devora-code/api";

// src/infrastructure/timesheet/index.ts
export * from "./src/timesheet.repository";
export * from "./src/model/time-entry.dto";

// src/infrastructure/exception/index.ts
export * from "./src/base.exception";
export * from "./src/timeout.exception";
export * from "./src/error.code";
```

### 4. Import-Pfade anpassen

**Path-Aliases in tsconfig.json:**
```json
{
  "paths": {
    "@/core/*": ["./src/core/*/index.ts"],
    "@/domain/*": ["./src/domain/*/index.ts"],
    "@/util/*": ["./src/util/*/index.ts"]
  }
}
```

**Import-Updates (Suchen & Ersetzen):**

| Ersetzen durch | Dateien |
|---|---|
| `@/modules/session` → `@/domain/session` | src/, tests/ |
| `@/modules/timesheet` → `@/domain/timesheet` | src/, tests/ |
| `@/modules/webview` → `@/domain/webview` | src/, tests/ |
| `@/core/infrastructure` → `@/infrastructure/timesheet` | src/, tests/ |
| `@/core/logger` → `@/infrastructure/logger` | src/, tests/ |
| `@/core/notification` → `@/infrastructure/notification` | src/, tests/ |
| `@/core/settings` → `@/infrastructure/settings` | src/, tests/ |
| `@/core/exception` → `@/infrastructure/exception` | src/, tests/ |
| `@src/modules/` → `@/domain/` | tests/ |
| `@/domain/routing/src/` → `@/domain/routing/` | src/ |
| `@/domain/satellite/src/` → `@/domain/satellite/` | src/ |
| `@/util/time/src/` → `@/util/time/` | src/ |
| `../domain/session.service` → `../domain/session.service` | domain/session/commands/ |
| `../domain/timesheet.service` → `../domain/timesheet.service` | domain/timesheet/commands/ |
| `../infrastructure/` → `../infrastructure/` (pfade anpassen) | domain/timetracker/ |

### 5. Tests fixen

Test-Imports aktualisieren:
- `@/modules/session` → `@/domain/session`
- `@/modules/timesheet` → `@/domain/timesheet`
- `@src/modules/session/domain/session.service` → `@/domain/session/domain/session.service`
- `@src/modules/timesheet/domain/timesheet.service` → `@/domain/timesheet/domain/timesheet.service`
- `@src/modules/timetracker/infrastructure/timesheet.repository` → `@/infrastructure/timesheet/src/timesheet.repository`

### 6. Tests ausführen
```bash
cd devora-code-core
npm run test
```

### 7. Fehler beheben
- TypeScript-Compiler-Fehler auflösen
- Barrel-Exports korrigieren
- Relative Imports anpassen

## Priorisierung
1. Ordnerstruktur erstellen
2. Dateien verschieben
3. Barrel-Exports aktualisieren
4. Import-Pfade anpassen (tsconfig + Code)
5. Tests fixen
6. Kompilieren + Tests ausführen
7. Fehler beheben
