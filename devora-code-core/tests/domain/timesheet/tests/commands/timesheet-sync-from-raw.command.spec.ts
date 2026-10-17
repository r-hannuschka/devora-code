import { TimesheetSyncFromRawHandler } from "@src/domain/timesheet/commands";
import { afterEach, describe, expect, vi } from "vitest";
import * as vscode from "vscode";
import { test } from "@/support";

/**
 * TimesheetSyncFromRawHandler testet den Sync-Flow aus einer .devora-timesheet Datei:
 * - Kein Editor oder falsche Endung → Nothing-Op
 * - Editor mit .devora-timesheet → JSON parsen, syncFromRaw aufrufen, Success-Notification
 * - Fehler beim Parsen oder Sync → Error werfen mit Message
 */
describe("TimesheetSyncFromRawHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  // ========================================================================
  // Nothing-Op / Leere Szenarien
  // ========================================================================

  test("sollte Nothing-Op sein wenn kein Editor offen", async () => {
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(undefined);

    const handler = new TimesheetSyncFromRawHandler();
    await expect(handler.execute()).resolves.toBeUndefined();
  });

  test("sollte Nothing-Op sein wenn Datei keine .devora-timesheet Endung hat", async () => {
    const mockEditor = {
      document: { fileName: "/some/path/notes.txt", getText: () => "{}" },
    } as any;
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(mockEditor);

    const handler = new TimesheetSyncFromRawHandler();
    await expect(handler.execute()).resolves.toBeUndefined();
  });

  // ========================================================================
  // Grundfunktionalitaet
  // ========================================================================

  test("sollte Sync ausfuehren wenn .devora-timesheet Datei offen ist", async () => {
    const validJson = JSON.stringify({ "2026-10-14": [{ issueKey: "PROJ-42", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }] });

    const mockEditor = {
      document: {
        fileName: "/user/work/2026-10-01_2026-10-31.devora-timesheet",
        getText: () => validJson,
      },
    } as any;
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(mockEditor);

    const handler = new TimesheetSyncFromRawHandler();
    await handler.execute();

    // Bei Erfolg: showInfo wurde aufgerufen, kein Error geworfen
    expect(vscode.window.showInformationMessage).toHaveBeenCalled();
  });

  // ========================================================================
  // Sync mit ungueltigem JSON
  // ========================================================================

  test("sollte Error werfen wenn JSON ungueltig ist", async () => {
    const mockEditor = {
      document: {
        fileName: "/user/work/2026-10-01_2026-10-31.devora-timesheet",
        getText: () => "invalid json {{{",
      },
    } as any;
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(mockEditor);

    const handler = new TimesheetSyncFromRawHandler();

    await expect(handler.execute()).rejects.toThrow(
      /could not sync file.*Unexpected token/,
    );
  });

  test("sollte Error werfen wenn JSON nicht als Objekt parsebar ist", async () => {
    const mockEditor = {
      document: {
        fileName: "/user/work/2026-10-01_2026-10-31.devora-timesheet",
        getText: () => '"nur ein string"',
      },
    } as any;
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(mockEditor);

    const handler = new TimesheetSyncFromRawHandler();

    await expect(handler.execute()).rejects.toThrow(/could not sync file/);
  });

  // ========================================================================
  // Sync mit verschiedenen .devora-timesheet Dateinamen
  // ========================================================================

  test("sollte auch .devora-timesheet ohne Monatspraefix erkennen", async () => {
    const validJson = JSON.stringify({ "2026-10-14": [] });

    const mockEditor = {
      document: {
        fileName: "/user/work/foo.devora-timesheet",
        getText: () => validJson,
      },
    } as any;
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(mockEditor);

    const handler = new TimesheetSyncFromRawHandler();

    await expect(handler.execute()).rejects.toThrow("Invalid filename");
  });

  test("sollte Dateinamen in Success-Notification enthalten", async () => {
    const validJson = JSON.stringify({ "2026-10-14": [{ issueKey: "A", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }] });

    const fileName = "/home/user/projects/2026-10-01_2026-10-31.devora-timesheet";
    const mockEditor = {
      document: { fileName, getText: () => validJson },
    } as any;
    vi.spyOn(vscode.window, "activeTextEditor", "get").mockReturnValue(mockEditor);

    const handler = new TimesheetSyncFromRawHandler();
    await handler.execute();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("Timesheet sync successful"),
    );
  });
});
