# Tutorial: Eigene Satellite-Extension

So erstellt man eine neue Satellite-Extension für Devora Code. Wir bauen ein simples Beispiel: ein **File-Satellite**, der Issues aus einer Textdatei liest.

---

## Die Textdatei

```
KVQAIP-1|FEATURE|Neues Dashboard|HIGH
KVQAIP-2|BUG|Login funktioniert nicht|MEDIUM
KVQAIP-3|FEATURE|Dark Mode|LOW
```

Muster: `KEY|TYP|Beschreibung|Prio`

---

## 1. Projekt aufsetzen

```bash
mkdir devora-code-file
cd devora-code-file
npm init -y
```

### package.json

```json
{
  "name": "devora-code-file",
  "version": "0.0.0",
  "type": "commonjs",
  "main": "./dist/devora-code-file.js",
  "extensionDependencies": ["trueffelmafia.devora-code"],
  "activationEvents": ["onCommand:devora-code.activated"],
  "engines": { "vscode": "^1.105.0" },
  "dependencies": {
    "@devora-code/sdk": "*",
    "@devora-code/api": "*",
    "vite": "^6.0.0",
    "vite-plugin-commonjs": "^1.0.0"
  },
  "scripts": {
    "build": "vite build",
    "watch": "vite build --watch"
  }
}
```

---

## 1.5 Vite Konfiguration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/devora-code-file.ts'),
      name: '@devora-code-file',
      formats: ['cjs'],
      fileName: () => 'devora-code-file.js',
    },
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      external: ['vscode', 'fs', 'path', 'crypto'],
      output: {
        preserveModules: false,
      },
    },
  },
  plugins: [commonjs()],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  optimizeDeps: {
    exclude: ['vscode'],
  },
});
```

### build.sh

```bash
#!/bin/bash
VITE_CONFIG_NATIVE_IGNORE_WARNING=true vite build
```

---

## 2. Controller erstellen

```typescript
// src/file-satellite.ts
import { CommandController } from "@devora-code/sdk";
import type { ISatelliteController } from "@devora-code/sdk";
import type { Command } from "@devora-code/api";
import { container, injectable } from "tsyringe";

import "./commands/list.command";

@injectable()
export class FileSatellite implements ISatelliteController {
  private readonly commandController = container.resolve(CommandController);

  public readonly id = "FileModule";

  // commands = 1:1 die @RegisterCommand-Strings
  public readonly commands = ["issues:list"] as const;

  handleHostCommand(command: Command) {
    return this.commandController.exec(command);
  }
}
```

---

## 3. Command Handler

```typescript
// src/commands/list.command.ts
import { RegisterCommand, type CommandHandler } from "@devora-code/sdk";
import type { IssueList } from "@devora-code/api";
import { container } from "tsyringe";
import { FileRepository } from "../repository/file.repository";

@RegisterCommand("issues:list")
export class ListIssuesHandler implements CommandHandler<IssueList> {
  async execute(): Promise<IssueList> {
    const repo = container.resolve(FileRepository);
    return await repo.getIssues();
  }
}
```

---

## 4. Repository (Datei einlesen)

```typescript
// src/repository/file.repository.ts
import { readFileSync } from "fs";
import { join } from "path";
import { singleton } from "tsyringe";
import type { IssueList, IssueListItem } from "@devora-code/api";

@singleton()
export class FileRepository {
  private readonly filePath = join(__dirname, "issues.txt");

  async getIssues(): Promise<IssueList> {
    const content = readFileSync(this.filePath, "utf-8");
    const lines = content.trim().split("\n");

    const data: IssueListItem[] = lines.map(line => {
      const [key, type, description, priority] = line.split("|");
      return {
        key,
        summary: description,
        issueType: type as any,
        status: "TO_DO" as any,
        priority,
        remainingTimeSeconds: 0,
        timeSpentSeconds: 0,
      };
    });

    return {
      total: data.length,
      count: data.length,
      data,
    };
  }
}
```

---

## 5. Extension Entry Point

```typescript
// src/devora-code-file.ts
import "reflect-metadata";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { FileSatellite } from "./file-satellite";

export function activate(): void {
  const hostExtension = vscode.extensions.getExtension("trueffelmafia.devora-code");

  if (hostExtension) {
    const hostApi = hostExtension.exports;
    if (hostApi && typeof hostApi.registerSubModule === "function") {
      const satellite = container.resolve(FileSatellite);
      hostApi.registerSubModule(satellite);
    }
  }
}

export function deactivate(): void {}
```

---

## Checkliste

- [ ] `package.json` mit `extensionDependencies` und `activationEvents`
- [ ] `ISatelliteController` implementiert
- [ ] `id` eindeutig
- [ ] `commands` = 1:1 `@RegisterCommand`-Strings
- [ ] `handleHostCommand()` delegiert an `CommandController`
- [ ] Handler mit `@RegisterCommand` registriert
- [ ] Handler im Controller importiert
- [ ] `activate()` registriert über `registerSubModule`
- [ ] `reflect-metadata` importiert
