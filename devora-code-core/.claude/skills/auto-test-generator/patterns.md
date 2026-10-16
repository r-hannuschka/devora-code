# Test-Patterns — autoritative Quelle für Integrationstests

> Diese Datei MUSS vor JEDER Test-Erstellung gelesen werden.
> Alle Patterns wurden aus den existierenden 12 Test-Dateien extrahiert.

---

## 1. Vitest Konfiguration

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
      "@/util": resolve(import.meta.dirname, "src/util"),
      "@src": resolve(import.meta.dirname, "src"),         // Interner Zugriff für Tests
      "@/support": resolve(import.meta.dirname, "tests/support"),
      vscode: resolve(import.meta.dirname, "tests/support/mocks/vscode.ts"),
    },
    extensions: [".ts", ".js"],
  },
});
```

**Wichtig**: `vscode` wird vollständig per Alias gemockt. `import * as vscode from "vscode"` → immer der Mock.

---

## 2. Globales Setup

Datei: `tests/setup.ts`

```typescript
import "reflect-metadata";
```

Nötig für tsyringe Decorator-basierte DI.

---

## 3. VS Code Mock

Datei: `tests/support/mocks/vscode.ts`

```typescript
import { vi } from "vitest";

export const FileType = { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 } as const;

const createMockUri = (fullPath: string) => ({
  scheme: "file", authority: "", path: fullPath,
  query: "", fragment: "", fsPath: fullPath,
  with: () => { throw new Error("Not implemented"); },
  toJSON: () => {}, toString: () => `file://${fullPath}`
});

export const Uri = {
  joinPath: (base: { path: string }, ...parts: string[]) =>
    createMockUri([base.path, ...parts].join("/")),
  parse: (str: string) => createMockUri(str.replace(/^[a-z]+:/, "")),
};

export const workspace = {
  fs: {
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readDirectory: vi.fn().mockResolvedValue([]),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ type: FileType.File }),
  },
  openTextDocument: vi.fn().mockImplementation(async (arg: any) => {
    if (arg && arg.path) return { uri: arg, fileName: arg.path, getText: () => "{}" };
    return { content: arg?.content, language: arg?.language, getText: () => arg?.content || "{}" };
  }),
  workspaceFolders: [{ uri: createMockUri("/dev/null"), name: "vitest", index: 0 }],
};

export const ViewColumn = { Active: -1, Beside: 2, One: 1 } as const;

export const window = {
  showTextDocument: vi.fn().mockResolvedValue({ document: {}, edit: vi.fn().mockResolvedValue(true) }),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
};
```

---

## 4. Basis-Fixture

Datei: `tests/support/fixtures/test.ts`

```typescript
import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimesheetRepository } from "@/domain/session/types";
import { container } from "tsyringe";
import { test as base, vi } from "vitest";
import type { ExtensionContext } from "vscode";
import { createExtensionContextMock } from "../mocks/extension-context.mock";
import { installInMemoryFs, type InMemoryFs } from "./in-memory-fs";

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
  }, { auto: true }],

  vscodeContext: [async ({ diContainer }, use) => {
    const mockCtx = createExtensionContextMock();
    diContainer.registerInstance(EXTENSION_CONTEXT_TOKEN, mockCtx);
    await use(mockCtx as unknown as ExtensionContext);
  }, { auto: true }],

  timesheetRepo: async ({ diContainer, vscodeContext, fs }, use) => {
    const repo = new TimesheetRepository(vscodeContext);
    diContainer.registerInstance(TimesheetRepository, repo);
    await use(repo);
  },
});

export { expect } from "vitest";
```

**Wichtig**: `fs` und `vscodeContext` haben `{ auto: true }` — sie werden automatisch injiziert.

---

## 5. ExtensionContext Mock

Datei: `tests/support/mocks/extension-context.mock.ts`

```typescript
import type { ExtensionContext } from "vscode";

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

---

## 6. In-Memory-Dateisystem

Datei: `tests/support/fixtures/in-memory-fs.ts`

Ersetzt `workspace.fs` durch einen `Map<string, string>` per `vi.spyOn`.

```typescript
import type { TimeEntry } from "@devora-code/api/core";
import { vi } from "vitest";
import { FileType, workspace, type Uri } from "vscode";

export function installInMemoryFs(storageDir: string) {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const fileNotFound = (path: string) => Object.assign(new Error(`FileNotFound: ${path}`), { code: "FileNotFound" });
  const parentOf = (path: string) => path.slice(0, path.lastIndexOf("/"));
  const monthPath = (month: string) => `${storageDir}/${month}.json`;

  vi.spyOn(workspace.fs, "stat").mockImplementation(async (uri: Uri) => {
    if (dirs.has(uri.path)) return { type: FileType.Directory, ctime: 0, mtime: 0, size: 0 };
    const file = files.get(uri.path);
    if (file !== undefined) return { type: FileType.File, ctime: 0, mtime: 0, size: file.length };
    throw fileNotFound(uri.path);
  });

  vi.spyOn(workspace.fs, "readFile").mockImplementation(async (uri: Uri) => {
    const file = files.get(uri.path);
    if (file === undefined) throw fileNotFound(uri.path);
    return encoder.encode(file);
  });

  vi.spyOn(workspace.fs, "writeFile").mockImplementation(async (uri: Uri, content: Uint8Array) => {
    if (!dirs.has(parentOf(uri.path))) throw fileNotFound(parentOf(uri.path));
    files.set(uri.path, decoder.decode(content));
  });

  vi.spyOn(workspace.fs, "createDirectory").mockImplementation(async (uri: Uri) => {
    dirs.add(uri.path);
  });

  vi.spyOn(workspace.fs, "readDirectory").mockImplementation(async (uri: Uri) => {
    if (!dirs.has(uri.path)) throw fileNotFound(uri.path);
    return [...files.keys()]
      .filter((path) => parentOf(path) === uri.path)
      .map((path) => [path.slice(path.lastIndexOf("/") + 1), FileType.File] as [string, FileType]);
  });

  return {
    files,
    dirs,

    seedMonth(month: string, data: Record<string, TimeEntry[]>) {
      dirs.add(storageDir);
      files.set(monthPath(month), JSON.stringify(data, null, 2) + "\n");
    },

    readMonth(month: string): Record<string, TimeEntry[]> | undefined {
      const raw = files.get(monthPath(month));
      return raw === undefined ? undefined : JSON.parse(raw);
    },

    listMonths(): string[] {
      return [...files.keys()]
        .filter((path) => parentOf(path) === storageDir)
        .map((path) => path.slice(path.lastIndexOf("/") + 1))
        .sort();
    },

    storageDirExists: () => dirs.has(storageDir),
  };
}

export type InMemoryFs = ReturnType<typeof installInMemoryFs>;
```

---

## 7. TimeEntry Factory

Datei: `tests/support/mocks/_time-entry.factory.ts`

```typescript
import type { TimeEntryDTO } from "@/infrastructure/timesheet";
import type { TimeEntry } from "@devora-code/api/core";

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

---

## 8. Import-Konventionen

```typescript
// Fixtures
import { test } from "@/support";                              // Basis-Fixture (Command Tests)
import { test } from "../../fixtures/test.fixture";           // Modulspezifische Fixture (Service Tests)
import { test } from "@/support";                             // Auch möglich

// Commands/Services
import { GetActiveTimerHandler } from "@/domain/session";
import { AddEntryHandler } from "@src/domain/timesheet/commands";
import { SessionService } from "@src/domain/session/service/session.service";

// Test-Hilfsmittel
import { buildTimeEntry } from "@/support";

// Typen
import type { TimeEntryDTO } from "@/domain/session/types";
import type { StartSessionCommand } from "@devora-code/api/session";
import type { TimesheetAddEntryCommand } from "@devora-code/api/timesheet";

// Vitest
import { describe, expect, vi } from "vitest";
import { afterEach } from "vitest";
import * as vscode from "vscode";                            // Immer der Mock!
```

**Wichtig**:
- Commands: `@/domain/<modul>` (Barrel-Export) oder `@src/domain/<modul>/commands` (direkt)
- Services: `@src/domain/<modul>/service/<service>.ts` (direkter Zugriff)
- Commands/TYPEN: `@devora-code/api/<modul>`
- Test-Hilfsmittel: `@/support/*`

---

## 9. Test-Beschreibungs-Konvention

```typescript
test("sollte <erwartetes-verhalten> wenn <szenario>", async ({ fixtures }) => { ... });
```

Beispiele:
- `"sollte den aktiven Timer zurückgeben wenn einer existiert"`
- `"sollte null zurückgeben wenn kein aktiver Timer"`
- `"sollte Timer starten und globalState setzen"`
- `"sollte laufenden Timer beenden wenn neuer gestartet wird"`
- `"sollte Error werfen wenn Timer schon beendet"`
- `"sollte Session splitten wenn Timer VOR dem neuen Eintrag startet"`

**Imperativ, Präsens, deutsch.**

---

## 10. Assertion-Patterns

```typescript
// Primitive
expect(result).toBe(value);
expect(result).toBeNull();
expect(result).toBeUndefined();
expect(result).toBeDefined();

// Arrays
expect(result).toHaveLength(3);
expect(result.entries).toEqual([]);

// Teilweise Objektübereinstimmung
expect(result).toMatchObject({ issueKey: "PROJ-42" });
expect(fs.readMonth("2026-10")).toMatchObject({
  "2026-10-14": [expect.objectContaining({ issueKey: "PROJ-10" })],
});

// Property
expect(obj).toHaveProperty("key");
expect(obj).not.toHaveProperty("id");          // ID stripped im Output

// Fehler
await expect(handler.execute()).rejects.toThrow("Erwartete Fehlermeldung");
await expect(handler.execute()).rejects.toThrow(/regExPatter/);

// Grössenvergleich
expect(result.count).toBeGreaterThanOrEqual(1);
```

---

## 11. Fake Timers

```typescript
import { vi } from "vitest";

test("sollte Timer mit aktueller Zeit setzen", async () => {
  const startAt = "2026-10-14T09:00:00";

  vi.useFakeTimers();
  vi.setSystemTime(new Date(startAt));

  // ... Test-Code ...

  vi.useRealTimers();   // ← IMMER am Ende!
});
```

---

## 12. Repository-Spy

```typescript
vi.spyOn(timesheetRepository, "write").mockImplementation(async () => []);
await expect(service.start("PROJ-42")).rejects.toThrow("Fehlermeldung");
```

---

## 13. VS Code workspace.fs spy

Manchmal muss der Standard-Mock überschrieben werden:

```typescript
import * as vscode from "vscode";

let capturedBuffer = Buffer.from([]);
const writeSpy = vi
  .spyOn(vscode.workspace.fs, "writeFile")
  .mockImplementation(async (_, buf) => { capturedBuffer = Buffer.from(buf); });

expect(writeSpy).toHaveBeenCalledTimes(1);
```

---

## 14. Cleanup

```typescript
import { afterEach } from "vitest";

test("...", async () => { ... });

afterEach(() => vi.restoreAllMocks());  // ← spies cleanuppen
```

---

## 15. Seed-Daten-Format

```typescript
// Einfacher Seed
fs.seedMonth("2026-10", {});

// Mit Daten
fs.seedMonth("2026-10", {
  "2026-10-14": [
    { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
    { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: null },  // offen
  ],
});

// Mehrere Monate
fs.seedMonth("2026-10", { "2026-10-14": [entry] });
fs.seedMonth("2026-11", { "2026-11-01": [entry] });
```

---

## 16. FS-Lese-API

```typescript
const monthData = fs.readMonth("2026-10");
// → { "2026-10-14": [ {...}, {...} ] } | undefined

const months = fs.listMonths();
// → ["2026-10.json", "2026-11.json"]

fs.storageDirExists();
// → boolean

// Roh-Zugriff
fs.files.get("/storage/booking-data/2026-10.json");
fs.dirs.has("/storage");
```

**Wichtig**: Nach jeder Operation MUSS neu gelesen werden — `fs.readMonth()` liest aktuell!

---

## 17. Command-Objekt-Format

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

Typen kommen aus `@devora-code/api/<modul>`.

---

## 18. Command Handler Ausführen

```typescript
// Command Handler instantiieren + aufrufen
const handler = new MyHandler(command);
const result = await handler.execute();
```

---

## 19. Verzeichnisstruktur

```
tests/domain/<modul>/
├── fixtures/
│   └── test.fixture.ts          # Modulspezifische Fixture
└── tests/
    ├── commands/                # Command Handler Tests
    │   └── <handler>.spec.ts
    └── domain/                  # Service Methods Tests
        └── <service>.spec.ts

tests/support/
├── fixtures/                    # Basis-Fixture, In-Memory-FS, etc.
│   ├── test.ts
│   ├── in-memory-fs.ts
│   └── extension-context.ts
└── mocks/                       # VS Code Mocks
    ├── vscode.ts
    └── extension-context.mock.ts
```
