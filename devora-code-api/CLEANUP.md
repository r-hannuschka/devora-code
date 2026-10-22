# Clean-up: devora-code-api

## Problem

`devora-code-api` ist in einem unübersichtlichen Zustand.

### 1. Build-Artefakte im Source-Verzeichnis

`src/` enthält `.js`, `.js.map`, `.d.ts`, `.d.ts.map` direkt neben dem Original `.ts`.
Die gehören alle nur nach `dist/`. Es gibt kein `.gitignore`, wodurch der Mix entstanden ist.

**Beispiel — `src/core/command/`:**

```
src/core/command/
├── command.ts            ← Source (OK)
├── command.js            ← Build-Artefakt (→ dist/)
├── command.js.map        ← Build-Artefakt
├── command.d.ts          ← Build-Artefakt
├── command.d.ts.map      ← Build-Artefakt
├── command-response.ts   ← Source (OK)
├── command-response.js   ← Build-Artefakt
├── command-response.js.map ← Build-Artefakt
```

**Insgesamt 12 Build-Artefakte in `src/`:**

| Pfad | Typ |
|------|-----|
| `src/core/command/command.ts` + 4 Artefakte | JS/DTS |
| `src/core/command/command-response.ts` + 4 Artefakte | JS/DTS |
| `src/logger/index.ts` + 2 Artefakte | JS/DTS |

### 2. Veraltete / unbenutzte Command-Dateien

- `dist/session/commands/unpause.command.*` existiert, aber die `.ts` Source fehlt → totes Artefakt
- `src/session/commands/resume.command.ts` (105 Byte → vermutlich nur Wrapper) vs `pause.command.ts` → unklar welche die "echte" Pause-Funktion ist und ob beide parallel existieren müssen

### 3. package.json exports zeigen nach `dist/`, Source ist verschmutzt

```json
"exports": {
  "./session": {
    "types": "./dist/session/index.d.ts",
    "default": "./dist/session/index.ts"
  }
}
```

Das Grundgerüst ist korrekt (`tsconfig` `outDir` → `dist/`), aber die Quelle enthält bereits Compiler-Output.

## To-Do

- [ ] `.gitignore` anlegen (mindestens: `dist/`, `*.js`, `*.js.map`, `*.d.ts`, `*.d.ts.map`)
- [ ] Alle Build-Artefakte aus `src/` entfernen (`*.js`, `*.js.map`, `*.d.ts`, `*.d.ts.map` außer Originalen)
- [ ] `dist/session/commands/unpause.command.*` löschen (keine .ts Source vorhanden)
- [ ] Prüfen ob `src/session/commands/resume.command.ts` ein sinnvoller Wrapper ist oder gelöscht gehört
- [ ] Build testlauf: `npm run build` muss clean durchgehen

## Checkliste

```bash
# 1. Artefakte aus src/ zählen (vorher/nachher)
find src -type f \( -name "*.js" -o -name "*.js.map" -o -name "*.d.ts" -o -name "*.d.ts.map" \)

# 2. dist/ cleanup
rm devora-code-api/dist/session/commands/unpause.command.*

# 3. Build durchlaufen
npm run build

# 4. Ergebnis checken — keine Artefakte mehr in src/
npm run build && find src -type f \( -name "*.js" -o -name "*.d.ts" \) | grep -v ".ts"
# → sollte nichts mehr liefern
```

## Struktur nach dem Cleanup

```
devora-code-api/
├── .gitignore          ← neu
├── package.json
├── tsconfig.json
├── src/
│   ├── core/
│   │   ├── command/
│   │   │   ├── command.ts
│   │   │   └── command-response.ts    ← nur .ts
│   │   └── types/
│   │       └── time-entry.ts
│   ├── session/
│   │   ├── commands/
│   │   │   ├── start.command.ts
│   │   │   ├── stop.command.ts
│   │   │   ├── pause.command.ts
│   │   │   ├── resume.command.ts     ← oder löschen?
│   │   │   ├── get-active.command.ts
│   │   │   └── reset-session.command.ts
│   │   ├── types/
│   │   │   └── active-session.ts
│   │   └── index.ts
│   ├── timesheet/
│   │   ├── commands/
│   │   ├── types/
│   │   └── index.ts
│   ├── issue/
│   │   ├── commands/
│   │   ├── types/
│   │   └── index.ts
│   └── logger/
│       ├── commands/
│       ├── types/
│       └── index.ts
└── dist/                       ← build output, wird nicht committet
    ├── core/
    ├── session/
    ├── timesheet/
    ├── issue/
    └── logger/
```
