/**
 * Minimaler Ersatz für das "vscode" Modul (existiert nur im Extension Host).
 * Wird per Alias in vitest.config.ts eingebunden.
 *
 * Nach dem Test: vi.restoreAllMocks() (z.B. im afterEach) um spies zu cleanuppen.
 *
 * Struktur:
 * - types.ts      : FileType, ViewColumn, DiagnosticSeverity
 * - uri.ts        : Uri.file, Uri.joinPath, Uri.parse
 * - workspace.ts  : fs, openTextDocument, workspaceFolders, getConfiguration
 * - window.ts     : showTextDocument, activeTextEditor, Meldungen
 * - commands.ts   : executeCommand
 * - diagnostics.ts: Range, Diagnostic, DiagnosticCollection
 * - events.ts     : Event<T>, createEvent, TextDocument, TextEditor
 */

// Base-Objekte importieren (Events erweitern sie via Object.assign)
import { workspace } from "./vscode/workspace";
import { window } from "./vscode/window";

// Events exportieren (sieht workspace/window zur Laufzeit erweitert)
export {
  onDidOpenTextDocument,
  onDidChangeTextDocument,
  onDidChangeActiveTextEditor,
} from "./vscode/events";

// Alles Weitere re-exportieren
export * from "./vscode/uri";
export { workspace };
export { window };
export * from "./vscode/commands";
export * from "./vscode/types";
export * from "./vscode/diagnostics";
export type { TextEditor as TextEditorType } from "./vscode/events";
