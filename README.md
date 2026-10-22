# Devora Code

VS Code Extension for task tracking – time logging directly in your editor, no browser switch needed.

---

## What is Devora Code?

Devora Code is a VS Code Extension that lets you track time for tasks – directly from VS Code, without switching to a browser. Open your editor, click "Devora Code", see your tasks, start the timer. Done.

It's built on an **extensible plugin system**: the Core provides the foundation (command system, webview, logger). Jira is the first satellite – integrations like GitHub, GitLab, or CI pipelines could follow.

---

## Setup

### 1. Install the Extension

Install Devora Code from the VS Code Extensions Marketplace or load the `.vsix` file directly.

### 2. Configure your workspace

Devora Code stores its settings **per workspace** – not globally in VS Code. This way, each workspace (e.g. different projects or clients) can have its own configuration.

There are **two ways** to configure settings:

**Option A: `.vscode/settings.json` in the project folder**

```json
{
  "devora-code.projectName": "my-app",
  "devora-code.jira.apiUrl": "https://my-jira.atlassian.net",
  "devora-code.jira.userName": "me",
  "devora-code.jira.apiToken": "my-token",
  "devora-code.jira.projectKey": "PROJ"
}
```

→ Good for team-shared settings that get committed to the repo.

**Option B: `.code-workspace` file** → Settings completely external, separated from code

```json
{
  "folders": [{ "path": "." }],
  "settings": {
    "devora-code.projectName": "my-app",
    "devora-code.jira.apiUrl": "https://my-jira.atlassian.net",
    "devora-code.jira.userName": "me",
    "devora-code.jira.apiToken": "my-token",
    "devora-code.jira.projectKey": "PROJ"
  }
}
```

→ Good when you want to keep your settings separate from code – the `.code-workspace` file can live anywhere, not necessarily in the project.

### 3. Open the dashboard

```
Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux)
→ "Devora Code: open webview"
```

---

## Features

- Start & stop timer directly in the editor
- Load tasks from integrated source (configurable via the satellite system)
- Timesheet for the current month
- Timesheet backup and restore

---

## Development

### Project structure

```
devora-code-api/         → Shared Types (Commands, DTOs, Mappings)
devora-code-core/        → VS Code Extension (Webview, CommandRouter, Settings, Logger)
devora-code-jira/        → Jira Satellite (Issues, Focus-Task, Timer)
devora-code-sdk/         → Command-Pattern (Controller, Registry, Decorator)
devora-code-webview/     → Angular Dashboard (Issues, Timer, Timesheet)
```

### Quick reference

| Package | Tech | Purpose |
|---------|------|---------|
| `devora-code-api` | TypeScript | Shared Types – Commands, DTOs, Mappings |
| `devora-code-core` | TS · Vite · tsyringe | VS Code Extension: Webview, Commands, Settings, Logger |
| `devora-code-jira` (Satellite) | TS · Vite · tsyringe | Jira: Load issues, Focus-Task, Timer |
| `devora-code-sdk` | TypeScript | Command-Pattern: Controller, Registry, @RegisterCommand |
| `devora-code-webview` | Angular 22 · NGXS | Dashboard: Issues, Timer, Timesheet |

### Quickstart

```bash
# Requires Node.js 24 (use nvm: nvm install 24 && nvm use 24)
# Install dependencies
npm install

# Build everything
npm run build:all
```

### Build and package

```bash
# Build extensions (Core → Jira + Webview) and package as .vsix
npm run package
# → .vsix files in dist/
```

### Watch mode

```bash
# Watch mode for everything (Core, Jira, Webview, API, SDK)
npm run watch:all
```

### Run the extension

```bash
code .
# Press F5 → Debug session starts the extension with webview
```

---

## Settings Reference

### Core settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `devora-code.projectName` | string | `""` | Project name |
| `devora-code.timesheetStorageDir` | string | `"./.devora-code/timesheets"` | Timesheet storage path |
| `devora-code.backupStorageDir` | string | `"./.devora-code/backup"` | Backup storage path |

### Jira satellite settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `devora-code.jira.apiUrl` | string | `""` | Jira REST API URL |
| `devora-code.jira.apiToken` | string | `""` | Jira API Token |
| `devora-code.jira.userName` | string | `""` | Jira username / email |
| `devora-code.jira.projectKey` | string | `""` | Jira project key |
| `devora-code.jira.issueTypeMapping` | object | `{}` | Map Jira issue types (e.g. "Bug" → "BUG", "feat" → "FEATURE") |
| `devora-code.jira.statusMapping` | object | `{}` | Map Jira statuses (e.g. "Done" → "DONE", "In Progress" → "IN_PROGRESS") |

---

MIT – Ralf Hannuschka
