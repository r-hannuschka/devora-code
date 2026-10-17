import { test } from "@/support";
import type { GetMonthCommand } from "@devora-code/api/timesheet";
import { GetMonthHandler } from "@src/domain/timesheet/commands";
import { describe, expect } from "vitest";

/**
 * GetMonthHandler testet den Datenzugriff auf einen kompletten Monat:
 * - Liefert die TimesData für den angefragten Monat
 * - Leerer Monat → leeres Objekt
 * - Cross-Month → nur der angefragte Monat
 */
describe("GetMonthHandler", () => {
  // ========================================================================
  // Grundfunktionalitaet
  // ========================================================================

  test("sollte TimesData des Monats zurueckgeben", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
        { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:30:00" },
      ],
    });

    const command: GetMonthCommand = {
      id: "month-1",
      type: "timesheet:get-month",
      payload: { month: "2026-10" },
    };

    const handler = new GetMonthHandler(command);
    const result = await handler.execute();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result["2026-10-14"]).toHaveLength(2);
    expect(result["2026-10-14"]?.[0]?.issueKey).toBe("PROJ-10");
  });

  test("sollte mehrere Tage eines Monats zurueckgeben", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }],
      "2026-10-15": [{ id: "2", issueKey: "PROJ-20", startAt: "2026-10-15T14:00:00", endAt: "2026-10-15T16:00:00" }],
      "2026-10-20": [{ id: "3", issueKey: "PROJ-30", startAt: "2026-10-20T09:00:00", endAt: "2026-10-20T12:00:00" }],
    });

    const command: GetMonthCommand = {
      id: "month-2",
      type: "timesheet:get-month",
      payload: { month: "2026-10" },
    };

    const handler = new GetMonthHandler(command);
    const result = await handler.execute();

    expect(Object.keys(result)).toHaveLength(3);
    expect(result["2026-10-14"]).toHaveLength(1);
    expect(result["2026-10-15"]).toHaveLength(1);
    expect(result["2026-10-20"]).toHaveLength(1);
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte leeres Objekt zurueckgeben wenn Monat leer ist", async ({ fs }) => {
    fs.seedMonth("2026-10", {});

    const command: GetMonthCommand = {
      id: "month-3",
      type: "timesheet:get-month",
      payload: { month: "2026-10" },
    };

    const handler = new GetMonthHandler(command);
    const result = await handler.execute();

    expect(Object.keys(result)).toHaveLength(0);
    expect(result).toEqual({});
  });

  test("sollte nur angefragten Monat zurueckgeben und andere ignorieren", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" }],
    });
    fs.seedMonth("2026-11", {
      "2026-11-01": [{ id: "2", issueKey: "PROJ-20", startAt: "2026-11-01T14:00:00", endAt: "2026-11-01T16:00:00" }],
    });

    const command: GetMonthCommand = {
      id: "month-4",
      type: "timesheet:get-month",
      payload: { month: "2026-11" },
    };

    const handler = new GetMonthHandler(command);
    const result = await handler.execute();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).not.toHaveProperty("2026-10");
    expect(result["2026-11-01"]).toHaveLength(1);
  });

  // ========================================================================
  // Active Timer (endAt = null)
  // ========================================================================

  test("sollte offenen Timer (endAt=null) zurueckgeben", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null },
      ],
    });

    const command: GetMonthCommand = {
      id: "month-5",
      type: "timesheet:get-month",
      payload: { month: "2026-10" },
    };

    const handler = new GetMonthHandler(command);
    const result = await handler.execute();

    expect(result["2026-10-14"]?.[0]?.endAt).toBeNull();
  });
});
