import { test } from "@/support";
import type { TimesheetOpenCommand } from "@devora-code/api/timesheet";
import * as vscode from "vscode";
import { afterEach, describe, expect, vi } from "vitest";
import { TimesheetOpenHandler } from "@src/domain/timesheet/commands";

/**
 * TimesheetOpenHandler testet den Kommando-Flow:
 * - service.getRaw() wird aufgerufen
 * - JSON mit stripped IDs wird generiert
 * - Datei im Workspace unter .timesheets/ geschrieben und geoeffnet
 */
describe("TimesheetOpenHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  // ========================================================================
  // Grundfunktionalitaet
  // ========================================================================

  test("sollte rohes JSON (IDs stripped) im Editor oeffnen", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "uuid-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
        { id: "uuid-2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:30:00" },
      ],
    });
    fs.dirs.add("/dev/null/.timesheets");

    let capturedBuffer = Buffer.from([]);
    const writeSpy = vi
      .spyOn(vscode.workspace.fs, "writeFile")
      .mockImplementation(async (_, buf) => { capturedBuffer = Buffer.from(buf); });

    await new TimesheetOpenHandler({
      id: "open-1",
      type: "timesheet:open",
      payload: { startAt: "2026-10-14", endAt: "2026-10-14" },
    }).execute();

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const written = JSON.parse(capturedBuffer.toString());
    expect(written["2026-10-14"]).toHaveLength(2);
    expect(written["2026-10-14"][0]).not.toHaveProperty("id");
    expect(written["2026-10-14"][0].issueKey).toBe("PROJ-10");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte leeres JSON oeffnen wenn Zeitraum leer ist", async ({ fs }) => {
    fs.seedMonth("2026-10", {});
    fs.dirs.add("/dev/null/.timesheets");

    let capturedBuffer = Buffer.from([]);
    const writeSpy = vi
      .spyOn(vscode.workspace.fs, "writeFile")
      .mockImplementation(async (_, buf) => { capturedBuffer = Buffer.from(buf); });

    await new TimesheetOpenHandler({
      id: "open-2",
      type: "timesheet:open",
      payload: { startAt: "2026-10-14", endAt: "2026-10-16" },
    }).execute();

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(capturedBuffer.toString()).toBe("{}");
  });

  test("sollte JSON ueber mehrere Tage zusammenfassen", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "uuid-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }],
    });
    fs.seedMonth("2026-11", {
      "2026-11-01": [{ id: "uuid-2", issueKey: "PROJ-20", startAt: "2026-11-01T14:00:00", endAt: "2026-11-01T16:00:00" }],
    });
    fs.dirs.add("/dev/null/.timesheets");

    let capturedBuffer = Buffer.from([]);
    const writeSpy = vi
      .spyOn(vscode.workspace.fs, "writeFile")
      .mockImplementation(async (_, buf) => { capturedBuffer = Buffer.from(buf); });

    await new TimesheetOpenHandler({
      id: "open-3",
      type: "timesheet:open",
      payload: { startAt: "2026-10-14", endAt: "2026-11-01" },
    }).execute();

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const written = JSON.parse(capturedBuffer.toString());
    expect(Object.keys(written)).toContain("2026-10-14");
    expect(Object.keys(written)).toContain("2026-11-01");
  });

  // ========================================================================
  // Active Timer (endAt = null)
  // ========================================================================

  test("sollte offenen Timer (endAt=null) im Roh-JSON enthalten", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "RUNNING", startAt: "2026-10-14T09:00:00", endAt: null }],
    });
    fs.dirs.add("/dev/null/.timesheets");

    let capturedBuffer = Buffer.from([]);
    const writeSpy = vi
      .spyOn(vscode.workspace.fs, "writeFile")
      .mockImplementation(async (_, buf) => { capturedBuffer = Buffer.from(buf); });

    await new TimesheetOpenHandler({
      id: "open-4",
      type: "timesheet:open",
      payload: { startAt: "2026-10-14", endAt: "2026-10-14" },
    }).execute();

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const written = JSON.parse(capturedBuffer.toString());
    expect(written["2026-10-14"][0].endAt).toBeNull();
    expect(written["2026-10-14"][0]).not.toHaveProperty("id");
  });
});
