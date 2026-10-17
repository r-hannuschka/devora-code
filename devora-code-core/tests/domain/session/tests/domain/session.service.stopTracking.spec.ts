import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";
import type { TimeEntryDTO } from "@/infrastructure/timesheet";

describe("SessionService.stopTracking", () => {

  test("sollte Timer stoppen und globalState leeren", async ({ sessionService, fs, vscodeContext }) => {
    const issueKey = "PROJ-42";
    const startAt = "2026-10-14T09:00:00";
    const endAt = "2026-10-14T10:00:00";
    const entry = { id: "active-id", issueKey, startAt, endAt: null };

    await vscodeContext.globalState.update("activeTimeEntry", entry);
    fs.seedMonth("2026-10", { "2026-10-14": [entry] });

    vi.useFakeTimers();
    vi.setSystemTime(new Date(endAt));

    const result = await sessionService.stopTracking();

    expect(result).toBeDefined();
    expect(result).toMatchObject([{ ...entry, endAt }]);
    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeUndefined();

    vi.useRealTimers();
  });

  test("sollte null zurueckgeben wenn kein Timer laeuft", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const result = await sessionService.stopTracking();

    expect(result).toBeNull();
  });
});
