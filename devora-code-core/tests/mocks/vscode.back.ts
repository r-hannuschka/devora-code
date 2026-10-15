import { createExtensionContextMock } from "../helpers/extension-context.mock";

import { vi } from 'vitest';

// --- Klassen & Typen ---
export class ExtensionContext {
  subscriptions: { dispose(): any }[] = [];
  workspaceState = { get: vi.fn(), update: vi.fn(), keys: vi.fn() };
  globalState = { get: vi.fn(), update: vi.fn(), keys: vi.fn(), setKeysForSync: vi.fn() };
  secrets = { get: vi.fn(), store: vi.fn(), delete: vi.fn(), onDidChange: vi.fn() };
  extensionUri = Uri.file('/mock/extension/path');
  extensionPath = '/mock/extension/path';
  asAbsolutePath = vi.fn((p) => p);
  storageUri = Uri.file('/mock/storage/path');
  storagePath = '/mock/storage/path';
  globalStorageUri = Uri.file('/mock/global-storage/path');
  globalStoragePath = '/mock/global-storage/path';
  logUri = Uri.file('/mock/log/path');
  logPath = '/mock/log/path';
  extensionMode = 3; // ExtensionMode.Test
  environmentVariableCollection = {} as any;
}

export class Uri {
  readonly scheme: string;
  readonly authority: string;
  readonly path: string;
  readonly query: string;
  readonly fragment: string;

  constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
    this.scheme = scheme;
    this.authority = authority;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }

  get fsPath() { return this.path; }
  toString() { return `${this.scheme}://${this.authority}${this.path}`; }
  toJSON() { return this.toString(); }

  static file(path: string) { return new Uri('file', '', path, '', ''); }
  static parse(value: string) { return new Uri('string', '', value, '', ''); }
  static joinPath(base: Uri, ...pathSegments: string[]) { return Uri.file(`${base.path}/${pathSegments.join('/')}`); }
}

export class Position {
  constructor(public readonly line: number, public readonly character: number) {}
  isBefore = vi.fn(); isBeforeOrEqual = vi.fn(); isAfter = vi.fn(); isAfterOrEqual = vi.fn(); isEqual = vi.fn(); compareTo = vi.fn(); translate = vi.fn(); with = vi.fn();
}

export class Range {
  public readonly start: Position;
  public readonly end: Position;
  constructor(start: Position | number, end: Position | number, startChar?: number, endChar?: number) {
    this.start = typeof start === 'number' ? new Position(start, startChar || 0) : start;
    this.end = typeof end === 'number' ? new Position(end, endChar || 0) : end;
  }
  isEmpty = false; isSingleLine = false; contains = vi.fn(); isEqual = vi.fn(); intersection = vi.fn(); union = vi.fn(); with = vi.fn();
}

export class Selection extends Range {
  constructor(public readonly anchor: Position, public readonly active: Position) { super(anchor, active); }
}

export class Disposable {
  static from(...disposables: { dispose(): any }[]) { return new Disposable(() => disposables.forEach(d => d.dispose())); }
  constructor(private callOnDispose: () => any) {}
  dispose() { this.callOnDispose(); }
}

export class EventEmitter<T> {
  private listeners: ((e: T) => any)[] = [];
  event = (listener: (e: T) => any) => {
    this.listeners.push(listener);
    return new Disposable(() => this.listeners = this.listeners.filter(l => l !== listener));
  };
  fire(data: T) { this.listeners.forEach(l => l(data)); }
  dispose() { this.listeners = []; }
}

export enum StatusBarAlignment { Left = 1, Right = 2 }
export enum ConfigurationTarget { Global = 1, Workspace = 2, WorkspaceFolder = 3 }
export enum ExtensionMode { Production = 1, Development = 2, Test = 3 }

// --- Namespaces / Sub-APIs ---

export const window = {
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  showInputBox: vi.fn().mockResolvedValue(undefined),
  withProgress: vi.fn((options, task) => task({ report: vi.fn() }, { isCancellationRequested: false })),
  createOutputChannel: vi.fn(() => ({ name: 'mock', append: vi.fn(), appendLine: vi.fn(), clear: vi.fn(), show: vi.fn(), hide: vi.fn(), dispose: vi.fn() })),
  createStatusBarItem: vi.fn(() => ({ alignment: 1, priority: 0, text: '', tooltip: '', command: '', color: '', backgroundColor: '', show: vi.fn(), hide: vi.fn(), dispose: vi.fn() })),
  activeTextEditor: undefined as any,
  visibleTextEditors: [],
  onDidChangeActiveTextEditor: new EventEmitter<any>().event,
};

export const workspace = {
  workspaceFolders: [],
  getWorkspaceFolder: vi.fn(),
  asRelativePath: vi.fn((path) => path),
  createFileSystemWatcher: vi.fn(() => ({ onDidCreate: vi.fn(), onDidChange: vi.fn(), onDidDelete: vi.fn(), dispose: vi.fn() })),
  findFiles: vi.fn().mockResolvedValue([]),
  openTextDocument: vi.fn(),
  registerTextDocumentContentProvider: vi.fn(),
  onDidOpenTextDocument: new EventEmitter<any>().event,
  onDidCloseTextDocument: new EventEmitter<any>().event,
  onDidChangeTextDocument: new EventEmitter<any>().event,
  onDidSaveTextDocument: new EventEmitter<any>().event,
  getConfiguration: vi.fn(() => ({
    get: vi.fn((key, defaultValue) => defaultValue),
    has: vi.fn(() => true),
    update: vi.fn().mockResolvedValue(undefined),
    inspect: vi.fn(),
  })),
  onDidChangeConfiguration: new EventEmitter<any>().event,
};

export const commands = {
  registerCommand: vi.fn((id, callback) => new Disposable(() => {})),
  registerTextEditorCommand: vi.fn((id, callback) => new Disposable(() => {})),
  executeCommand: vi.fn().mockResolvedValue(undefined),
  getCommands: vi.fn().mockResolvedValue([]),
};

export const env = {
  appName: 'Visual Studio Code - Mock',
  appRoot: '/mock/root',
  language: 'en',
  clipboard: { readText: vi.fn().mockResolvedValue(''), writeText: vi.fn().mockResolvedValue(undefined) },
  machineId: 'mock-machine-id',
  sessionId: 'mock-session-id',
  openExternal: vi.fn().mockResolvedValue(true),
  uriScheme: 'vscode',
};

// Packe alles in das Default-Export-Objekt für maximale Kompatibilität
const vscode = {
  ExtensionContext, Uri, Position, Range, Selection, Disposable, EventEmitter,
  StatusBarAlignment, ConfigurationTarget, ExtensionMode,
  window, workspace, commands, env
};

export default vscode;
