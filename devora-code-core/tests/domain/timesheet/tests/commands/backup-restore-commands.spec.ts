import { TimesheetBackupHandler, TimesheetRestoreHandler } from "@src/domain/timesheet/commands";
import { afterEach, describe, expect, vi } from "vitest";
import * as vscode from "vscode";
import { test } from "@/support";
import AdmZip from "adm-zip";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Tests für Backup & Restore Commands:
 * - TimesheetBackupHandler: Backup als ZIP erstellen
 * - TimesheetRestoreHandler: Backup aus ZIP wiederherstellen
 */
describe("Backup & Restore Commands", () => {
  afterEach(() => vi.restoreAllMocks());

  // ======================================================================
  // TimesheetBackupHandler
  // ======================================================================

  test("sollte Warnung zeigen wenn keine Daten vorhanden", async ({ fs }) => {
    // Kein seedMonth → storageDir existiert nicht

    vi.spyOn(vscode.workspace.fs, "readDirectory").mockRejectedValue(
      Object.assign(new Error("FileNotFound"), { code: "FileNotFound" }),
    );

    await new TimesheetBackupHandler().execute();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      "[Devora Code]: Keine Timesheet-Daten zum Sichern vorhanden.",
    );
  });

  test("sollte Dialog zeigen und Backup erstellen wenn Daten vorhanden", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "a1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "devora-backup-"));
    const zipPath = join(tmpDir, "backup.zip");

    vi.spyOn(vscode.window, "showSaveDialog").mockResolvedValue({ fsPath: zipPath } as vscode.Uri);

    // writeFile für ZIP-Datei → direkt schreiben, nicht ins InMemoryFs
    const origWriteFile = vscode.workspace.fs.writeFile.bind(vscode.workspace.fs);
    vi.spyOn(vscode.workspace.fs, "writeFile").mockImplementation(async (uri, content) => {
      if (uri.fsPath.endsWith(".zip")) {
        const fs = await import("fs");
        fs.writeFileSync(uri.fsPath, content);
        return;
      }
      return origWriteFile(uri, content);
    });

    await new TimesheetBackupHandler().execute();

    // Dialog wurde aufgerufen
    expect(vscode.window.showSaveDialog).toHaveBeenCalled();

    // Info-Notification
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("Backup erfolgreich erstellt"),
    );

    // ZIP enthält Datei
    const zip = new AdmZip(zipPath);
    expect(zip.getEntries()).toHaveLength(1);
    expect(zip.getEntry("2026-10.json")).not.toBeNull();
  });

  test("sollte Nothing-Op sein wenn Dialog abgebrochen", async ({ fs }) => {
    fs.seedMonth("2026-10", {});

    vi.spyOn(vscode.window, "showSaveDialog").mockResolvedValue(undefined);

    await new TimesheetBackupHandler().execute();

    // Keine Info-Notification → Dialog abgebrochen
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  // ======================================================================
  // TimesheetRestoreHandler
  // ======================================================================

  test("sollte Nothing-Op sein wenn Restore Dialog abgebrochen", async () => {
    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue(undefined);

    await new TimesheetRestoreHandler().execute();

    // Keine Restore-Notification
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  test("sollte Nothing-Op sein wenn Warnung nicht bestaetigt", async ({ fs }) => {
    fs.seedMonth("2026-10", {});

    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue(undefined);
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue(undefined);

    await new TimesheetRestoreHandler().execute();

    // Keine Notification → Restore abgebrochen
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  test("sollte Backup wiederherstellen wenn bestaetigt", async ({ fs }) => {
    // Altes Storage
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "old", issueKey: "OLD-1", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "devora-backup-"));
    const zipPath = join(tmpDir, "restore.zip");

    // ZIP mit neuen Daten erstellen
    const zip = new AdmZip();
    zip.addFile("2026-10.json", Buffer.from(JSON.stringify({
      "2026-10-15": [
        { id: "new", issueKey: "NEW-1", startAt: "2026-10-15T09:00:00", endAt: "2026-10-15T10:00:00" },
      ],
    }, null, 2) + "\n"));
    zip.writeZipSync(zipPath);

    // Dialoge mocken
    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue("Ja, alles überschreiben");
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([{ fsPath: zipPath } as vscode.Uri]);

    await new TimesheetRestoreHandler().execute();

    // Info-Notification
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "[Devora Code]: Backup erfolgreich wiederhergestellt.",
    );

    // Altes Daten weg, neue sind da
    expect(fs.readMonth("2026-10")).toEqual({
      "2026-10-15": [
        { id: "new", issueKey: "NEW-1", startAt: "2026-10-15T09:00:00", endAt: "2026-10-15T10:00:00" },
      ],
    });
  });

  test("sollte mehrere Monate aus ZIP wiederherstellen", async ({ fs }) => {
    const tmpDir = await mkdtemp(join(tmpdir(), "devora-backup-"));
    const zipPath = join(tmpDir, "restore.zip");

    // ZIP mit zwei Monaten
    const zip = new AdmZip();
    zip.addFile("2026-10.json", Buffer.from(JSON.stringify({
      "2026-10-14": [
        { id: "m1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    }, null, 2) + "\n"));
    zip.addFile("2026-11.json", Buffer.from(JSON.stringify({
      "2026-11-01": [
        { id: "m2", issueKey: "PROJ-20", startAt: "2026-11-01T14:00:00", endAt: "2026-11-01T16:00:00" },
      ],
    }, null, 2) + "\n"));
    zip.writeZipSync(zipPath);

    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue("Ja, alles überschreiben");
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([{ fsPath: zipPath } as vscode.Uri]);

    await new TimesheetRestoreHandler().execute();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "[Devora Code]: Backup erfolgreich wiederhergestellt.",
    );

    expect(fs.readMonth("2026-10")).toEqual({
      "2026-10-14": [
        { id: "m1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    });
    expect(fs.readMonth("2026-11")).toEqual({
      "2026-11-01": [
        { id: "m2", issueKey: "PROJ-20", startAt: "2026-11-01T14:00:00", endAt: "2026-11-01T16:00:00" },
      ],
    });
  });

  test("sollte Directory-Entries aus ZIP ignorieren", async ({ fs }) => {
    const tmpDir = await mkdtemp(join(tmpdir(), "devora-backup-"));
    const zipPath = join(tmpDir, "restore.zip");

    // ZIP mit macOS Archive Marker
    const zip = new AdmZip();
    zip.addFile("__MACOSX/empty", Buffer.from(""));
    zip.addFile("2026-10.json", Buffer.from(JSON.stringify({
      "2026-10-20": [
        { id: "d1", issueKey: "DIR-1", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T10:00:00" },
      ],
    }, null, 2) + "\n"));
    zip.writeZipSync(zipPath);

    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue("Ja, alles überschreiben");
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([{ fsPath: zipPath } as vscode.Uri]);

    await new TimesheetRestoreHandler().execute();

    expect(fs.readMonth("2026-10")).toEqual({
      "2026-10-20": [
        { id: "d1", issueKey: "DIR-1", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T10:00:00" },
      ],
    });
  });

  test("sollte leeres ZIP ohne Error verarbeiten", async ({ fs }) => {
    fs.seedMonth("2026-10", {});

    const tmpDir = await mkdtemp(join(tmpdir(), "devora-backup-"));
    const zipPath = join(tmpDir, "restore.zip");

    const zip = new AdmZip();
    zip.writeZipSync(zipPath);

    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue("Ja, alles überschreiben");
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([{ fsPath: zipPath } as vscode.Uri]);

    await new TimesheetRestoreHandler().execute();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "[Devora Code]: Backup erfolgreich wiederhergestellt.",
    );
    expect(fs.listMonths()).toHaveLength(0);
  });
});
