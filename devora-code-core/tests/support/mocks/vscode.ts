/**
 * Minimaler Ersatz für das "vscode" Modul (existiert nur im Extension Host).
 * Wird per Alias in vitest.config.ts eingebunden.
 *
 * Nach dem Test: vi.restoreAllMocks() (z.B. im afterEach) um spies zu cleanuppen.
 */
import { vi } from "vitest";

export const FileType = { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 } as const;

// 1. Helfer für URIs, damit .toString() und Pfade im Handler richtig matchen
const createMockUri = (fullPath: string) => ({
  scheme: "file",
  authority: "",
  path: fullPath,
  query: "",
  fragment: "",
  fsPath: fullPath,
  with: () => { throw new Error("Not implemented"); },
  toJSON: () => {},
  toString: () => `file://${fullPath}`
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
    delete: vi.fn().mockResolvedValue(undefined),
  },

  // 2. Akzeptiert jetzt sowohl Konfigurationsobjekte als auch Datei-URIs
  openTextDocument: vi.fn().mockImplementation(async (arg: any) => {
    if (arg && arg.path) {
      // Wenn eine URI übergeben wurde
      return {
        uri: arg,
        fileName: arg.path,
        getText: () => "{}" // Fake Inhalt für .getText()
      };
    }
    // Fallback für { content, language }
    return {
      content: arg?.content,
      language: arg?.language,
      getText: () => arg?.content || "{}"
    };
  }),

  // 3. Hier lag der Fehler: Array-Struktur repariert
  workspaceFolders: [
    {
      uri: createMockUri("/dev/null"),
      name: "vitest",
      index: 0
    }
  ]
};

export const commands = {
  executeCommand: vi.fn().mockResolvedValue(undefined),
};

export const ViewColumn = { Active: -1, Beside: 2, One: 1 } as const;

/**
 * Standard-Editor mit leerem Dokument (fileName ohne .devora-timesheet).
 * Im Test überschreiben mit vi.spyOn oder mockReturnValue:
 *   const editor = {
 *     document: { fileName: "test.devora-timesheet", getText: () => jsonContent }
 *   };
 *   vi.spyOn(vscode.window, "activeTextEditor").mockReturnValue(editor);
 */
const mockEditor = { document: { fileName: "dummy.txt", getText: () => "{}" } };

/**
 * Standard-DiagnosticCollection — leer.
 * Im Test mit vi.spyOn oder Mock ersetzen:
 *   const mock = { set: vi.fn(), delete: vi.fn(), keys: vi.fn(() => []) };
 *   vi.spyOn(vscode.languages, "createDiagnosticCollection").mockReturnValue(mock);
 */
export const mockDiagnosticCollection: DiagnosticCollection = {
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(() => undefined),
  keys: vi.fn(() => []),
  clear: vi.fn(),
  dispose: vi.fn(),
};

export const window = {
  showTextDocument: vi.fn().mockResolvedValue({
    document: {},
    edit: vi.fn().mockResolvedValue(true)
  }),

  /**
   * Liefert den aktiven Editor — Standard: undefined (kein Editor offen).
   * Im Test mit vi.spyOn() mocken:
   *   vi.spyOn(vscode.window, "activeTextEditor").mockReturnValue({
   *     document: { fileName: "test.devora-timesheet", getText: () => json }
   *   });
   */
  activeTextEditor: vi.fn().mockReturnValue(undefined),

  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
};

// ====================================================================
// Diagnostic & Range
// ====================================================================

export class Range {
  constructor(
    public readonly startLine: number,
    public readonly startCharacter: number,
    public readonly endLine: number,
    public readonly endCharacter: number,
  ) {}
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export class Diagnostic {
  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly severity: DiagnosticSeverity,
    public readonly source?: string,
    public readonly code?: string | { value: string; target: any },
    public readonly tags?: any[],
  ) {}
}

// ====================================================================
// DiagnosticCollection (in-Memory)
// ====================================================================

export interface DiagnosticCollection {
  set(uri: any, diagnostics: Diagnostic[]): void;
  delete(uri: any): void;
  /** Liefert alle aktuell gespeicherten Diagnostics. Nur für Tests. */
  get(uri: any): Diagnostic[] | undefined;
  /** Liefert alle gespeicherten URIs. Nur für Tests. */
  keys(): any[];
  clear(): void;
  /** Disposer-Funktion. */
  dispose(): void;
}

class InMemoryDiagnosticCollection implements DiagnosticCollection {
  private readonly map = new Map<any, Diagnostic[]>();

  set(uri: any, diagnostics: Diagnostic[]): void {
    this.map.set(uri, diagnostics);
  }

  delete(uri: any): void {
    this.map.delete(uri);
  }

  get(uri: any): Diagnostic[] | undefined {
    return this.map.get(uri);
  }

  keys(): any[] {
    return [...this.map.keys()];
  }

  clear(): void {
    this.map.clear();
  }

  dispose(): void {
    this.map.clear();
  }
}

export const languages = {
  createDiagnosticCollection: () => mockDiagnosticCollection,
};

// ====================================================================
// TextDocument
// ====================================================================

export interface TextDocument {
  uri: any;
  fileName: string;
  lineCount: number;
  getText(): string;
  lineAt(index: number): { text: string };
}

function createTextDocument(
  uri: { path: string; fsPath: string; toString: () => string },
  content: string,
): TextDocument {
  const lines = content.split("\n");
  return {
    uri,
    fileName: uri.path,
    lineCount: lines.length,
    getText: () => content,
    lineAt: (index: number) => ({ text: lines[index] ?? "" }),
  };
}

// ====================================================================
// TextEditor
// ====================================================================

export interface TextEditor {
  document: TextDocument;
}

// ====================================================================
// Events (onDidOpenTextDocument, onDidChangeTextDocument, onDidChangeActiveTextEditor)
// ====================================================================

/**
 * Vereinfachter Event-Stub. Registriert Callbacks und bietet eine
 * fire()-Methode, um die Callbacks im Test manuell zu triggern.
 */
export interface Event<T> {
  (listener: (e: T) => void): { dispose(): void };
  fire(event: T): void;
}

function createEvent<T>(): Event<T> {
  const listeners = new Set<(e: T) => void>();
  const event: Event<T> = ((listener: (e: T) => void) => {
    listeners.add(listener);
    return {
      dispose: () => listeners.delete(listener),
    };
  }) as Event<T>;
  event.fire = (eventData: T) => {
    for (const listener of listeners) {
      listener(eventData);
    }
  };
  return event;
}

export const onDidOpenTextDocument: Event<TextDocument> = createEvent<TextDocument>();
export const onDidChangeTextDocument: Event<{ document: TextDocument }> = createEvent<{ document: TextDocument }>();
export const onDidChangeActiveTextEditor: Event<TextEditor | undefined> = createEvent<TextEditor | undefined>();

// Erweitere workspace mit Event-Listeners
Object.assign(workspace, {
  onDidOpenTextDocument,
  onDidChangeTextDocument,
});

// Erweitere window mit Event-Listeners
Object.assign(window, {
  onDidChangeActiveTextEditor,
});

export type { TextEditor as TextEditorType };
