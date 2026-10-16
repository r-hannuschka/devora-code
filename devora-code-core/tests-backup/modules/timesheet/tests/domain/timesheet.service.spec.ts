import { describe, expect } from "vitest";
import type { TimeEntryDTO } from "@/infrastructure/timesheet";
import { test } from "@/tests/core/fixture";

/**
 * TimesheetService testet die Geschäftslogik zwischen Repository und Commands:
 * - addEntry: TimeEntry erstellen + via Repository schreiben
 * - getDay: Eintraege eines Tages + Duration-Berechnung
 * - getPeriod: Eintraege ueber Zeitraum + Duration-Summe
 * - getByIssueKey: Filtern + nach Datum gruppieren + sortieren
 * - getMonth: Kompletten Monat lesen
 * - splitActiveTimer: Laufenden Timer aufteilen + globalState aktualisieren
 */
describe("TimesheetService", () => {
  // ========================================================================
  // addEntry
  // ========================================================================

  test("sollte manuellen Eintrag ueber Repository speichern", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {});

    const result = await timesheetService.addEntry("MEET-1", "2026-10-15T10:00:00", "2026-10-15T11:30:00");

    expect(result.length).toBe(1);
    expect(result[0]?.issueKey).toBe("MEET-1");
    expect(result[0]?.startAt).toBe("2026-10-15T10:00:00");
    expect(result[0]?.endAt).toBe("2026-10-15T11:30:00");
    expect(result[0]?.id).toBeDefined();

    // Prüfen dass Repository geschrieben hat
    const monthData = fs.readMonth("2026-10")!;
    expect(monthData["2026-10-15"]).toHaveLength(1);
  });

  test("sollte Eintrag ueber Mitternacht aufteilen", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {});

    const result = await timesheetService.addEntry("PROJ-1", "2026-10-15T22:00:00", "2026-10-16T02:00:00");

    expect(result.length).toBe(2);
    // Erster Eintrag: 22:00 bis 23:59:59
    expect(result[0]?.startAt).toBe("2026-10-15T22:00:00");
    // Zweiter Eintrag: 00:00 bis 02:00
    expect(result[1]?.startAt).toBe("2026-10-16T00:00:00");
    expect(result[1]?.endAt).toBe("2026-10-16T02:00:00");
  });

  // ========================================================================
  // getDay
  // ========================================================================

  test("sollte Eintraege eines Tages zurueckgeben", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
        { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:30:00" },
      ],
    });

    const result = await timesheetService.getDay("2026-10-14");

    expect(result.entries.length).toBe(2);
    expect(result.count).toBe(2);
    expect(result.totalSeconds).toBe(3.5 * 3600); // 1h + 2.5h = 3.5h
  });

  test("sollte leeren Tag korrekt behandeln", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {});

    const result = await timesheetService.getDay("2026-10-20");

    expect(result.entries).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });

  // ========================================================================
  // getByIssueKey
  // ========================================================================

  test("sollte Eintraege nach Issue gruppieren und sortieren", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-10": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-10T09:00:00", endAt: "2026-10-10T10:00:00" }],
      "2026-10-14": [
        { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:00:00" },
        { id: "3", issueKey: "PROJ-10", startAt: "2026-10-14T17:00:00", endAt: "2026-10-14T18:00:00" },
      ],
      "2026-10-05": [{ id: "4", issueKey: "PROJ-10", startAt: "2026-10-05T09:00:00", endAt: "2026-10-05T12:00:00" }],
    });

    const result = await timesheetService.getByIssueKey("PROJ-10");

    // 3 Eintraege auf 2 Tage gruppiert, sortiert nach Datum
    expect(result.length).toBe(3);

    // Erstes Datum (fruester)
    expect(result[0]?.date).toBe("2026-10-05");
    expect(result[0]?.entries).toHaveLength(1);
    expect(result[0]?.entries[0]?.id).toBe("4");

    // Zweites Datum (spaeter)
    expect(result[1]?.date).toBe("2026-10-10");
    expect(result[1]?.entries).toHaveLength(1);
    expect(result[1]?.entries[0]?.id).toBe("1");

    // Zweites Datum (spaeter)
    expect(result[2]?.date).toBe("2026-10-14");
    expect(result[2]?.entries).toHaveLength(1);
    expect(result[2]?.entries[0]?.id).toBe("3");
  });

  test("sollte leere Gruppe zurueckgeben wenn Issue nicht gefunden", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }],
    });

    const result = await timesheetService.getByIssueKey("NONEXIST");

    expect(result).toEqual([]);
  });

  // ========================================================================
  // getMonth
  // ========================================================================

  test("sollte kompletten Monat zurueckgeben", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-01": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-01T09:00:00", endAt: "2026-10-01T10:00:00" }],
      "2026-10-15": [{ id: "2", issueKey: "PROJ-20", startAt: "2026-10-15T14:00:00", endAt: "2026-10-15T16:00:00" }],
    });

    const result = await timesheetService.getMonth("2026-10");

    expect(result["2026-10-01"]).toHaveLength(1);
    expect(result["2026-10-15"]).toHaveLength(1);
    expect(Object.keys(result).length).toBe(2);
  });

  test("sollte leeres Objekt zurueckgeben wenn Monat leer", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {});

    const result = await timesheetService.getMonth("2026-10");

    expect(result).toEqual({});
  });

  // ========================================================================
  // getRaw
  // ========================================================================

  test("sollte nur den angefragten Tag zurueckgeben", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-10": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-10T09:00:00", endAt: "2026-10-10T10:00:00" }],
      "2026-10-14": [
        { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:30:00" },
        { id: "3", issueKey: "PROJ-30", startAt: "2026-10-14T17:00:00", endAt: "2026-10-14T18:00:00" },
      ],
      "2026-10-20": [{ id: "4", issueKey: "PROJ-40", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T12:00:00" }],
    });

    const result = await timesheetService.getRaw("2026-10-14", "2026-10-14");

    // Nur der angefragte Tag soll enthalten sein
    expect(Object.keys(result)).toHaveLength(1);
    expect(result["2026-10-14"]).toHaveLength(2);
  });

  test("sollte mehrere Tage filtern, nicht ganzen Monat", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-10": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-10T09:00:00", endAt: "2026-10-10T10:00:00" }],
      "2026-10-14": [{ id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:30:00" }],
      "2026-10-15": [{ id: "3", issueKey: "PROJ-30", startAt: "2026-10-15T09:00:00", endAt: "2026-10-15T12:00:00" }],
      "2026-10-20": [{ id: "4", issueKey: "PROJ-40", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T12:00:00" }],
    });

    const result = await timesheetService.getRaw("2026-10-14", "2026-10-15");

    expect(Object.keys(result)).toHaveLength(2);
    expect(result["2026-10-14"]).toHaveLength(1);
    expect(result["2026-10-15"]).toHaveLength(1);
    expect(result).not.toHaveProperty("2026-10-10");
    expect(result).not.toHaveProperty("2026-10-20");
  });

  test("sollte offenen Timer vom Vormonat mitliefern wenn exakt einen Tag abgefragt", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-09", {
      "2026-09-30": [{ id: "1", issueKey: "OPEN", startAt: "2026-09-30T09:00:00", endAt: null }],
    });
    fs.seedMonth("2026-10", {
      "2026-10-01": [{ id: "2", issueKey: "CLOSED", startAt: "2026-10-01T09:00:00", endAt: "2026-10-01T10:00:00" }],
    });

    const result = await timesheetService.getRaw("2026-10-01", "2026-10-01");

    // Nur der 1. Okt + den offenen Timer vom Vormonat
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["2026-10-01"]).toHaveLength(1);
    expect(result["2026-09-30"]).toHaveLength(1);
    expect(result["2026-09-30"]?.[0]?.endAt).toBeNull();
  });

  // ========================================================================
  // splitActiveTimer
  // ========================================================================

  test("sollte laufenden Timer dazwischen aufteilen", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null }, // active Timer
      ],
    });

    // Set active timer in globalState
    await timesheetService["context"].globalState.update("activeTimeEntry", {
      id: "1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    const insertion = { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T11:00:00" };
    const activeSource = { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null };

    const result = await timesheetService.splitActiveTimer(insertion, activeSource);

    // 3 Eintraege: vor Insertion, insertion, nach Insertion
    expect(result.length).toBe(3);

    // Erster: active Timer bis 10:00
    expect(result[0]?.issueKey).toBe("PROJ-10");
    expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");

    // Zweiter: die Insertion
    expect(result[1]?.issueKey).toBe("PROJ-20");
    expect(result[1]?.startAt).toBe("2026-10-14T10:00:00");
    expect(result[1]?.endAt).toBe("2026-10-14T11:00:00");

    // Dritter: active Timer ab 11:00 (wieder offen)
    expect(result[2]?.issueKey).toBe("PROJ-10");
    expect(result[2]?.startAt).toBe("2026-10-14T11:00:00");
    expect(result[2]?.endAt).toBeNull();

    // globalState soll neuen aktiven Timer halten
    const persistedActive = await timesheetService["context"].globalState.get("activeTimeEntry") as TimeEntryDTO;
    expect(persistedActive.issueKey).toBe("PROJ-10");
    expect(persistedActive.startAt).toBe("2026-10-14T11:00:00");
    expect(persistedActive.endAt).toBeNull();
  });

  test("sollte Error werfen wenn Timer schon beendet", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {});

    const insertion = { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T10:00:00", endAt: "2026-10-14T11:00:00" };
    const endedSource = { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T09:30:00" };

    await expect(timesheetService.splitActiveTimer(insertion, endedSource)).rejects.toThrow("Aktiver Timer wurde schon beendet");
  });

  test("sollte Error werfen wenn Insertion kein Ende hat", async ({ timesheetService, fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    await timesheetService["context"].globalState.update("activeTimeEntry", {
      id: "1",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    const openInsertion = { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T10:00:00", endAt: null };
    const activeSource = { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null };

    await expect(timesheetService.splitActiveTimer(openInsertion, activeSource)).rejects.toThrow(
      "Eintrag konnte nicht dazwischen geschoben werden da das Ende Datum fehlt",
    );
  });
});
