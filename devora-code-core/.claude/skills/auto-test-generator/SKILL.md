---
name: auto-test-generator
description: >-
  This skill should be used when the user asks to "generate tests for untested code",
  "write integration tests", "create test files", "run the test generator", or discusses
  writing tests in the Workpulse (devora-code-core) codebase. It automatically discovers
  Command Handlers and Service Methods that lack integration tests, then generates complete,
  passing test files following the project's exact patterns. Use when the user says "write
  tests for X", "test coverage", "missing tests", or "/generate-tests".
version: 1.0.0
---

# auto-test-generator — Integrationstest-Generator für Workpulse (devora-code-core)

Dieser Skill findet **Command Handler** und **Service Methods**, für die noch keine
Integrationstests existieren, und erstellt vollständige, laufende Test-Dateien.

Der Skill folgt strikt den existierenden Test-Patterns des Projekts. Er generiert nie
Code, der von diesen Mustern abweicht.

---

## Verzeichnisstruktur des Skills

```
.claude/skills/auto-test-generator/
├── SKILL.md                      # Diese Datei — Orchestrator
├── patterns.md                   # Vollständige Test-Patterns (Fixture, FS, Mocker)
├── fixtures.md                   # Fixture-Erstellung pro Modul
├── edge-cases.md                 # Edge-Case-Katalog mit Codesnippets
└── scan.md                       # Scan-Workflow: ungetesteten Code finden
```

---

## Workflow

### Schritt 1: Ungetesteten Code scannen

Führe `@${CLAUDE_SKILL_DIR}/scan.md` aus, um zu finden:
1. Welche Command Handler keine Tests haben
2. Welche Service Methods keine Tests haben
3. Welche Module überhaupt existieren und Testsupport brauchen

Dieser Schritt ist automatisch — du scannst die Codebasis und identifizierst Lücken.

### Schritt 2: Test-Patterns laden

Lade `@${CLAUDE_SKILL_DIR}/patterns.md`. Diese Datei enthält das komplette Wissen über:
- Fixtures (Basis + modulspezifisch)
- In-Memory-Dateisystem
- VS Code Mock
- Fake Timers, Spies, Cleanup
- Import-Pfade, Naming-Konventionen, Assertion-Patterns

**Du musst diese Datei bei JEDER Test-Erstellung lesen.** Sie ist die autoritative Quelle.

### Schritt 3: Fixtures erstellen (falls nötig)

Wenn das Modul noch keine modulspezifische Fixture hat:
- Erstelle `tests/domain/<modul>/fixtures/test.fixture.ts`
- Sie erweitert `@/support`
- Definiere Service- und Repository-Fixtures
- Siehe `@${CLAUDE_SKILL_DIR}/fixtures.md` für Templates

### Schritt 4: Edge Cases identifizieren

Lade `@${CLAUDE_SKILL_DIR}/edge-cases.md`. Für jeden Command/Service:
- Welche Edge Cases sind relevant? (Mitternacht, Kollision, Split, Leer, Nothing-Op)
- Welche Error-Pfade existieren?
- Welche State-Transaktionen müssen geprüft werden?

### Schritt 5: Test-Datei erstellen

Erstelle die Test-Datei im korrekten Verzeichnis:

```
tests/domain/<modul>/tests/commands/<command>.spec.ts     # Command Handler
tests/domain/<modul>/tests/domain/<service>.spec.ts        # Service Methods
```

Die Datei MUSS enthalten:
1. Imports nach den Konventionen (siehe `patterns.md`)
2. `describe`-Block mit Handler/Service-Name
3. `test`-Blöcke mit der Beschreibung `"sollte <erwartet> wenn <szenario>"`
4. Seed-Daten via `fs.seedMonth()` und/oder `vscodeContext.globalState.update()`
5. Handler/Service-Aufruf
6. Assertions auf Return Value, FS, globalState

### Schritt 6: Existierende Tests validieren

BEVOR du die Datei schreibst:
1. Prüfe `tests/domain/<modul>/tests/` ob eine同名 Datei existiert
2. Wenn JA: Füge neue Tests am ENDE des existierenden describe-Blocks hinzu
3. Wenn NEIN: Erstelle neue Datei

### Schritt 7: Test-Datei schreiben

Schreibe die Datei mit `Write`. Das Format ist strikt:
- Keine Leerzeilen am Anfang
- 2-Space Einrückung
- Deutsche Test-Beschreibungen
- Korrekte Import-Pfade

### Schritt 8: Tests ausführen

Führe `npm test` oder `npm run test` im Projekt-Root aus.
Wenn Tests fehlschlagen:
1. Lese die Fehlermeldung
2. Korrigiere den generierten Code
3. Wiederhole bis alle Tests grün sind

---

## Wichtige Regeln

1. **IMMER `patterns.md` lesen** bevor du Tests generierst
2. **IMMER `fs.seedMonth()` verwenden** — niemals rohe FS-Operationen
3. **IMMER `vi.useRealTimers()` am Ende** eines Tests mit Fake Timers
4. **IMMER `afterEach(() => vi.restoreAllMocks())`** wenn du `spyOn` verwendest
5. **IMMER `container.clearInstances()`** in Fixture-Definitionen
6. **Keine `vi.restoreAllMocks()` am Ende jedes Tests** — nur in `afterEach` am Datei-Ende
7. **Service-Fixtures verwenden `{ auto: true }`** — Repository-Fixtures nicht
8. **Import-Pfade immer absolut** aus den Path-Mappings (`@/domain/`, `@/support/`, `@src/`)
9. **Test-Beschreibungen auf Deutsch** im Imperativ: "sollte X wenn Y"
10. **Keine Unit-Tests** — der Skill erstellt NUR Integrationstests (Command Handler + Service Methods)

---

## Test-Kategorien

Der Skill generiert Tests für folgende Kategorien (in dieser Priorität):

### Priorität 1: Grundfunktionalität
- Command Handler: positive Pfade — "funktioniert es mit korrekten Inputs?"
- Service Methods: positive Pfade — "liefert es das richtige Ergebnis?"

### Priorität 2: Nothing-Op / Leer-Szenarien
- Kein State vorhanden → sanftes Verhalten
- Leere Collections → leeres Ergebnis
- Undefined → null

### Priorität 3: Error-Handling
- Fehlerhafte Inputs → korrekte Error Messages
- Repository-Fehler → propagierte Exceptions
- Validation-Errors → spezifische Error-Patterns

### Priorität 4: Edge Cases (projektspezifisch)
Siehe `edge-cases.md` für den vollständigen Katalog:
- Mitternacht/Cross-Day
- Cross-Month
- Kollision (BLOCK)
- Session Split (SPLIT)
- Priorität (BLOCK vor SPLIT)
- Mehrere Sessions hintereinander
- Aktiver Timer über mehrere Tage

### Priorität 5: Shared State
- FS + globalState konsistent nach Operation
- DI Container nach Test sauber

---

## Fehlerbehandlung beim Generieren

| Fehler | Aktion |
|---|---|
| Test-Datei existiert bereits | Neue Tests am Ende der existierenden Datei hinzufügen |
| Module-Fixture existiert nicht | Erstelle sie nach Template in `fixtures.md` |
| Command-Typ nicht gefunden | Prüfe `@devora-code/api/<modul>` für die korrekte Typ-Definition |
| Service-Methode existiert nicht | Prüfe den Service in `@src/domain/<modul>/service/<service>.ts` |
| Path-Alias funktioniert nicht | Prüfe `tests/tsconfig.json` und `vitest.config.ts` für korrekte Pfade |
| Tests laufen nicht | Lies die Fehlermeldung, korrigiere, wiederhole |

---

## Referenz: Test-File-Templates

Siehe die konkreten Templates in den begleitenden Dateien:
- **patterns.md** — Vollständiges Fixture, In-Memory-FS, Mocking
- **fixtures.md** — Fixture-Vorlagen pro Modul-Typ
- **edge-cases.md** — Edge-Case Codesnippets mit Erklärungen

---

## Validierung

Dieser Skill basiert auf der Analyse von **12 existierenden Integrationstest-Dateien**,
**4 Fixture-Dateien**, **3 Utility-Dateien**, **vitest.config.ts**, und **tests/tsconfig.json**.

Jede Konvention, jeder Import-Pfad, jede Assertion und jedes Seed-Muster wurde aus
realen Test-Dateien extrahiert und ist hier dokumentiert.

Der Skill generiert KEINen Code, der nicht mindestens eine reale Entsprechung hat.
