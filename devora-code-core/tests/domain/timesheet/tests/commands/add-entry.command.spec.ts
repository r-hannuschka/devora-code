import type { TimesheetAddEntryCommand } from "@devora-code/api/timesheet";
import { AddEntryHandler } from "@src/domain/timesheet/commands";
import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

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

  test("sollte SPLIT im Repository produzieren", async ({ fs }) => {
    // Running timer mit endAt=null
    const existingId = "active-id";
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: existingId, issueKey: "RUNNING-TASK", startAt: "2026-10-14T09:00:00", endAt: null }],
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

  test("sollte Session-State nach SPLIT aktualisieren", async ({ fs, sessionService }) => {
    const existingId = "active-id";
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: existingId, issueKey: "RUNNING-TASK", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    const command: TimesheetAddEntryCommand = {
      id: "add-3",
      type: "timesheet:add-entry",
      payload: { issueKey: "MEETING-1", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T10:30:00" },
    };

    const handler = new AddEntryHandler(command);
    const result = await handler.execute();

    // Session-State zeigt den neuen Timer (3. Eintrag, nicht den alten)
    const active = sessionService.getActiveTimer();
    expect(active).not.toBeNull();
    expect(active?.entry.id).toBeDefined();
    expect(active?.entry?.id).toBe(result[2]?.id);
  });

  // ========================================================================
  // Integration — Active Session + AddEntry
  // ========================================================================

  test("sollte bei aktivem Timer + neuem Entry EXAKT 3 Eintraege im Timesheet produzieren", async ({
    fs,
    sessionService,
    timesheetService,
  }) => {
    // Aktiver Timer läuft bereits
    const activeId = "active-running";
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: activeId, issueKey: "RUNNING-TASK", startAt: "2026-10-14T09:00:00", endAt: null },
      ],
    });

    // Session-State initialisieren
    await sessionService.setActiveSession({
      id: activeId,
      issueKey: "RUNNING-TASK",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    // Neuen Entry hinzufügen (triggered SPLIT)
    const command: TimesheetAddEntryCommand = {
      id: "add-integration",
      type: "timesheet:add-entry",
      payload: { issueKey: "MEETING-INT", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T15:00:00" },
    };

    const handler = new AddEntryHandler(command);
    await handler.execute();

    // Timesheet auslesen — EXAKT 3 Einträge
    const day = await timesheetService.getDay("2026-10-14");
    expect(day.entries.length).toBe(3);

    // 1. Running Timer bis Meeting (Original-ID erhalten)
    expect(day.entries[0]?.id).toBe(activeId);
    expect(day.entries[0]?.issueKey).toBe("RUNNING-TASK");
    expect(day.entries[0]?.startAt).toBe("2026-10-14T09:00:00");
    expect(day.entries[0]?.endAt).toBe("2026-10-14T14:00:00");

    // 2. Meeting-Eintrag
    expect(day.entries[1]?.issueKey).toBe("MEETING-INT");
    expect(day.entries[1]?.startAt).toBe("2026-10-14T14:00:00");
    expect(day.entries[1]?.endAt).toBe("2026-10-14T15:00:00");

    // 3. Neuer Running Timer nach Meeting (endAt=null)
    expect(day.entries[2]?.issueKey).toBe("RUNNING-TASK");
    expect(day.entries[2]?.startAt).toBe("2026-10-14T15:00:00");
    expect(day.entries[2]?.endAt).toBeNull();

    // Session-State: der neue Timer (3. Eintrag) muss active sein
    const active = sessionService.getActiveTimer();
    expect(active?.entry.id).toBe(day.entries[2]?.id);
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
