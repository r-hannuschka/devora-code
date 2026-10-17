import { test } from "@/support";
import { TimesheetRawValidator } from "@src/domain/timesheet/service/timesheet-raw.validator";
import { describe, expect } from "vitest";

/**
 * TimesheetRawValidator testet die Validierung von Raw-Daten gegen eine TimesheetRange:
 * - validate: Daten gegen Range prüfen, Fehler zurückgeben oder null
 * - isDateInRange: prüfen ob ein Datum innerhalb einer Range liegt
 */
describe("TimesheetRawValidator", () => {
  const validator = new TimesheetRawValidator();
  const range = { minDate: "2026-10-01", maxDate: "2026-10-31" };

  // ========================================================================
  // validate — positive Pfade
  // ========================================================================

  test("sollte null zurueckgeben wenn alle Daten innerhalb der Range liegen", () => {
    const raw = {
      "2026-10-05": [{ issueKey: "PROJ-1", startAt: "2026-10-05T09:00:00", endAt: "2026-10-05T10:00:00" }],
      "2026-10-15": [{ issueKey: "PROJ-2", startAt: "2026-10-15T14:00:00", endAt: "2026-10-15T15:00:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).toBeNull();
  });

  test("sollte null zurueckgeben wenn leere Daten uebergeben werden", () => {
    const result = validator.validate({}, range);

    expect(result).toBeNull();
  });

  test("sollte null zurueckgeben bei exaktem Randdatum minDate", () => {
    const raw = {
      "2026-10-01": [{ issueKey: "EDGE", startAt: "2026-10-01T09:00:00", endAt: "2026-10-01T10:00:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).toBeNull();
  });

  test("sollte null zurueckgeben bei exaktem Randdatum maxDate", () => {
    const raw = {
      "2026-10-31": [{ issueKey: "EDGE", startAt: "2026-10-31T23:00:00", endAt: "2026-10-31T23:59:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).toBeNull();
  });

  // ========================================================================
  // validate — Error-Pfade
  // ========================================================================

  test("sollte ValidationError zurueckgeben wenn Daten auesserhalb der Range liegen", () => {
    const raw = {
      "2026-11-02": [{ issueKey: "LATE", startAt: "2026-11-02T09:00:00", endAt: "2026-11-02T10:00:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].dateStr).toBe("2026-11-02");
    expect(result![0].code).toBe("OUT_OF_RANGE");
    expect(result![0].message).toContain("2026-10-01");
    expect(result![0].message).toContain("2026-10-31");
  });

  test("sollte ValidationError zurueckgeben wenn Daten vor der Range liegen", () => {
    const raw = {
      "2026-09-30": [{ issueKey: "EARLY", startAt: "2026-09-30T09:00:00", endAt: "2026-09-30T10:00:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].dateStr).toBe("2026-09-30");
  });

  test("sollte alle out-of-range Daten sammeln, nicht nur den ersten", () => {
    const raw = {
      "2026-09-28": [{ issueKey: "PRE", startAt: "2026-09-28T09:00:00", endAt: "2026-09-28T10:00:00" }],
      "2026-10-10": [{ issueKey: "OK", startAt: "2026-10-10T09:00:00", endAt: "2026-10-10T10:00:00" }],
      "2026-11-05": [{ issueKey: "LATE", startAt: "2026-11-05T09:00:00", endAt: "2026-11-05T10:00:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
  });

  test("sollte gemischte Range- und Out-of-Range-Daten korrekt unterscheiden", () => {
    const raw = {
      "2026-10-01": [{ issueKey: "MIN", startAt: "2026-10-01T00:00:00", endAt: "2026-10-01T01:00:00" }],
      "2026-10-15": [{ issueKey: "MID", startAt: "2026-10-15T12:00:00", endAt: "2026-10-15T13:00:00" }],
      "2026-10-31": [{ issueKey: "MAX", startAt: "2026-10-31T23:00:00", endAt: "2026-10-31T23:59:00" }],
      "2026-11-01": [{ issueKey: "LATE", startAt: "2026-11-01T00:00:00", endAt: "2026-11-01T01:00:00" }],
    };

    const result = validator.validate(raw, range);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].dateStr).toBe("2026-11-01");
  });

  // ========================================================================
  // isDateInRange
  // ========================================================================

  test("sollte true zurueckgeben wenn Datum innerhalb der Range liegt", () => {
    expect(validator.isDateInRange("2026-10-15", range)).toBe(true);
  });

  test("sollte true zurueckgeben fuer exakten minDate", () => {
    expect(validator.isDateInRange("2026-10-01", range)).toBe(true);
  });

  test("sollte true zurueckgeben fuer exakten maxDate", () => {
    expect(validator.isDateInRange("2026-10-31", range)).toBe(true);
  });

  test("sollte false zurueckgeben wenn Datum vor der Range liegt", () => {
    expect(validator.isDateInRange("2026-09-30", range)).toBe(false);
  });

  test("sollte false zurueckgeben wenn Datum nach der Range liegt", () => {
    expect(validator.isDateInRange("2026-11-01", range)).toBe(false);
  });

  test("sollte false zurueckgeben bei ungueltigem Datumsformat", () => {
    expect(validator.isDateInRange("invalid-date", range)).toBe(false);
  });

  test("sollte false zurueckgeben bei leerem String", () => {
    expect(validator.isDateInRange("", range)).toBe(false);
  });
});
