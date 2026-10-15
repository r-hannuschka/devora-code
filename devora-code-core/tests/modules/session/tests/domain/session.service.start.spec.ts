import type { TimeEntryDTO } from "@/core/infrastructure";
import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

describe("SessionService.start", () => {
  test("sollte Timer starten und globalState setzen", async ({ sessionService, fs, vscodeContext }) => {
    const startAt = "2026-10-14T09:00:00";
    const issueKey = "PROJ-42";

    vi.useFakeTimers();
    vi.setSystemTime(new Date(startAt));

    const result = await sessionService.start(issueKey);

    expect(result.issueKey).toBe("PROJ-42");
    expect(result.endAt).toBeNull();
    expect(fs.readMonth("2026-10")).toMatchObject({
      "2026-10-14": [{ issueKey, startAt, endAt: null }],
    });

    const timeEntry = vscodeContext.globalState.get("activeTimeEntry") as TimeEntryDTO | undefined;
    expect(timeEntry).toBeDefined();
    expect(timeEntry?.id).toBe(result.id);

    vi.useRealTimers();
  });

  test("sollte fehlschlagen wenn Repository keinen Eintrag zurueckschreibt", async ({ sessionService, timesheetRepository }) => {
    vi.spyOn(timesheetRepository, "write").mockImplementation(async () => []);
    await expect(sessionService.start("PROJ-42")).rejects.toThrow("Der Eintrag konnte nicht im Repository erstellt werden.");
  });
});
