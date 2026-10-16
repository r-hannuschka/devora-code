import { GetPeriodHandler } from "@/domain/timesheet";
import { test } from "@/tests/core/fixture";
import type { GetPeriodCommand } from "@devora-code/api/timesheet";
import { describe, expect } from "vitest";

/**
 * GetPeriodHandler testet den Datenzugriff über einen Zeitraum:
 * - entries gefiltert nach startDate + endDate
 * - count = Anzahl Eintraege
 * - totalSeconds = Summe aller Dauern
 */
describe("GetPeriodHandler", () => {

  // ========================================================================
  // Grundfunktionalitaet
  // ========================================================================

  test("sollte Eintraege eines Tages zurueckgeben", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
        { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T14:00:00", endAt: "2026-10-14T16:30:00" },
      ],
    });

    const command: GetPeriodCommand = {
      id: "period-1",
      type: "timesheet:get-period",
      payload: { startDate: "2026-10-14" },
    };

    const handler = new GetPeriodHandler(command);
    const result = await handler.execute();

    expect(result.entries.length).toBe(2);
    expect(result.count).toBe(2);
    expect(result.totalSeconds).toBe(3.5 * 3600); // 1h + 2.5h = 3.5h
  });

  test("sollte Eintraege ueber mehrere Tage filtern", async ({ fs }) => {
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:00:00" },
      ],
      "2026-10-15": [
        { id: "2", issueKey: "PROJ-20", startAt: "2026-10-15T14:00:00", endAt: "2026-10-15T16:00:00" },
      ],
    });

    const command: GetPeriodCommand = {
      id: "period-2",
      type: "timesheet:get-period",
      payload: { startDate: "2026-10-14", endDate: "2026-10-14" },
    };

    const handler = new GetPeriodHandler(command);
    const result = await handler.execute();

    expect(result.entries.length).toBe(1);
    expect(result.count).toBe(1);
    expect(result.entries[0]?.id).toBe("1");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte leere Liste zurueckgeben wenn Zeitraum leer ist", async ({ fs }) => {
    fs.seedMonth("2026-10", {});

    const command: GetPeriodCommand = {
      id: "period-3",
      type: "timesheet:get-period",
      payload: { startDate: "2026-10-14", endDate: "2026-10-16" },
    };

    const handler = new GetPeriodHandler(command);
    const result = await handler.execute();

    expect(result.entries.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });

  test("sollte leere Liste zurueckgeben wenn kein startDate uebergeben", async () => {
    const command: any = {
      id: "period-4",
      type: "timesheet:get-period",
      payload: undefined,
    };

    const handler = new GetPeriodHandler(command);
    const result = await handler.execute();

    expect(result.entries.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });
});
