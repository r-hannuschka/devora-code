import type { TimeEntryDTO } from "@/infrastructure/timesheet";
import type { TimesheetAddEntryCommand } from "@devora-code/api/timesheet";
import { AddEntryHandler } from "@src/domain/timesheet/commands";
import { describe, expect } from "vitest";
import { test } from "../../fixtures/test.fixture";

describe("add-entry — Session Split", () => {
  // ========================================================================
  // Timer VOR dem Eintrag (Mitternacht) — Bug #2
  // ========================================================================

  test("sollte Session splitten wenn Timer VOR dem neuen Eintrag startet (Mitternacht)", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "SESSION-TASK",
      startAt: "2026-10-14T20:29:26",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "SESSION-TASK", startAt: "2026-10-14T20:29:26", endAt: null }],
    });

    const command: TimesheetAddEntryCommand = {
      id: "meeting-1",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-15T00:00:00", endAt: "2026-10-15T00:30:00" },
    };

    const result = await new AddEntryHandler(command).execute();

    expect(result.length).toBe(3);
    expect(result[0]?.id).toBe("active-1");
    expect(result[0]?.endAt).toBe("2026-10-15T00:00:00");
    expect(result[1]?.issueKey).toBe("Meeting");
    expect(result[1]?.endAt).toBe("2026-10-15T00:30:00");
    expect(result[2]?.issueKey).toBe("SESSION-TASK");
    expect(result[2]?.startAt).toBe("2026-10-15T00:30:00");
    expect(result[2]?.endAt).toBeNull();
  });

  // ========================================================================
  // Timer und Eintrag — gleicher Tag, Eintrag dazwischen
  // ========================================================================

  test("sollte Session splitten wenn Eintrag mitten im Timer liegt (gleicher Tag)", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    const command: TimesheetAddEntryCommand = {
      id: "meeting-2",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T10:30:00" },
    };

    const result = await new AddEntryHandler(command).execute();

    expect(result.length).toBe(3);
    expect(result[0]?.id).toBe("active-1");
    expect(result[0]?.issueKey).toBe("PROJ-10");
    expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");

    expect(result[1]?.issueKey).toBe("Meeting");
    expect(result[1]?.startAt).toBe("2026-10-14T10:00:00");
    expect(result[1]?.endAt).toBe("2026-10-14T10:30:00");

    expect(result[2]?.issueKey).toBe("PROJ-10");
    expect(result[2]?.startAt).toBe("2026-10-14T10:30:00");
    expect(result[2]?.endAt).toBeNull();
  });

  // ========================================================================
  // Eintrag STARTET BEVOR der Timer startet — keine Kollision
  // ========================================================================

  test("sollte keinen Split erzeugen wenn Eintrag VOR dem Timer startet", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T14:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T14:00:00", endAt: null }],
    });

    // Meeting 09:00–10:00, Timer startet erst 14:00
    const command: TimesheetAddEntryCommand = {
      id: "meeting-3",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
    };

    const result = await new AddEntryHandler(command).execute();

    // 1 Eintrag: Meeting wird geschrieben, Timer wird nicht gefunden (startet NACH Meeting)
    // addEntry schreibt nur den neuen Eintrag, nicht den existierenden Timer
    expect(result.length).toBe(1);
    expect(result[0]?.issueKey).toBe("Meeting");
    expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");
  });

  // ========================================================================
  // Eintrag ENDET VOR dem Timer — keine Kollision
  // ========================================================================

  test("sollte keinen Split erzeugen wenn Eintrag VOR dem Timer endet", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T14:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T14:00:00", endAt: null }],
    });

    // Meeting 12:00–13:00, Timer startet erst 14:00
    const command: TimesheetAddEntryCommand = {
      id: "meeting-4",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T12:00:00", endAt: "2026-10-14T13:00:00" },
    };

    const result = await new AddEntryHandler(command).execute();

    // 1 Eintrag: Meeting wird geschrieben, Timer nicht gefunden
    expect(result.length).toBe(1);
    expect(result[0]?.issueKey).toBe("Meeting");
    expect(result[0]?.endAt).toBe("2026-10-14T13:00:00");
  });

  // ========================================================================
  // Timer UND Eintrag — Eintrag enthält Timer komplett
  // ========================================================================

  test("sollte Timer vollständig umschließen wenn Eintrag Timer enthält", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    // Meeting 10:00–12:00, Timer 09:00–null → Timer umschließt Meeting NICHT
    // Meeting ist NACH Timer-Start → SPLIT
    const command: TimesheetAddEntryCommand = {
      id: "meeting-5",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T12:00:00" },
    };

    const result = await new AddEntryHandler(command).execute();

    expect(result.length).toBe(3);
    // Timer bis 10:00
    expect(result[0]?.issueKey).toBe("PROJ-10");
    expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");
    // Meeting
    expect(result[1]?.issueKey).toBe("Meeting");
    expect(result[1]?.endAt).toBe("2026-10-14T12:00:00");
    // Timer ab 12:00 offen
    expect(result[2]?.issueKey).toBe("PROJ-10");
    expect(result[2]?.startAt).toBe("2026-10-14T12:00:00");
    expect(result[2]?.endAt).toBeNull();
  });

  // ========================================================================
  // Collision Prio: geschlossener Eintrag VOR offenem Timer
  // ========================================================================

  test("sollte BLOCK vor SPLIT schlagen wenn geschlossener Eintrag kollidiert", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null },
        { id: "closed-1", issueKey: "BLOCKED", startAt: "2026-10-14T09:30:00", endAt: "2026-10-14T10:00:00" },
      ],
    });

    // Meeting 09:15–10:30 — kollidiert mit geschlossenem Eintrag (09:30–10:00)
    const command: TimesheetAddEntryCommand = {
      id: "meeting-6",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T09:15:00", endAt: "2026-10-14T10:30:00" },
    };

    await expect(new AddEntryHandler(command).execute()).rejects.toThrow("Zeitkonflikt");
  });

  // ========================================================================
  // Mitternacht — Timer erstreckt sich über mehrere Tage
  // ========================================================================

  test("sollte Mitternacht-Split korrekt behandeln", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "NIGHT-1",
      startAt: "2026-10-14T22:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "NIGHT-1", startAt: "2026-10-14T22:00:00", endAt: null }],
    });

    // Meeting 23:00–23:30 AM gleichen Tag (noch im Timer)
    const command: TimesheetAddEntryCommand = {
      id: "meeting-7",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T23:00:00", endAt: "2026-10-14T23:30:00" },
    };

    const result = await new AddEntryHandler(command).execute();

    expect(result.length).toBe(3);
    expect(result[0]?.issueKey).toBe("NIGHT-1");
    expect(result[0]?.endAt).toBe("2026-10-14T23:00:00");
    expect(result[1]?.issueKey).toBe("Meeting");
    expect(result[1]?.endAt).toBe("2026-10-14T23:30:00");
    expect(result[2]?.issueKey).toBe("NIGHT-1");
    expect(result[2]?.startAt).toBe("2026-10-14T23:30:00");
    expect(result[2]?.endAt).toBeNull();
  });

  // ========================================================================
  // Erster Timer wird beendet, zweiter läuft weiter
  // ========================================================================

  test("sollte globalState korrekt aktualisieren nach Split", async ({ fs, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    const command: TimesheetAddEntryCommand = {
      id: "meeting-8",
      type: "timesheet:add-entry",
      payload: { issueKey: "Meeting", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T10:30:00" },
    };

    await new AddEntryHandler(command).execute();

    // globalState muss den NEUEN offenen Timer enthalten (nach dem Meeting)
    const persisted = vscodeContext.globalState.get("activeTimeEntry") as TimeEntryDTO;
    expect(persisted).toBeDefined();
    expect(persisted.issueKey).toBe("PROJ-10");
    expect(persisted.startAt).toBe("2026-10-14T10:30:00");
    expect(persisted.endAt).toBeNull();
  });
});
