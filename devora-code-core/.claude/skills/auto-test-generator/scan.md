# Scan-Workflow: Ungetesteten Code finden

> Dieser Workflow identifiziert Command Handler und Service Methods, für die noch keine
> Integrationstests existieren. Führe die Schritte in Reihenfolge aus.

---

## Schritt 1: Module identifizieren

Finde alle Module mit Commands/Services:

```bash
find src/domain -name "*.ts" -path "*/commands/*" | sort
find src/domain -name "*.ts" -path "*/service/*" | sort
```

Ergebnis ist die Liste aller Command Handler und Services, die getestet werden könnten.

Für dieses Projekt:

| Modul | Commands | Services |
|---|---|---|
| `session` | 4: get-active, reset, start, stop | 1: SessionService |
| `timesheet` | 5: add-entry, get-month, get-period, open-timesheet, sync-from-raw | 1: TimesheetService |
| `timetracker` | — | time-tracker.service, datetime-utils, collision-utils, exceptions |

---

## Schritt 2: Existierende Tests pro Modul zählen

```bash
find tests/domain/<modul>/tests -name "*.spec.ts" 2>/dev/null | sort
```

Ergebnis für dieses Projekt:

### session (alle 4 Commands + 3 Service Methods getestet)

| Datei | Testet |
|---|---|
| `tests/domain/session/tests/commands/get-active.command.spec.ts` | GetActiveTimerHandler |
| `tests/domain/session/tests/commands/reset.command.spec.ts` | ResetSessionHandler |
| `tests/domain/session/tests/commands/start.command.spec.ts` | StartSessionHandler (3 Tests) |
| `tests/domain/session/tests/commands/stop.command.spec.ts` | StopSessionHandler |
| `tests/domain/session/tests/domain/session.service.resetSession.spec.ts` | resetSession() |
| `tests/domain/session/tests/domain/session.service.start.spec.ts` | start() (2 Tests) |
| `tests/domain/session/tests/domain/session.service.stopTracking.spec.ts` | stopTracking() (2 Tests) |

**Lücken in session:**
- `SessionService.resetSession()` — Command-Handler-Test fehlt (nur Service-Test)
- `SessionService.isTracking()`, `getActiveTimer()`, `getActiveIssueKey()`, `getActiveTimerRef()` — keine Tests
- `StartSessionHandler` — nur 3 Tests, könnte mehr Edge Cases abdecken

### timesheet (alle 5 Commands + 7 Service Methods getestet)

| Datei | Testet |
|---|---|
| `tests/domain/timesheet/tests/commands/add-entry.command.spec.ts` | AddEntryHandler (NONE, BLOCK, SPLIT, Mitternacht) |
| `tests/domain/timesheet/tests/commands/get-period.command.spec.ts` | GetPeriodHandler |
| `tests/domain/timesheet/tests/commands/open-timesheet.command.spec.ts` | TimesheetOpenHandler |
| `tests/domain/timesheet/tests/domain/timesheet.service.spec.ts` | addEntry, getDay, getPeriod, getByIssueKey, getMonth, getRaw, splitActiveTimer |
| `tests/domain/timesheet/tests/domain/timesheet.service-split.spec.ts` | AddEntryHandler Split-Szenarien (9 Tests) |

**Lücken in timesheet:**
- `get-month.command` — KEIN Command-Handler-Test!
- `sync-from-raw.command` — KEIN Command-Handler-Test!
- `TimesheetService.syncFromRaw()` — KEIN Service-Test!

### timetracker (keine Tests existierend)

- `time-tracker.service` — KEINE Tests
- `collision-utils` — KEINE Tests
- `datetime-utils` — KEINE Tests

---

## Schritt 3: Priorisiere ungetesteten Code

Priorisierung:

1. **Höchste Priorität** — Commands ohne Tests:
   - `get-month.command.ts` (existiert, kein Test)
   - `sync-from-raw.command.ts` (existiert, kein Test)

2. **Hohe Priorität** — Services ohne Tests:
   - `TimesheetService.syncFromRaw()` (existiert, kein Test)
   - `SessionService.isTracking()`, `getActiveTimer()`, `getActiveIssueKey()`, `getActiveTimerRef()`

3. **Mittlere Priorität** — Unvollständig getestete Commands:
   - `StartSessionHandler` — könnte mehr Edge Cases abdecken
   - `ResetSessionHandler` — könnte mehr Edge Cases abdecken

4. **Neue Module** — timetracker:
   - `time-tracker.service` — komplett ohne Tests

---

## Schritt 4: Pro ungetestetem Element prüfen

BEVOR du Tests erstellst, prüfe für jedes Element:

### Für Commands:
1. **Handler-Klasse finden**: `src/domain/<modul>/commands/<name>.command.ts`
2. **Handler-Name erkennen**: Normalerweise `UpperCamelCase + "Handler"` (z.B. `GetMonthHandler`)
3. **Command-Typ finden**: `@devora-code/api/<modul>` — suche nach dem Command-Interface
4. **Constructor prüfen**: Braucht der Handler Dependencies?
5. **execute() Methode**: Was gibt sie zurück?

### Für Services:
1. **Service-Datei finden**: `src/domain/<modul>/service/<service>.service.ts`
2. **Public Methods identifizieren**: Welche Methoden sind öffentlich?
3. **Dependencies prüfen**: Braucht der Service Repository, Logger, Notification?
4. **Error-Pfade erkennen**: Wo werden Errors geworfen?
5. **State-Transaktionen**: Was wird in globalState/FS geschrieben?

---

## Schritt 5: Fixture-Abhängigkeit prüfen

Für jedes Modul das du testest:

1. Existiert `tests/domain/<modul>/fixtures/test.fixture.ts`?
   - **JA**: Verwende sie (`import { test } from "../../fixtures/test.fixture"`)
   - **NEIN**: Erstelle sie erst (siehe fixtures.md)

Für session und timesheet existieren Fixtures. Für timetracker muss eine erstellt werden.

---

## Schritt 6: Ausgabe — was zu testen ist

Erstelle eine Prioritätsliste:

```
## Zu testende Elemente (priorisiert)

### 1. Commands ohne Tests
- [ ] get-month.command.ts → tests/domain/timesheet/tests/commands/get-month.command.spec.ts
- [ ] sync-from-raw.command.ts → tests/domain/timesheet/tests/commands/sync-from-raw.command.spec.ts

### 2. Services ohne Tests
- [ ] TimesheetService.syncFromRaw() → tests/domain/timesheet/tests/domain/timesheet.service-sync.spec.ts
- [ ] SessionService.isTracking/getActiveTimer/getActiveIssueKey/getActiveTimerRef → tests/domain/session/tests/domain/session.service-helpers.spec.ts

### 3. Unvollständig getestete Commands
- [ ] StartSessionHandler — mehr Edge Cases: collision, invalid issueKey, rapid restarts
- [ ] ResetSessionHandler — mehr Edge Cases: hanging timer across months
```

---

## Automatischer Scan-Befehl

Du kannst diesen Befehl nutzen um einen frischen Scan zu machen:

```bash
# Commands ohne Tests finden
comm -23 \
  <(find src/domain -path "*/commands/*.ts" -exec basename {} .ts \; | sort) \
  <(find tests/domain -path "*/commands/*.spec.ts" -exec basename {} .spec.ts \; | sed 's/command//' | sort)
```

Oder einfacher:

```bash
# Alle Commands im Projekt
find src/domain -path "*/commands/*.ts" | while read f; do
  base=$(basename "$f" .ts | sed 's/command$//')
  module=$(echo "$f" | sed 's|src/domain/||' | cut -d/ -f1)
  if ! grep -rq "$base" tests/domain/"$module"/tests/commands/ 2>/dev/null; then
    echo "UNTESTED: $f"
  fi
done
```
