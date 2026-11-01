/**
 * Window-Mock: Editor, Meldungen.
 */
import { vi } from "vitest";

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
    edit: vi.fn().mockResolvedValue(true),
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

export { mockEditor };
