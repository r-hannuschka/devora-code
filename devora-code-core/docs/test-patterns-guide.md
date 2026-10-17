# Integrationstest-Richtlinien für Workpulse

> Dieses Dokument beschreibt alle Muster, Konventionen und Werkzeuge, die für Integrationstests im Workpulse-Projekt verwendet werden. Jeder Agent oder Entwickler, der Tests schreiben will, muss diese Richtlinien strikt befolgen.

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Test-Infrastruktur](#2-test-infrastruktur)
3. [Fixtures & DI-Container](#3-fixtures--di-container)
4. [Mocker & Spies](#4-mocker--spies)
5. [Test-Daten: Factories & Seed-Daten](#5-test-daten-factories--seed-daten)
6. [Test-Datei-Naming und -Struktur](#6-test-datei-naming-und--struktur)
7. [Test-Struktur (Inner-Outer-Assertion)](#7-test-struktur-inner-outer-assertion)
8. [Integrationstest-Szenarien](#8-integrationstest-szenarien)
9. [Typische Fehlerquellen](#9-typische-fehlerquellen)
10. [Checkliste für neue Tests](#10-checkliste-für-neue-tests)

---

## 1. Überblick

Workpulse verwendet **Vitest** mit **tsyringe** (Dependency Injection) und **vitest-mock-extended**. Integrationstests prüfen den **vollständigen Flow** von Command über Handler/Service bis hin zum Repository — mit einem **In-Memory-Dateisystem** als Speicher-Backbone.

### Kernaussagen

| Aspekt | Wert |
|---|---|
| Test Runner | Vitest (`node` environment) |
| DI Container | `tsyringe` (globaler `container`) |
| Mocker Library | `vitest-mock-extended` |
| Speicher | In-Memory-Dateisystem (mockt `workspace.fs`) |
| VS Code API | Vollständiger Mock in `tests/mocks/vscode.ts` |
| Global-Setup | `tests/setup.ts` lädt `reflect-metadata` |

### Wichtigste Philosophie

> Integrationstests prüfen den **End-to-End-Flow** durch alle Schichten eines Moduls — nicht nur die Unit. Sie verwenden **echte Service- und Repository-Instanzen** (nicht gemockt), aber mocken nur die **externe Abhängigkeit** VS Code `workspace.fs`.

---

## 2. Test-Infrastruktur

### 2.1 Vitest Konfiguration

Datei: `vitest.config.ts`

```typescript
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@/core": resolve(import.meta.dirname, "src/core"),
      "@/domain": resolve(import.meta.dirname, "src/domain"),
      "@/modules": resolve(import.meta.dirname, "src/modules"),
      "@/util": resolve(import.meta.dirname, "src/util"),
      "@src": resolve(import.meta.dirname, "src"),         // Interner Zugriff für Tests
      "@/tests/core": resolve(import.meta.dirname, "tests/core"),
      vscode: resolve(import.meta.dirname, "tests/mocks/vscode.ts"), // ← VS Code Mock
    },
    extensions: [".ts", ".js"],
  },
});
```

**Wichtig**: Das `vscode` Modul wird vollständig per Alias gemockt. Jede Testdatei, die `import * as vscode from "vscode"` verwendet, bekommt automatisch den Mock.

### 2.2 Globales Setup

Datei: `tests/setup.ts`

```typescript
import "reflect-metadata";
```

Lädt nur `reflect-metadata` — notwendig für tsyringe Dependency Injection mit Decorators.

### 2.3 TypeScript Config für Tests

Datei: `tests/tsconfig.json`

- Erbt von `../tsconfig.json`
- Enthält eigene `paths`-Mappings (werden beim `extends` nicht geerbt)
- `rootDir: ".."` — Tests können auf `src/` zugreifen
- `@src/*` — Zugriff auf Interna ohne Barrel (nur für Tests)
- `include` umfasst auch `../src/**/*` — Source-Code ist für Tests sichtbar

### 2.4 VS Code Mock

Datei: `tests/mocks/vscode.ts`

Bereitgestellt werden:

| Export | Beschreibung |
|---|---|
| `FileType` | Konstanten: `Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64` |
| `Uri` | `joinPath(base, ...parts)` und `parse(str)` erstellen Mock-URIs |
| `workspace.fs` | `readFile`, `writeFile`, `readDirectory`, `createDirectory`, `stat` — alle `vi.fn().mockResolvedValue(...)` |
| `workspace.openTextDocument` | Liefert ein Fake-Dokument mit `.getText()` |
| `workspace.workspaceFolders` | Array mit einem Mock-Workspace-Folder |
| `window.showTextDocument` | Fake-Implementierung mit `.edit()` |
| `window.showErrorMessage` / `showInformationMessage` | Stubs |

**Wichtig**: Dieser Mock ist die **Basis-Ebene**. Für Tests mit echtem Datenfluss wird `installInMemoryFs()` verwendet, das diese Methoden überschreibt.

---

## 3. Fixtures & DI-Container

### 3.1 Basis-Fixture (jede Testdatei erweitert diese)

Datei: `tests/core/fixture/test.ts`

```typescript
interface MyFixtures {
  diContainer: typeof container;
  vscodeContext: ExtensionContext;
  timesheetRepo: TimesheetRepository;
  fs: InMemoryFs;
}

export const test = base.extend<MyFixtures>({
  diContainer: async ({}, use) => {
    container.clearInstances();
    await use(container);
  },

  fs: [async ({}, use) => {
    await use(installInMemoryFs("/storage/booking-data"));
  }, { auto: true }],                          // ← wird automatisch bereitgestellt

  vscodeContext: [async ({ diContainer }, use) => {
    const mockCtx = createExtensionContextMock();
    diContainer.registerInstance(EXTENSION_CONTEXT_TOKEN, mockCtx);
    await use(mockCtx as unknown as ExtensionContext);
  }, { auto: true }],                          // ← wird automatisch bereitgestellt

  timesheetRepo: async ({ diContainer, vscodeContext, fs }, use) => {
    const repo = new TimesheetRepository(vscodeContext);
    diContainer.registerInstance(TimesheetRepository, repo);
    await use(repo);
  },
});

export { expect } from "vitest";
```

**Erklärungen zu den Fixtures:**

- `diContainer`: Wird vor jedem Test **gecleart** (`container.clearInstances()`), um Isolation zu gewährleisten.
- `fs`: **In-Memory-Dateisystem** — wird automatisch für jede Testdatei bereitgestellt (`auto: true`). Path ist `/storage/booking-data`.
- `vscodeContext`: Mockt `ExtensionContext` mit `globalState` (Map-basiert) und `globalStorageUri`. Wird automatisch bereitgestellt.
- `timesheetRepo`: Echte `TimesheetRepository`-Instanz — **nicht gemockt!**

### 3.2 Modulspezifische Fixtures

Jedes Modul kann eigene Fixtures erstellen, die die Basis-Fixture erweitern:

```typescript
// tests/modules/<modul>/fixtures/test.fixture.ts
import { test as base } from "@/tests/core/fixture";

interface MyFixtures {
  meinService: MeinService;
  meinRepository: MeinRepository;
}

export const test = base.extend<MyFixtures>({
  meinService: [async ({ vscodeContext, fs }, use) => {
    container.clearInstances();
    const repo = new MeinRepository(vscodeContext);
    const service = new MeinService(repo, vscodeContext);
    container.registerInstance(MeinService, service);
    await use(service);
  }, { auto: true }],

  meinRepository: async ({ vscodeContext }, use) => {
    const repository = new MeinRepository(vscodeContext);
    await use(repository);
  },
});

export { expect } from "vitest";
```

**Wichtig**: Die Service-Fixture verwendet `{ auto: true }`, damit der Service automatisch injiziert wird. Das Repository wird **nicht** als `auto` markiert — es wird nur explizit angefragt, wenn benötigt.

### 3.3 Fixture-Hierarchie

```
tests/core/fixture/test.ts (Basis)
         │
         ├── tests/modules/session/fixtures/test.fixture.ts
         │         │
         │         └── tests/modules/session/tests/commands/*.spec.ts
         │         └── tests/modules/session/tests/domain/*.spec.ts
         │
         └── tests/modules/timesheet/fixtures/test.fixture.ts
                   │
                   └── tests/modules/timesheet/tests/commands/*.spec.ts
                   └── tests/modules/timesheet/tests/domain/*.spec.ts
```

---

## 4. Mocker & Spies

### 4.1 Zeit mocken (Fake Timers)

```typescript
import { vi } from "vitest";

test("sollte Timer starten", async () => {
  const startAt = "2026-10-14T09:00:00";

  // 1. Fake Timer aktivieren
  vi.useFakeTimers();
  vi.setSystemTime(new Date(startAt));

  // 2. Test-Code ausführen
  const result = await service.start(issueKey);

  // 3. Assertions ...

  // 4. Fake Timer deaktivieren — IMMER!
  vi.useRealTimers();
});
```

**Wichtig**: `vi.useRealTimers()` muss **immer** aufgerufen werden, andernsten beeinflussen folgende Tests das Zeitverhalten.

### 4.2 Repository-Methods mocken

```typescript
vi.spyOn(timesheetRepository, "write").mockImplementation(async () => []);
await expect(service.start("PROJ-42")).rejects.toThrow("Fehlermeldung");
```

**Wann**: Nur wenn ein **bestimmter Fehlerpfad** getestet werden soll (z.B. "Repository schreibt nichts zurück").

**Regel**: Standardmäßig werden **keine Repository-Methoden gemockt** — das echte Repository auf dem In-Memory-Dateisystem wird verwendet.

### 4.3 VS Code workspace.fs spies

Manchmal muss der Standard-Mock überschrieben werden (z.B. um geschrieben Buffer zu captures):

```typescript
import * as vscode from "vscode";

let capturedBuffer = Buffer.from([]);
const writeSpy = vi
  .spyOn(vscode.workspace.fs, "writeFile")
  .mockImplementation(async (_, buf) => { capturedBuffer = Buffer.from(buf); });

// ... Test-Code ...

expect(writeSpy).toHaveBeenCalledTimes(1);
const written = JSON.parse(capturedBuffer.toString());
// ... Assertions ...
```

### 4.4 Cleanup

```typescript
import { afterEach } from "vitest";

test("...", async () => {
  // ...
});

afterEach(() => vi.restoreAllMocks()); // ← spies cleanuppen
```

---

## 5. Test-Daten: Factories & Seed-Daten

### 5.1 TimeEntry Factory

Datei: `tests/core/util/_time-entry.factory.ts`

```typescript
let counter = 0;

export function buildTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntryDTO {
  counter++;
  return {
    id: `entry-${counter}`,
    issueKey: "TEST-1",
    startAt: "2026-10-11T09:00:00",
    endAt: "2026-10-11T10:00:00",
    ...overrides,
  };
}
```

**Konvention**: Der Dateiname beginnt mit **Unterstrich `_`** — das signalisiert "internes Utility". Exportiert wird über `index.ts`.

**Verwendung**:

```typescript
const entry = buildTimeEntry();                                    // Default
const entry = buildTimeEntry({ issueKey: "PROJ-42", endAt: null }); // Custom
```

### 5.2 In-Memory Filesystem

Datei: `tests/core/util/in-memory-fs.ts`

Stellt `workspace.fs` komplett auf ein `Map<string, string>` um. Bietet:

```typescript
// Seed: Monat mit Daten vorbereiten
fs.seedMonth("2026-10", {
  "2026-10-14": [
    { id: "1", issueKey: "PROJ-10", startAt: "...", endAt: "..." },
  ],
});

// Lesen: Monat als JSON-Objekt
const monthData = fs.readMonth("2026-10");
// → { "2026-10-14": [ {...}, {...} ] }

// Dateien auflisten
const months = fs.listMonths();
// → ["2026-10.json", "2026-11.json"]

// Storage-Dir prüfen
fs.storageDirExists();

// Roh-Zugriff
fs.files.get("/storage/booking-data/2026-10.json");
fs.dirs.has("/storage");
```

**Struktur**: Monatsdaten werden als `<jahr>-<monat>.json` im Storage-Verzeichnis gespeichert:

```
/storage/booking-data/2026-10.json
/storage/booking-data/2026-11.json
```

Inhalt ist ein JSON-Objekt mit Tages-Schlüsseln:

```json
{
  "2026-10-14": [
    { "id": "1", "issueKey": "PROJ-10", "startAt": "2026-10-14T09:00:00", "endAt": "2026-10-14T10:00:00" }
  ]
}
```

### 5.3 ExtensionContext Mock

Datei: `tests/core/mock/extension-context.mock.ts`

```typescript
export function createExtensionContextMock({
  globalStoragePath = "/storage"
} = {}): ExtensionContext {
  const state = new Map<string, unknown>();

  return {
    globalStorageUri: { path: globalStoragePath, fsPath: globalStoragePath },
    globalState: {
      get: <T>(key: string, defaultValue?: T) =>
        state.has(key) ? state.get(key) as T : defaultValue,
      update: async (key: string, value: unknown) => {
        if (value === undefined) { state.delete(key); }
        else { state.set(key, value); }
      },
    },
  };
}
```

**Verwendung**:

```typescript
// Aktiven Timer setzen
await vscodeContext.globalState.update("activeTimeEntry", entry);

// Aktiven Timer lesen
const activeEntry = vscodeContext.globalState.get("activeTimeEntry");

// Aktiven Timer löschen
await vscodeContext.globalState.update("activeTimeEntry", undefined);
```

---

## 6. Test-Datei-Naming und -Struktur

### 6.1 Verzeichnisstruktur pro Modul

```
tests/modules/<modul>/
├── fixtures/
│   └── test.fixture.ts          # Modulspezifische Fixture (erweitert base)
└── tests/
    ├── commands/                # Command-Handler Tests
    │   ├── <command>.spec.ts
    │   └── <command>.spec.ts
    └── domain/                  # Service-Methoden Tests
        ├── <service>.spec.ts
        └── <service>.spec.ts
```

### 6.2 Naming-Konventionen

| Element | Muster | Beispiel |
|---|---|---|
| Test-Datei | `<target>.spec.ts` | `add-entry.command.spec.ts` |
| Fixture-Datei | `test.fixture.ts` | `test.fixture.ts` |
| Factory-Datei | `_name.factory.ts` | `_time-entry.factory.ts` |
| Mock-Datei | `<name>.mock.ts` | `extension-context.mock.ts` |
| Test-Helper | `test.ts` | `test.ts` (wird re-exportiert) |

### 6.3 Import-Pfade

```typescript
// Fixtures importieren
import { test } from "@/tests/core/fixture";              // Basis
import { test } from "../../fixtures/test.fixture";       // Modulspezifisch
import { test } from "@/tests/core/fixture";              // Auch relative Pfade möglich

// Commands/Services importieren
import { GetActiveTimerHandler } from "@/modules/session";
import { AddEntryHandler } from "@/modules/timesheet";
import { SessionService } from "@src/modules/session/domain/session.service";

// Test-Hilfsmittel
import { buildTimeEntry } from "@/tests/core/util";
import { test } from "@/tests/core/fixture";

// Typen von API/SDK
import type { TimeEntryDTO } from "@/core/infrastructure";
import type { StartSessionCommand } from "@devora-code/api/session";
import type { TimesheetAddEntryCommand } from "@devora-code/api/timesheet";
```

### 6.4 Test-Namespace (Describe-Block)

Der `describe`-Block nennt den **Handler- oder Service-Namen**:

```typescript
describe("AddEntryHandler", () => { ... });
describe("SessionService.start", () => { ... });
describe("GetActiveTimerHandler", () => { ... });
```

---

## 7. Test-Struktur (Inner-Outer-Assertion)

### 7.1 Goldenes Muster

Jeder Test folgt diesem Schema:

```typescript
test("sollte <erwartetes-verhalten> wenn <szenario>", async ({ fixture1, fixture2 }) => {
  // 1. SEED: Test-Daten vorbereiten (In-Memory-FS, globalState)
  fs.seedMonth("2026-10", { "2026-10-14": [entry] });
  await vscodeContext.globalState.update("activeTimeEntry", entry);

  // 2. ACT: Handler/Service aufrufen
  const handler = new MyHandler(command);
  const result = await handler.execute();

  // 3. ASSERT: Ergebnisse prüfen
  expect(result.issueKey).toBe("PROJ-42");
  expect(fs.readMonth("2026-10")).toMatchObject({ ... });
  expect(vscodeContext.globalState.get("activeTimeEntry")).toBeNull();
});
```

### 7.2 Fixture-Injektion

Die Tests nutzen **Vitest Fixtures** über den Parameter des Test-Calls:

```typescript
// Nur FS
async ({ fs }) => { ... }

// FS + VS Code Context
async ({ vscodeContext, fs }) => { ... }

// Service + FS + VS Code Context
async ({ sessionService, fs, vscodeContext }) => { ... }
```

### 7.3 Assertion-Patterns

| Pattern | Verwendung |
|---|---|
| `expect(result).toBe(value)` | Primitive, Referenzgleichheit |
| `expect(result).toEqual(object)` | Tiefe Objektgleichheit |
| `expect(result).toMatchObject({...})` | Teilweise Objektübereinstimmung |
| `expect(obj).toHaveProperty("key")` | Property-Existenz |
| `expect(obj).not.toHaveProperty("key")` | Property-Abwesenheit |
| `expect(result).rejects.toThrow("msg")` | Fehlerhafte Ausführung |
| `expect(result).toHaveLength(n)` | Array-Länge |
| `expect(obj.id).toBeDefined()` | Nicht undefined/null |
| `expect(value).toBeNull()` | Explizit null |
| `expect(value).toBeUndefined()` | Explizit undefined |
| `expect(value).toBeGreaterThan(n)` | Grössenvergleich |

---

## 8. Integrationstest-Szenarien

### 8.1 Command Handler Tests

**Zweck**: Testen den **kompletten Command-Flow** von Command-Objekt bis zum Seiteneffekt (Repository schreiben, globalState aktualisieren).

**Muster**:

```typescript
import { MyHandler } from "@/modules/<modul>";
import { test } from "@/tests/core/fixture";
import type { MyCommand } from "@devora-code/api/<modul>";
import { describe, expect } from "vitest";

describe("MyHandler", () => {
  test("sollte <ergebnis> bei <einge>", async ({ fs }) => {
    // Seed
    fs.seedMonth("2026-10", { ... });

    // Command
    const command: MyCommand = {
      id: "test-1",
      type: "module:action",
      payload: { ... },
    };

    // Execute
    const result = await new MyHandler(command).execute();

    // Assert
    expect(result).toMatchObject({ ... });
    expect(fs.readMonth("2026-10")).toMatchObject({ ... });
  });
});
```

**Wann**: Wenn der **Command-Typ** der Testschwerpunkt ist (z.B. `add-entry`, `get-period`, `open`).

### 8.2 Service Method Tests

**Zweck**: Testen die **Business-Logik** im Service — Transformation, Berechnung, Datenaggregation.

**Muster**:

```typescript
import { test } from "../../fixtures/test.fixture";   // Modulspezifisch
import { describe, expect } from "vitest";

describe("SessionService.start", () => {
  test("sollte <ergebnis> bei <einge>", async ({ sessionService, fs, vscodeContext }) => {
    // Seed
    fs.seedMonth("2026-10", { ... });

    // Execute
    const result = await sessionService.start("PROJ-42");

    // Assert
    expect(result.issueKey).toBe("PROJ-42");
    expect(result.endAt).toBeNull();
  });
});
```

**Wann**: Wenn die **Service-Method** der Testschwerpunkt ist (z.B. `getDay`, `getPeriod`, `getByIssueKey`, `addEntry`).

### 8.3 Shared State Tests

Viele Tests prüfen **Zustände über mehrere Quellen**:

```typescript
// 1. Repository (In-Memory-Dateisystem)
expect(fs.readMonth("2026-10")).toMatchObject({ ... });

// 2. VS Code globalState
expect(vscodeContext.globalState.get("activeTimeEntry")).toBeDefined();

// 3. Command/Service Return Value
expect(result.issueKey).toBe("PROJ-42");
```

### 8.4 Error Handling Tests

```typescript
test("sollte Error werfen wenn <fehlerbedingung>", async () => {
  const handler = new MyHandler(command);
  await expect(handler.execute()).rejects.toThrow("Erwartete Fehlermeldung");
});
```

Oder mit Repository-Spy:

```typescript
vi.spyOn(repository, "write").mockImplementation(async () => []);
await expect(service.start("PROJ-42")).rejects.toThrow("Der Eintrag konnte nicht erstellt werden.");
```

### 8.5 Edge Case Kategorien

Die Tests abdecken folgende Edge Case-Kategorien:

| Kategorie | Beispiel |
|---|---|
| **Nichts-Op** | Kein Timer aktiv → `resetSession()` kehrt sanft zurück |
| **Mitternacht** | Eintrag über Tagesgrenze → wird aufgeteilt |
| **Leer** | Kein Eintrag, leerer Zeitraum → leere Liste/Objekt |
| **Kollision** | Geschlossener Eintrag überlappt → Error werfen |
| **Split** | Neuer Eintrag in laufenden Timer → Timer wird unterbrochen |
| **Cross-Month** | Eintrag über Monatsgrenze → zwei Monatsdateien |
| **Kein Fund** | IssueKey existiert nicht → leeres Ergebnis |
| **Priorität** | BLOCK schlägt vor SPLIT → Error statt Split |

---

## 9. Typische Fehlerquellen

### 9.1 Fake Timers vergessen cleanuppten

```typescript
// ❌ FALSCH — verlässt Timer im modifizierten Zustand
vi.useFakeTimers();
vi.setSystemTime(new Date(startAt));
// ... Test-Code ...
// fehlt: vi.useRealTimers();

// ✅ RICHTIG
vi.useFakeTimers();
vi.setSystemTime(new Date(startAt));
// ... Test-Code ...
vi.useRealTimers();
```

### 9.2 Seed-Daten veraltet nach Operations

Operationen schreiben auf den In-Memory-FS, daher muss nach jeder Operation **neu gelesen** werden:

```typescript
// ❌ FALSCH — month1 wird nicht aktualisiert
const month1 = fs.readMonth("2026-10");
await service.start("PROJ-42");
expect(month1).toMatchObject({ ... });  // month1 zeigt immer noch den alten Stand!

// ✅ RICHTIG
const month1 = fs.readMonth("2026-10");
await service.start("PROJ-42");
const month2 = fs.readMonth("2026-10"); // Neu lesen!
expect(month2).toMatchObject({ ... });
```

### 9.3 Container nicht cleart

```typescript
// ❌ FALSCH — alte Instanzen bleiben im Container
const service = new SessionService(repo, ctx);
container.registerInstance(SessionService, service);
await use(service);
// Nächster Test kriegt alte SessionService-Instanz!

// ✅ RICHTIG
container.clearInstances();  // ← IMMER vor dem Erstellen neuer Instanzen
```

### 9.4 Fixture-Hierarchie falsch

```typescript
// ❌ FALSCH — Basis-Fixture nicht erweitert
import { test as base } from "vitest";  // ❌ Nicht vitest base!

// ✅ RICHTIG
import { test as base } from "@/tests/core/fixture";  // ← Basis-Fixture erweitern
```

### 9.5 Import-Pfade falsch

```typescript
// ❌ FALSCH — relative Pfade, die nicht existieren
import { test } from "../fixtures/test.fixture";  // Kann brechen je nach Test-Position

// ✅ RICHTIG — absolute Pfade aus den Path-Mappings
import { test } from "@/tests/core/fixture";          // Basis
import { test } from "../../fixtures/test.fixture";   // Modulspezifisch (relative zu Test-Datei)
```

### 9.6 Nicht zwischen Command und Service Tests unterscheiden

| Test-Typ | Fixture | Aufruf |
|---|---|---|
| Command Handler | Basis-Fixture (`@/tests/core/fixture`) | `new Handler(command).execute()` |
| Service Method | Modulspezifische Fixture | `service.method(args)` |

### 9.7 `expect` falsch importiert

```typescript
// ❌ FALSCH
import { expect } from "vitest";  // In Fixture-Dateien: re-export aus Fixture

// ✅ RICHTIG
import { test } from "@/tests/core/fixture";
// test erwartet, dass `expect` im Scope ist — wird von der Fixture exportiert:
export { expect } from "vitest";
```

Tatsächlich verwenden alle Tests `import { describe, expect } from "vitest"` direkt oder über die Fixture.

### 9.8 VS Code workspace.fs ohne installInMemoryFs

```typescript
// ❌ FALSCH — workspace.fs hat Standard-Mock (leere Arrays)
// Der Test schreibt nichts auf den FS

// ✅ RICHTIG — installInMemoryFs wird automatisch von der Fixture bereitgestellt
async ({ fs }) => {
  fs.seedMonth("2026-10", { ... });  // Echte Daten im FS
  // ... Test-Code ...
}
```

---

## 10. Checkliste für neue Tests

Bevor du einen neuen Integrationstest schreibst, gehe diese Liste durch:

### Vor dem Schreiben

- [ ] **Welche Schicht testest du?** Command Handler → Basis-Fixture. Service Method → Modulspezifische Fixture.
- [ ] **Brauche ich eine modulspezifische Fixture?** Wenn du `SessionService` oder `TimesheetService` testen willst, erstelle/verwende die Fixture in `tests/modules/<modul>/fixtures/test.fixture.ts`.
- [ ] **Welche Fixtures brauche ich?** `fs` für FS-Zugriff, `vscodeContext` für globalState, `service` für Business-Logik, `repository` für Repository-Methoden.
- [ ] **Welches Seed-Daten brauche ich?** Erstelle die Datenstruktur, die die Business-Logik erwartet (Monatsdateien, globalState-Einträge).

### Beim Schreiben

- [ ] **Test-Beschreibung**: `"sollte <erwartetes-ergebnis> wenn <szenario>"` — im Präsens, klar und eindeutig.
- [ ] **Seed-Daten vorbereiten**: `fs.seedMonth()` und/oder `vscodeContext.globalState.update()`.
- [ ] **System-Zeit setzen** (falls benötigt): `vi.useFakeTimers()` → `vi.setSystemTime()` → `vi.useRealTimers()`.
- [ ] **Handler/Service aufrufen**: `new Handler(command).execute()` oder `service.method(args)`.
- [ ] **Assertions**: Prüfe **alle** Auswirkungen — Return Value, FS, globalState.
- [ ] **Cleanup**: `afterEach(() => vi.restoreAllMocks())` falls du `spyOn` verwendest.

### Nach dem Schreiben

- [ ] **Dateiname**: `<target>.spec.ts` in der richtigen Verzeichnisstruktur.
- [ ] **Import-Pfade**: Absolute Pfade aus den Path-Mappings verwenden.
- [ ] **Fake Timers cleanuppten?** `vi.useRealTimers()` am Ende jedes Tests.
- [ ] **Container cleart?** Modulspezifische Fixtures rufen `container.clearInstances()` auf.
- [ ] **Test läuft?** `npm test` — alle Tests müssen grün sein.
- [ ] **Namen konsistent?** `describe` = Handler/Service-Name, `test` = Verhalten in Worten.

---

## A. Referenz: Alle existierenden Test-Dateien

| Datei | Beschrieb |
|---|---|
| `tests/modules/session/tests/commands/get-active.command.spec.ts` | `GetActiveTimerHandler` — aktiven Timer lesen/ignorieren |
| `tests/modules/session/tests/commands/reset.command.spec.ts` | `ResetSessionHandler` — Timer stoppen + globalState leeren |
| `tests/modules/session/tests/commands/start.command.spec.ts` | `StartSessionHandler` — Timer starten, Sessions überschreiben |
| `tests/modules/session/tests/commands/stop.command.spec.ts` | `StopSessionHandler` — Timer stoppen |
| `tests/modules/session/tests/domain/session.service.resetSession.spec.ts` | `SessionService.resetSession()` — Reset-Flow |
| `tests/modules/session/tests/domain/session.service.start.spec.ts` | `SessionService.start()` — Start-Flow + Error-Handling |
| `tests/modules/session/tests/domain/session.service.stopTracking.spec.ts` | `SessionService.stopTracking()` — Stop-Flow |
| `tests/modules/timesheet/tests/commands/add-entry.command.spec.ts` | `AddEntryHandler` — NONE/BLOCK/SPLIT, Mitternacht |
| `tests/modules/timesheet/tests/commands/get-period.command.spec.ts` | `GetPeriodHandler` — Einträge filtern + zählen |
| `tests/modules/timesheet/tests/commands/open-timesheet.command.spec.ts` | `TimesheetOpenHandler` — JSON generieren + öffnen |
| `tests/modules/timesheet/tests/domain/timesheet.service.spec.ts` | `TimesheetService` — addEntry, getDay, getPeriod, getByIssueKey, getMonth, getRaw, splitActiveTimer |
| `tests/modules/timesheet/tests/domain/timesheet.service-split.spec.ts` | `AddEntryHandler` mit Session-Split-Detailtests |

## B. Referenz: Alle Fixtures & Utilities

| Datei | Export | Verwendung |
|---|---|---|
| `tests/core/fixture/test.ts` | `test`, `expect` | Basis-Fixture (DI, FS, VS Code Context) |
| `tests/core/mock/extension-context.mock.ts` | `createExtensionContextMock()` | ExtensionContext mit Map-basiertem globalState |
| `tests/core/util/_time-entry.factory.ts` | `buildTimeEntry()` | Erzeugt gültige TimeEntry mit Default-Werten |
| `tests/core/util/in-memory-fs.ts` | `installInMemoryFs()`, `InMemoryFs` | VS Code workspace.fs auf Map umleiten |
| `tests/modules/session/fixtures/test.fixture.ts` | `test`, `expect` | SessionService + TimesheetRepository Fixtures |
| `tests/modules/timesheet/fixtures/test.fixture.ts` | `test`, `expect` | TimesheetService + TimesheetRepository Fixtures |

## C. Referenz: In-Memory-Dateisystem API

```typescript
// Seed: Monat mit Daten füllen
fs.seedMonth(<monat>, <daten-objekt>);

// Lese-API
fs.readMonth(<monat>)       // → Record<string, TimeEntry[]> | undefined
fs.listMonths()             // → string[] (sortiert, z.B. ["2026-10.json"])
fs.storageDirExists()       // → boolean
fs.files                    // → Map<string, string> (Rohzugriff)
fs.dirs                     // → Set<string> (Rohzugriff)

// Daten-Format für seedMonth
{
  "<tag>": [
    { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }
  ]
}
```

## D. Referenz: Command-Typen

```typescript
// Session Commands
type StartSessionCommand = {
  id: string;
  type: "session:start";
  payload: { issueKey: string };
};

// Timesheet Commands
type TimesheetAddEntryCommand = {
  id: string;
  type: "timesheet:add-entry";
  payload: { issueKey: string; startAt: string; endAt: string };
};

type GetPeriodCommand = {
  id: string;
  type: "timesheet:get-period";
  payload: { startDate: string; endDate?: string };
};

type TimesheetOpenCommand = {
  id: string;
  type: "timesheet:open";
  payload: { startAt: string; endAt: string };
};
```

## E. Validierung meiner Erkenntnis

Ich habe folgende Quellen analysiert:

1. **`tests/setup.ts`** — Globales Setup (`reflect-metadata`)
2. **`vitest.config.ts`** — Vitest-Konfiguration mit Path-Aliases
3. **`tests/tsconfig.json`** — TypeScript-Pfade für Tests
4. **`tests/mocks/vscode.ts`** — Vollständiger VS Code Mock
5. **`tests/core/fixture/test.ts`** — Basis-Fixture mit DI, FS, VS Code Context
6. **`tests/core/mock/extension-context.mock.ts`** — ExtensionContext Mock
7. **`tests/core/util/_time-entry.factory.ts`** — TimeEntry Factory
8. **`tests/core/util/in-memory-fs.ts`** — In-Memory Filesystem
9. **`tests/modules/session/fixtures/test.fixture.ts`** — Session-Fixture
10. **`tests/modules/timesheet/fixtures/test.fixture.ts`** — Timesheet-Fixture
11. **12 Test-Dateien** — Alle `.spec.ts` Dateien im vollständigen Detail

**Validierung**: Jedes Muster im Dokument wird durch mindestens eine reale Test-Datei gestützt. Konventionen wie `afterEach cleanup`, `vi.useRealTimers()`, `container.clearInstances()`, `seedMonth`-Usage, und Import-Pfade wurden aus den echten Dateien extrahiert und korrekt reproduziert.
