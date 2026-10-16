import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

/**
 * TimesheetService.syncFromRaw testet das Zusammenführen von rohen Times-Daten:
 * - Einträge werden nach YYYY-MM gruppiert
 * - Bestehende Daten im Repository werden nicht gelöscht, sondern erweitert
 * - Cross-Month: Einträge über mehrere Monate werden korrekt aufgeteilt
 */
describe("TimesheetService.syncFromRaw", () => {
  // ========================================================================
  // Grundfunktionalitaet — Single Date
  // ========================================================================

  test("sollte Raw-Eintrag im Repository speichern", async ({ timesheetService, fs }) => {
    const raw = {
      "2026-10-14": [
        { issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    };

    const result = await timesheetService.syncFromRaw(raw);

    const monthData = fs.readMonth("2026-10")!;
    expect(monthData).toHaveProperty("2026-10-14");
    expect(monthData["2026-10-14"]).toHaveLength(1);
    expect(monthData["2026-10-14"][0]?.issueKey).toBe("PROJ-10");
    expect(Array.isArray(result)).toBe(true);
  });

  // ========================================================================
  // Grundfunktionaltaet — Multiple Dates Same Month
  // ========================================================================

  test("sollte mehrere Einträge eines Monats zusammenfassen", async ({ timesheetService, fs }) => {
    const raw = {
      "2026-10-14": [
        { issueKey: "MEETING", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
      "2026-10-15": [
        { issueKey: "DEV", startAt: "2026-10-15T14:00:00", endAt: "2026-10-15T16:00:00" },
      ],
    };

    const result = await timesheetService.syncFromRaw(raw);

    const octData = fs.readMonth("2026-10")!;
    expect(Object.keys(octData)).toHaveLength(2);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("MEETING");
    expect(octData["2026-10-15"][0]?.issueKey).toBe("DEV");
    expect(result.length).toBe(1); // 1 write per month
  });

  // ========================================================================
  // Cross-Month — Einträge über mehrere Monate
  // ========================================================================

  test("sollte Einträge über mehrere Monate korrekt aufteilen", async ({ timesheetService, fs }) => {
    const raw = {
      "2026-10-31": [
        { issueKey: "NIGHT", startAt: "2026-10-31T20:00:00", endAt: "2026-10-31T23:00:00" },
      ],
      "2026-11-01": [
        { issueKey: "NEXT_DAY", startAt: "2026-11-01T09:00:00", endAt: "2026-11-01T10:00:00" },
      ],
    };

    await timesheetService.syncFromRaw(raw);

    // Oktober: nur der 31.
    const octData = fs.readMonth("2026-10");
    expect(octData).not.toBeUndefined();
    expect(octData!["2026-10-31"][0]?.issueKey).toBe("NIGHT");

    // November: nur der 1.
    const novData = fs.readMonth("2026-11");
    expect(novData).not.toBeUndefined();
    expect(novData!["2026-11-01"][0]?.issueKey).toBe("NEXT_DAY");

    // Kein Cross-Month-File: keine Einträge aus 10. in 11. oder umgekehrt
    expect(novData).not.toHaveProperty("2026-10-31");
    expect(octData).not.toHaveProperty("2026-11-01");
  });

  // ========================================================================
  // Merge — bestehende Daten werden pro Tag überschrieben
  // ========================================================================

  test("sollte bestehende Repository-Eintraege pro Tag überschreiben", async ({ timesheetService, fs }) => {
    // 1. Bestehende Daten im Repository anlegen
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "existing", issueKey: "OLD-ENTRY", startAt: "2026-10-14T07:00:00", endAt: "2026-10-14T08:00:00" },
      ],
    });

    // 2. Sync mit neuen Daten für denselben Tag
    const raw = {
      "2026-10-14": [
        { issueKey: "NEW-ENTRY", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    };

    await timesheetService.syncFromRaw(raw);

    // 3. SyncFromRaw überschreibt existing date-keys vollständig (Spread-Operator)
    const octData = fs.readMonth("2026-10")!;
    expect(octData["2026-10-14"]).toHaveLength(1);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("NEW-ENTRY");
  });

  test("sollte Eintraege an neuen Tagen zum bestehenden Monat hinzufuegen", async ({ timesheetService, fs }) => {
    // 1. Bestehende Daten im Repository anlegen
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "existing", issueKey: "OLD-ENTRY", startAt: "2026-10-14T07:00:00", endAt: "2026-10-14T08:00:00" },
      ],
    });

    // 2. Sync mit neuen Daten für einen NEUEN Tag im selben Monat
    const raw = {
      "2026-10-20": [
        { issueKey: "NEW-ENTRY", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T10:00:00" },
      ],
    };

    await timesheetService.syncFromRaw(raw);

    // 3. ALTE Einträge bleiben, NEUE kommen hinzu
    const octData = fs.readMonth("2026-10")!;
    expect(Object.keys(octData)).toHaveLength(2);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("OLD-ENTRY");
    expect(octData["2026-10-20"][0]?.issueKey).toBe("NEW-ENTRY");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte leeres Object als Nothing-Op behandeln", async ({ timesheetService, fs }) => {
    const raw = {};

    const result = await timesheetService.syncFromRaw(raw);

    expect(result.length).toBe(0);
  });

  test("sollte leere Einträge-Arrays speichern", async ({ timesheetService, fs }) => {
    const raw = {
      "2026-10-14": [],
    };

    await timesheetService.syncFromRaw(raw);

    const octData = fs.readMonth("2026-10");
    expect(octData).not.toBeUndefined();
    expect(octData!["2026-10-14"]).toEqual([]);
  });

  // ========================================================================
  // Multiple Dates Same Day Different Issues
  // ========================================================================

  test("sollte mehrere Eintraege am selben Tag zusammenfassen", async ({ timesheetService, fs }) => {
    const raw = {
      "2026-10-14": [
        { issueKey: "PROJ-A", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
        { issueKey: "PROJ-B", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T15:00:00" },
      ],
    };

    await timesheetService.syncFromRaw(raw);

    const octData = fs.readMonth("2026-10")!;
    expect(octData["2026-10-14"]).toHaveLength(2);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("PROJ-A");
    expect(octData["2026-10-14"][1]?.issueKey).toBe("PROJ-B");
  });
});
