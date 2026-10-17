import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

/**
 * TimesheetService.syncFromRaw testet das Zusammenführen von rohen Times-Daten:
 * - Range aus dem Parameter wird verwendet: alle Tage in der Range werden aus der DB gelöscht
 * - Dann werden die Raw-Daten überschreibend eingetragen
 * - Tage außerhalb der Range bleiben unverändert
 * - Der Service schreibt pro Sync nur den Monat, der durch range.minDate bestimmt ist
 *   (format(range.minDate, 'yyyy-MM')) — Cross-Month muss der Caller split-en
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
    const range = { minDate: "2026-10-14", maxDate: "2026-10-14" };

    await timesheetService.syncFromRaw(raw, range);

    const monthData = fs.readMonth("2026-10")!;
    expect(monthData).toHaveProperty("2026-10-14");
    expect(monthData["2026-10-14"]).toHaveLength(1);
    expect(monthData["2026-10-14"][0]?.issueKey).toBe("PROJ-10");
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
    const range = { minDate: "2026-10-14", maxDate: "2026-10-15" };

    await timesheetService.syncFromRaw(raw, range);

    const octData = fs.readMonth("2026-10")!;
    expect(Object.keys(octData)).toHaveLength(2);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("MEETING");
    expect(octData["2026-10-15"][0]?.issueKey).toBe("DEV");
  });

  // ========================================================================
  // Range-Replace — bestehende Tage in der Range werden gelöscht
  // ========================================================================

  test("sollte Eintraege in der Range loeschen die nicht im Raw sind", async ({ timesheetService, fs }) => {
    // 1. Bestehende Daten im Repository anlegen
    fs.seedMonth("2026-10", {
      "2026-10-12": [
        { id: "should-stay", issueKey: "OLD-BEFORE", startAt: "2026-10-12T07:00:00", endAt: "2026-10-12T08:00:00" },
      ],
      "2026-10-14": [
        { id: "old-entry", issueKey: "OLD-ENTRY", startAt: "2026-10-14T07:00:00", endAt: "2026-10-14T08:00:00" },
      ],
      "2026-10-15": [
        { id: "should-go", issueKey: "OLD-IN-RANGE", startAt: "2026-10-15T09:00:00", endAt: "2026-10-15T10:00:00" },
      ],
    });

    // 2. Sync — Range: 14-15, nur Tag 14 im Raw
    const raw = {
      "2026-10-14": [
        { issueKey: "NEW-ENTRY", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    };
    const range = { minDate: "2026-10-14", maxDate: "2026-10-15" };

    await timesheetService.syncFromRaw(raw, range);

    // 3. Tag 12 bleibt (ausserhalb Range), Tag 14 wird ueberschrieben, Tag 15 geloescht (in Range, nicht im Raw)
    const octData = fs.readMonth("2026-10")!;
    expect(octData).toHaveProperty("2026-10-12");
    expect(octData["2026-10-12"][0]?.issueKey).toBe("OLD-BEFORE");

    expect(octData).toHaveProperty("2026-10-14");
    expect(octData["2026-10-14"][0]?.issueKey).toBe("NEW-ENTRY");

    expect(octData).not.toHaveProperty("2026-10-15");
  });

  test("sollte komplette Range ueberschreiben — was nicht im Raw fliegt raus", async ({ timesheetService, fs }) => {
    // 1. Ganzer Monat voll Daten
    fs.seedMonth("2026-10", {
      "2026-10-01": [{ id: "1", issueKey: "DAY-01", startAt: "2026-10-01T09:00:00", endAt: "2026-10-01T10:00:00" }],
      "2026-10-05": [{ id: "2", issueKey: "DAY-05", startAt: "2026-10-05T09:00:00", endAt: "2026-10-05T10:00:00" }],
      "2026-10-10": [{ id: "3", issueKey: "DAY-10", startAt: "2026-10-10T09:00:00", endAt: "2026-10-10T10:00:00" }],
      "2026-10-20": [{ id: "4", issueKey: "DAY-20", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T10:00:00" }],
      "2026-10-31": [{ id: "5", issueKey: "DAY-31", startAt: "2026-10-31T09:00:00", endAt: "2026-10-31T10:00:00" }],
    });

    // 2. Sync nur 05-20 — alles andere bleibt, alles in 05-20 wird ersetzt
    const raw = {
      "2026-10-05": [{ issueKey: "RANGE-REPLACED", startAt: "2026-10-05T14:00:00", endAt: "2026-10-05T15:00:00" }],
      "2026-10-10": [{ issueKey: "RANGE-NEW", startAt: "2026-10-10T10:00:00", endAt: "2026-10-10T12:00:00" }],
    };
    const range = { minDate: "2026-10-05", maxDate: "2026-10-20" };

    await timesheetService.syncFromRaw(raw, range);

    const octData = fs.readMonth("2026-10")!;

    // Ausserhalb Range: bleiben
    expect(octData).toHaveProperty("2026-10-01");
    expect(octData["2026-10-01"][0]?.issueKey).toBe("DAY-01");
    expect(octData).toHaveProperty("2026-10-31");
    expect(octData["2026-10-31"][0]?.issueKey).toBe("DAY-31");

    // In Range: ueberschrieben (05 und 10 im Raw vorhanden)
    expect(octData["2026-10-05"][0]?.issueKey).toBe("RANGE-REPLACED");
    expect(octData["2026-10-10"][0]?.issueKey).toBe("RANGE-NEW");

    // In Range: aber nicht im Raw → geloescht
    expect(octData).not.toHaveProperty("2026-10-20");
  });

  // ========================================================================
  // Merge — bestehende Daten werden pro Tag ueberschrieben
  // ========================================================================

  test("sollte bestehende Repository-Eintraege pro Tag innerhalb der Range ueberschreiben", async ({ timesheetService, fs }) => {
    // 1. Bestehende Daten im Repository anlegen
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "existing", issueKey: "OLD-ENTRY", startAt: "2026-10-14T07:00:00", endAt: "2026-10-14T08:00:00" },
      ],
    });

    // 2. Sync mit neuen Daten fuer denselben Tag in der Range
    const raw = {
      "2026-10-14": [
        { issueKey: "NEW-ENTRY", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    };
    const range = { minDate: "2026-10-14", maxDate: "2026-10-14" };

    await timesheetService.syncFromRaw(raw, range);

    // 3. SyncFromRaw ueberschreibt existing date-keys innerhalb der Range
    const octData = fs.readMonth("2026-10")!;
    expect(octData["2026-10-14"]).toHaveLength(1);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("NEW-ENTRY");
  });

  test("sollte Eintraege ausserhalb der Range unveraendert lassen", async ({ timesheetService, fs }) => {
    // 1. Bestehende Daten im Repository
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "existing", issueKey: "IN-RANGE", startAt: "2026-10-14T07:00:00", endAt: "2026-10-14T08:00:00" },
      ],
      "2026-10-20": [
        { id: "outside", issueKey: "OUTSIDE-RANGE", startAt: "2026-10-20T07:00:00", endAt: "2026-10-20T08:00:00" },
      ],
    });

    // 2. Sync mit Range: 14-14 — Tag 20 ist ausserhalb
    const raw = {
      "2026-10-14": [
        { issueKey: "RANGE-REPLACED", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
    };
    const range = { minDate: "2026-10-14", maxDate: "2026-10-14" };

    await timesheetService.syncFromRaw(raw, range);

    // Tag 14 wird ersetzt, Tag 20 bleibt
    const octData = fs.readMonth("2026-10")!;
    expect(octData["2026-10-14"][0]?.issueKey).toBe("RANGE-REPLACED");
    expect(octData["2026-10-20"][0]?.issueKey).toBe("OUTSIDE-RANGE");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte leeres Object als Nothing-Op behandeln", async ({ timesheetService, fs }) => {
    const raw = {};
    const range = { minDate: "2026-10-14", maxDate: "2026-10-14" };

    await timesheetService.syncFromRaw(raw, range);

    // Nothing-Op: leeres Object wird geschrieben, Monat existiert aber ist leer
    const octData = fs.readMonth("2026-10");
    expect(octData).not.toBeUndefined();
    expect(Object.keys(octData!)).toHaveLength(0);
  });

  test("sollte leere Eintraege-Arrays speichern", async ({ timesheetService, fs }) => {
    const raw = {
      "2026-10-14": [],
    };
    const range = { minDate: "2026-10-14", maxDate: "2026-10-14" };

    await timesheetService.syncFromRaw(raw, range);

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
    const range = { minDate: "2026-10-14", maxDate: "2026-10-14" };

    await timesheetService.syncFromRaw(raw, range);

    const octData = fs.readMonth("2026-10")!;
    expect(octData["2026-10-14"]).toHaveLength(2);
    expect(octData["2026-10-14"][0]?.issueKey).toBe("PROJ-A");
    expect(octData["2026-10-14"][1]?.issueKey).toBe("PROJ-B");
  });

  // ========================================================================
  // Validierung — Raw-Daten muessen im gleichen Monat wie die Range sein
  // ========================================================================

  test("sollte Error werfen wenn Raw-Daten einen anderen Monat als die Range haben", async ({ timesheetService }) => {
    const range = { minDate: "2026-10-01", maxDate: "2026-10-31" };

    const raw = {
      "2026-11-03": [{ issueKey: "NIGHT", startAt: "2026-11-03T09:00:00", endAt: "2026-11-03T10:00:00" }],
    };

    await expect(timesheetService.syncFromRaw(raw, range)).rejects.toThrow("Synchronisation ist fehl geschlagen");
  });
});
