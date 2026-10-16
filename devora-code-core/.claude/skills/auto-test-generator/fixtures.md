# Fixture-Vorlagen

> Vorlage für modulspezifische Fixtures. Jede Fixture erweitert die Basis-Fixture
> aus `@/support` und fügt modulspezifische Services/Repositories hinzu.

---

## Vorlage: Modulspezifische Fixture

```typescript
// tests/domain/<modul>/fixtures/test.fixture.ts
import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimesheetRepository } from "@/domain/session/types";
import { container } from "tsyringe";
import { test as base } from "@/support";
import { <ServiceName> } from "@src/domain/<modul>/service/<service>";

interface MyFixtures {
  <serviceVar>: <ServiceName>;
  <repoVar>? : <RepositoryName>;
}

export const test = base.extend<MyFixtures>({
  <serviceVar>: [async ({ vscodeContext, fs }, use) => {
    container.clearInstances();

    // Echte Repo-Instanz — workspace.fs ist gemockt durch installInMemoryFs
    const repo = new TimesheetRepository(vscodeContext);
    const service = new <ServiceName>(repo, vscodeContext);

    container.registerInstance(<ServiceName>, service);
    await use(service);
  }, { auto: true }],

  <repoVar>: async ({ vscodeContext }, use) => {
    const repository = new TimesheetRepository(vscodeContext);
    await use(repository);
  },
});

export { expect } from "vitest";
```

---

## Konventionen

### Service-Fixture
- Verwende `{ auto: true }` — der Service wird automatisch injiziert
- Rufe `container.clearInstances()` vor dem Erstellen neuer Instanzen
- Erstelle ECHTE Repository-Instanz (nicht gemockt)
- Register die Service-Instanz im Container: `container.registerInstance(<ServiceName>, service)`

### Repository-Fixture
- **NICHT** `{ auto: true }` — es wird nur explizit angefragt wenn nötig
- Erstelle neue Repository-Instanz pro Test
- Verwende den injizierten `vscodeContext`

---

## Vorlage: Command-Handler Test (KEINE modulspezifische Fixture nötig)

Command Handler Tests verwenden die BASH-Fixture direkt:

```typescript
import { <HandlerName> } from "@src/domain/<modul>/commands";
import { test } from "@/support";
import type { <CommandType> } from "@devora-code/api/<modul>";
import { describe, expect } from "vitest";

describe("<HandlerName>", () => {
  test("sollte <ergebnis> wenn <szenario>", async ({ fs, vscodeContext }) => {
    // Seed
    fs.seedMonth("2026-10", { ... });

    // Command
    const command: <CommandType> = {
      id: "test-1",
      type: "<modul>:<action>",
      payload: { ... },
    };

    // Execute
    const result = await new <HandlerName>(command).execute();

    // Assert
    expect(result).toMatchObject({ ... });
  });
});
```

---

## Vorlage: Service Method Test (modulspezifische Fixture nötig)

```typescript
import { test } from "../../fixtures/test.fixture";
import type { <Type> } from "@/domain/session/types";
import { describe, expect, vi } from "vitest";

describe("<ServiceName>.<methodName>", () => {
  test("sollte <ergebnis> wenn <szenario>", async ({ <serviceVar>, fs, vscodeContext }) => {
    // Seed
    fs.seedMonth("2026-10", { ... });
    await vscodeContext.globalState.update("key", value);

    // Execute
    const result = await <serviceVar>.<methodName>(args);

    // Assert
    expect(result).toMatchObject({ ... });
  });
});
```

---

## Wichtige Hinweise

1. **Service-Konstruktoren prüfen** — welche Dependencies braucht der Service?
   - `SessionService` braucht: `TimesheetRepository`, `ExtensionContext`
   - `TimesheetService` braucht: `TimesheetRepository`, `LoggerService`, `NotificationService`, `ExtensionContext`

2. **Bei komplexen Service-Konstruktoren** (wie TimesheetService mit 4 Dependencies):
   - Repository: echte Instanz erstellen
   - LoggerService: mocken mit `vi.mock` oder `mock<LoggerService>(LoggerService)`
   - NotificationService: mocken analog
   - ExtensionContext: aus Fixture injizieren

3. **Container leeren** — `container.clearInstances()` vor jeder Fixture-Initialisierung
