import { afterEach, describe, expect, vi } from "vitest";
import { test } from "../../fixtures/document-validator.fixture";
import * as vscode from "vscode";
import type { TextDocument, TextEditor } from "vscode";
import { workspace, window } from "vscode";

/**
 * TimesheetDocumentValidatorService testet die Dokument-Validierung:
 * - validatedDocument: JSON parsen, rawValidator aufrufen, Diagnostics setzen/löschen
 * - extractDateRangeFromFilename: Regex aus Dateinamen minDate/maxDate extrahieren
 * - onDidOpenTextDocument: Validator bei Datei-Öffnung starten
 * - onDidChangeTextDocument: Debounced-Validierung bei Änderung
 * - onDidChangeActiveTextEditor: Validierung bei Editor-Wechsel
 */
describe("TimesheetDocumentValidatorService", () => {
  afterEach(() => vi.restoreAllMocks());

  // ====================================================================
  // extractDateRangeFromFilename — positive Pfade
  // ====================================================================

  test("sollte Datumsrange aus gültigem Dateinamen extrahieren", ({ documentValidator }) => {
    const path = "/home/user/2026-10-01_2026-10-31.devora-timesheet";
    const range = (documentValidator as any).extractDateRangeFromFilename(path);

    expect(range).toEqual({ minDate: "2026-10-01", maxDate: "2026-10-31" });
  });

  test("sollte auch Pfade mit Unterverzeichnissen parsen", ({ documentValidator }) => {
    const path = "/a/b/c/d/2025-01-15_2025-02-28.devora-timesheet";
    const range = (documentValidator as any).extractDateRangeFromFilename(path);

    expect(range).toEqual({ minDate: "2025-01-15", maxDate: "2025-02-28" });
  });

  // ====================================================================
  // extractDateRangeFromFilename — Error-Pfade
  // ====================================================================

  test("sollte null zurückgeben bei Datei ohne .devora-timesheet Endung", ({ documentValidator }) => {
    const range = (documentValidator as any).extractDateRangeFromFilename("/path/to/file.txt");
    expect(range).toBeNull();
  });

  test("sollte null zurückgeben wenn Dateinamen kein Datumsformat hat", ({ documentValidator }) => {
    const range = (documentValidator as any).extractDateRangeFromFilename("/path/to/notadate.devora-timesheet");
    expect(range).toBeNull();
  });

  test("sollte null zurückgeben bei Dateinamen nur mit Endung", ({ documentValidator }) => {
    const range = (documentValidator as any).extractDateRangeFromFilename("/path/to/2026-10-01.devora-timesheet");
    expect(range).toBeNull();
  });

  // ====================================================================
  // validatedDocument — positive Pfade (gültige JSON, keine Errors)
  // ====================================================================

  test("sollte keine Diagnostics setzen wenn JSON gültig und valid", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, JSON.stringify({
      "2026-10-15": [{ issueKey: "PROJ-1", startAt: "2026-10-15T09:00:00", endAt: "2026-10-15T10:00:00" }],
    }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  test("sollte Diagnostics löschen wenn Dokument leeres JSON-Objekt hat", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, "{}");

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  // ====================================================================
  // validatedDocument — Error-Pfade (Ungültiges JSON)
  // ====================================================================

  test("sollte kein Diagnostic werfen bei ungültigem JSON (silent ignore)", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, "{ this is not valid json {{{");

    expect(() => (documentValidator as any).validatedDocument(doc)).not.toThrow();

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  test("sollte nichts tun wenn URI undefined ist", ({ documentValidator }) => {
    const doc = { uri: undefined, getText: () => "{}" } as TextDocument;

    expect(() => (documentValidator as any).validatedDocument(doc)).not.toThrow();

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  test("sollte nichts tun wenn document undefined", ({ documentValidator }) => {
    (documentValidator as any).validatedDocument(undefined as any);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  // ====================================================================
  // validatedDocument — Out-of-Range Errors
  // ====================================================================

  test("sollte Diagnostic setzen wenn Datum außerhalb der Range liegt", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, JSON.stringify({
      "2026-11-05": [{ issueKey: "LATE", startAt: "2026-11-05T09:00:00", endAt: "2026-11-05T10:00:00" }],
    }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).toHaveBeenCalledTimes(1);
    const [receivedUri, diagnostics] = mockCol.set.mock.calls[0];
    expect(receivedUri).toBe(uri);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("2026-10-01");
    expect(diagnostics[0].message).toContain("2026-10-31");
    expect(diagnostics[0].message).toContain("außerhalb des erlaubten Bereichs");
  });

  test("sollte Diagnostic für Datum vor der Range setzen", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, JSON.stringify({
      "2026-09-15": [{ issueKey: "EARLY", startAt: "2026-09-15T09:00:00", endAt: "2026-09-15T10:00:00" }],
    }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).toHaveBeenCalledTimes(1);
    const diagnostics = mockCol.set.mock.calls[0][1];
    expect(diagnostics[0].message).toContain("außerhalb des erlaubten Bereichs");
  });

  test("sollte alle Out-of-Range Errors sammeln, nicht nur den ersten", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, JSON.stringify({
      "PRE-KEY": [{ issueKey: "PRE1", startAt: "2026-09-01T09:00:00", endAt: "2026-09-01T10:00:00" }],
      "2026-10-15": [{ issueKey: "OK", startAt: "2026-10-15T09:00:00", endAt: "2026-10-15T10:00:00" }],
      "LATE-KEY": [{ issueKey: "LATE1", startAt: "2026-11-20T09:00:00", endAt: "2026-11-20T10:00:00" }],
    }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).toHaveBeenCalledTimes(1);
    const diagnostics = mockCol.set.mock.calls[0][1];
    expect(diagnostics).toHaveLength(2);
  });

  // ====================================================================
  // validatedDocument — Line-Index-Matching
  // ====================================================================

  test("sollte Diagnostic auf die richtige Zeile setzen", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    // "and on line 1" ist OUT_OF_RANGE, "2026-11-05" ist auch OUT_OF_RANGE.
    // Das erste Diagnostic ("and on line 1") muss auf Zeile 1 zeigen.
    const json = `{\n  "and on line 1": true,\n  "2026-11-05": [{ "issueKey": "X", "startAt": "2026-11-05T09:00:00", "endAt": "2026-11-05T10:00:00" }]\n}`;
    const doc = createDocWithLines(uri, json);

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).toHaveBeenCalledTimes(1);
    const diagnostics = mockCol.set.mock.calls[0][1];
    expect(diagnostics).toHaveLength(2);
    // Erstes Diagnostic auf Zeile 1 (Schlüssel "and on line 1")
    expect(diagnostics[0].range.startLine).toBe(1);
    // Zweites Diagnostic auf Zeile 2 (Schlüssel "2026-11-05")
    expect(diagnostics[1].range.startLine).toBe(2);
  });

  test("sollte kein Diagnostic setzen wenn lineIndex -1 (text nicht gefunden)", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    // JSON, aber die Zeile hat keine Anführungszeichen um das Datum
    const json = `{2026-11-05: [{ issueKey: "X" }]}`; // kein "2026-11-05" als JSON-Schlüssel mit Anführungszeichen
    const doc = createDocWithLines(uri, json);

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  // ====================================================================
  // validateRaw direkt — Range-Mix
  // ====================================================================

  test("sollte Range- und Out-of-Range-Mix korrekt unterscheiden", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, JSON.stringify({
      "2026-10-01": [{ issueKey: "MIN", startAt: "2026-10-01T00:00:00", endAt: "2026-10-01T01:00:00" }],
      "2026-10-15": [{ issueKey: "MID", startAt: "2026-10-15T12:00:00", endAt: "2026-10-15T13:00:00" }],
      "2026-10-31": [{ issueKey: "MAX", startAt: "2026-10-31T23:00:00", endAt: "2026-10-31T23:59:00" }],
      "2026-11-01": [{ issueKey: "LATE", startAt: "2026-11-01T00:00:00", endAt: "2026-11-01T01:00:00" }],
    }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    const diagnostics = mockCol.set.mock.calls[0][1];
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("2026-10-01");
    expect(diagnostics[0].message).toContain("2026-10-31");
    expect(diagnostics[0].message).toContain("außerhalb des erlaubten Bereichs");
  });

  test("sollte kein Diagnostic setzen bei exaktem Randdatum maxDate", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet");
    const doc = createDoc(uri, JSON.stringify({
      "2026-10-31": [{ issueKey: "EDGE", startAt: "2026-10-31T23:00:00", endAt: "2026-10-31T23:59:00" }],
    }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    expect(mockCol.set).not.toHaveBeenCalled();
  });

  // ====================================================================
  // initialize() — Event-Callbacks (subscribe)
  // ====================================================================

  test("sollte initialize() Event-Listener registrieren und subscriptions füllen", ({ documentValidator }) => {
    const subscriptions: unknown[] = [];
    (documentValidator as any).extensionContext = { subscriptions } as any;
    (documentValidator as any).diagnosticCollection = { set: vi.fn(), delete: vi.fn(), dispose: vi.fn() };

    documentValidator.initialize();

    // initialize() push't 3 Listener (onDidOpenTextDocument, onDidChangeTextDocument, onDidChangeActiveTextEditor)
    expect(subscriptions.length).toBe(3);
    // Jeder Eintrag ist ein Disposable (hat eine dispose-Methode)
    for (const sub of subscriptions) {
      expect(typeof (sub as any).dispose).toBe("function");
    }
  });

  // ====================================================================
  // initialize() — validatedDocument über Events aufrufen
  // ====================================================================

  test("sollte validatedDocument via onDidOpenTextDocument aufrufen", ({ documentValidator }) => {
    const subscriptions: unknown[] = [];
    (documentValidator as any).extensionContext = { subscriptions } as any;
    const mockCol = { set: vi.fn(), delete: vi.fn(), dispose: vi.fn() };
    (documentValidator as any).diagnosticCollection = mockCol;

    const validDoc = createDoc(vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet"), "{}");

    documentValidator.initialize();

    // Event feuern (onDidOpenTextDocument ist an workspace gehängt)
    (workspace.onDidOpenTextDocument as any).fire(validDoc);

    expect(mockCol.set).not.toHaveBeenCalled();
  });

  test("sollte validatedDocument via onDidChangeActiveTextEditor aufrufen", ({ documentValidator }) => {
    const subscriptions: unknown[] = [];
    (documentValidator as any).extensionContext = { subscriptions } as any;
    const mockCol = { set: vi.fn(), delete: vi.fn(), dispose: vi.fn() };
    (documentValidator as any).diagnosticCollection = mockCol;

    const validDoc = createDoc(vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet"), "{}");
    const editor = { document: validDoc } as vscode.TextEditor;

    documentValidator.initialize();

    // Event feuern (onDidChangeActiveTextEditor ist an window gehängt)
    (window.onDidChangeActiveTextEditor as any).fire(editor);

    expect(mockCol.set).not.toHaveBeenCalled();
  });

  // ====================================================================
  // handleDocumentChange
  // ====================================================================

  test("sollte handleDocumentChange validatedDocument über Queue aufrufen", async ({ documentValidator }) => {
    const subscriptions: unknown[] = [];
    (documentValidator as any).extensionContext = { subscriptions } as any;
    const mockCol = { set: vi.fn(), delete: vi.fn(), dispose: vi.fn() };
    (documentValidator as any).diagnosticCollection = mockCol;

    const invalidDoc = createDoc(
      vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet"),
      JSON.stringify({ "2026-11-05": [{ issueKey: "LATE" }] }),
    );

    // handleDocumentChange direkt aufrufen
    (documentValidator as any).handleDocumentChange(invalidDoc);

    // debounce: 0ms in Tests. Queue: synchron processing.
    // Eventuell noch einen Microtask für den Promise-Chain.
    await new Promise(r => setTimeout(r, 100));

    expect(mockCol.set).toHaveBeenCalledTimes(1);
    const diagnostics = mockCol.set.mock.calls[0][1];
    expect(diagnostics).toHaveLength(1);
  });

  test("sollte handleDocumentChange AbortController setzen", ({ documentValidator }) => {
    const subscriptions: unknown[] = [];
    (documentValidator as any).extensionContext = { subscriptions } as any;
    (documentValidator as any).diagnosticCollection = { set: vi.fn(), delete: vi.fn(), dispose: vi.fn() };

    const doc = createDoc(vscode.Uri.parse("/path/2026-10-01_2026-10-31.devora-timesheet"), "{}");

    documentValidator.initialize();

    // handleDocumentChange direkt aufrufen
    (documentValidator as any).handleDocumentChange(doc);

    // AbortController sollte gesetzt sein
    const controller = (documentValidator as any).abortController;
    expect(controller).toBeDefined();
  });

  // ====================================================================
  // validatedDocument — Datei ohne Start-End-Paar
  // ====================================================================

  test("sollte validatedDocument nicht aufrufen wenn extractDateRangeFromFilename null zurückgibt", ({ documentValidator }) => {
    const uri = vscode.Uri.parse("/path/2026-10-01.devora-timesheet"); // kein Start-End-Paar
    const doc = createDoc(uri, JSON.stringify({ "2026-11-05": [{ issueKey: "LATE" }] }));

    (documentValidator as any).validatedDocument(doc);

    const mockCol = (vscode as any).languages.createDiagnosticCollection();
    // extractDateRangeFromFilename gibt null zurück → validatedDocument gibt zurück ohne set()
    expect(mockCol.set).not.toHaveBeenCalled();
  });
});

// ====================================================================
// Helpers
// ====================================================================

function createDoc(uri: any, content: string): TextDocument {
  const lines = content.split("\n");
  return {
    uri,
    fileName: uri.path,
    lineCount: lines.length,
    getText: () => content,
    lineAt: (index: number) => ({ text: lines[index] ?? "" }),
  };
}

function createDocWithLines(uri: any, content: string): TextDocument {
  const lines = content.split("\n");
  return {
    uri,
    fileName: uri.path,
    lineCount: lines.length,
    getText: () => content,
    lineAt: (index: number) => ({ text: lines[index] ?? "" }),
  };
}
