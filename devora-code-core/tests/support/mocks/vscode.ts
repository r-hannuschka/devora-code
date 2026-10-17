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

export type ExtensionContext = unknown;
