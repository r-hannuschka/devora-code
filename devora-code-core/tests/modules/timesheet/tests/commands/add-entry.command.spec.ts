import { AddEntryHandler } from "@/domain/timesheet";
import { test } from "@/tests/core/fixture";
import type { TimesheetAddEntryCommand } from "@devora-code/api/timesheet";
import { describe, expect } from "vitest";

/**
 * AddEntryHandler testet die Kollisionslogik des Commands:
 * - NONE: Kein Konflikt → Eintrag wird erstellt
 * - BLOCK: Geschlossene Buchung kollidiert → Error
 * - SPLIT: Laufender Timer → Eintrag wird dazwischen geschoben
 */
describe("AddEntryHandler", () => {
  // ========================================================================
  // NONE — Kein Konflikt
  // ========================================================================

  test("sollte Eintrag erstellen wenn keine Kollision", async ({ fs }) => {
    fs.seedMonth("2026-10", {});

    const command: TimesheetAddEntryCommand = {
      id: "add-1",
      type: "timesheet:add-entry",
      payload: { issueKey: "PROJ-42", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T11:00:00" },
    };

    const handler = new AddEntryHandler(command);
    const result = await handler.execute();

    expect(result).toBeDefined();
    expect(result[0]?.issueKey).toBe("PROJ-42");
    expect(result[0]?.startAt).toBe("2026-10-14T10:00:00");
    expect(result[0]?.endAt).toBe("2026-10-14T11:00:00");
    expect(fs.readMonth("2026-10")).toMatchObject({
      "2026-10-14": [expect.objectContaining({ issueKey: "PROJ-42" })],
    });
  });

  // ========================================================================
  // BLOCK — Geschlossene Buchung kollidiert
  // ========================================================================

  test("sollte fehlschlagen bei geschlossener Kollision (BLOCK)", async ({ fs }) => {
    // Bestehender Eintrag mit Ende-Zeit
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "existing", issueKey: "BLOCK-TASK", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:30:00" }],
    });

    // Neuer Eintrag überlappt mit bestehendem
    const command: TimesheetAddEntryCommand = {
      id: "add-2",
      type: "timesheet:add-entry",
      payload: { issueKey: "PROJ-42", startAt: "2026-10-14T09:30:00", endAt: "2026-10-14T11:00:00" },
    };

    const handler = new AddEntryHandler(command);
    await expect(handler.execute()).rejects.toThrow(
      "[Timetracker]: Zeitkonflikt: Der Eintrag überschneidet sich mit einer Buchung für: BLOCK-TASK",
    );
  });

  // ========================================================================
  // SPLIT — Laufender Timer, Eintrag wird dazwischen geschoben
  // ========================================================================

  test("sollte SPLIT produzieren wenn neuer Eintrag IN ZUKUNFT eines laufenden Timers liegt", async ({ fs, vscodeContext }) => {
    // Running timer mit endAt=null
    const existingId = "active-id";
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: existingId, issueKey: "RUNNING-TASK", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    await vscodeContext.globalState.update("activeTimeEntry", {
      id: existingId,
      issueKey: "RUNNING-TASK",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    // Neuer Eintrag in die Zukunft des laufenden Timers
    const command: TimesheetAddEntryCommand = {
      id: "add-3",
      type: "timesheet:add-entry",
      payload: { issueKey: "MEETING-1", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T10:30:00" },
    };

    const handler = new AddEntryHandler(command);
    const result = await handler.execute();

    // 3 Einträge: 1. Timer bis Meeting, 2. Meeting, 3. Timer nach Meeting
    expect(result.length).toBe(3);

    // Erster Eintrag: running Timer bis Meeting-Start
    expect(result[0]?.id).toBe(existingId);
    expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");

    // Zweiter Eintrag: der Meeting-Eintrag
    expect(result[1]?.issueKey).toBe("MEETING-1");
    expect(result[1]?.startAt).toBe("2026-10-14T10:00:00");
    expect(result[1]?.endAt).toBe("2026-10-14T10:30:00");

    // Dritter Eintrag: neuer Timer nach Meeting
    expect(result[2]?.endAt).toBeNull();
    expect(result[2]?.startAt).toBe("2026-10-14T10:30:00");
    expect(result[2]?.issueKey).toBe("RUNNING-TASK");
  });

  // ========================================================================
  // Edge Case — Mehrere Tage (Mitternacht)
  // ========================================================================

  test("sollte Eintraege ueber Mitternacht aufteilen", async ({ fs }) => {
    fs.seedMonth("2026-10", {});
    fs.seedMonth("2026-11", {});

    const command: TimesheetAddEntryCommand = {
      id: "add-4",
      type: "timesheet:add-entry",
      payload: { issueKey: "PROJ-42", startAt: "2026-10-31T22:00:00", endAt: "2026-11-01T02:00:00" },
    };

    const handler = new AddEntryHandler(command);
    const result = await handler.execute();

    expect(result.length).toBe(2);
    expect(result[0]?.endAt).toBe("2026-10-31T23:59:59");
    expect(result[1]?.startAt).toBe("2026-11-01T00:00:00");
    expect(fs.readMonth("2026-10")).toMatchObject({
      "2026-10-31": [expect.objectContaining({ issueKey: "PROJ-42" })],
    });
    expect(fs.readMonth("2026-11")).toMatchObject({
      "2026-11-01": [expect.objectContaining({ issueKey: "PROJ-42" })],
    });
  });
});
