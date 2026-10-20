import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/timesheet-sanitizer.fixture";

describe("Timesheet Sanitizer Service", () => {
  test("Should end last open session in timesheet at 23:59:59", async ({ fs, timesheetSanitizer }) => {
    fs.seedMonth("2026-10", {
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:30:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:30:00", endAt: null },
      ],
    });

    await timesheetSanitizer.closeOpenTimers();

    const month = fs.readMonth("2026-10");
    expect(month).toBeDefined();
    expect(month).toMatchObject({
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:30:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:30:00", endAt: "2026-10-01T23:59:59" },
      ],
    });
  });

  test("Should end open session when session after started", async ({ fs, timesheetSanitizer }) => {
    fs.seedMonth("2026-10", {
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:30:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:30:00", endAt: null },
        { id: "ISSUE-3", issueKey: "ISSUE-3", startAt: "2026-10-01T14:30:00", endAt: "2026-10-01T18:00:00" },
      ],
    });

    await timesheetSanitizer.closeOpenTimers();

    const month = fs.readMonth("2026-10");
    expect(month).toBeDefined();
    expect(month).toMatchObject({
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:30:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:30:00", endAt: "2026-10-01T14:30:00" },
        { id: "ISSUE-3", issueKey: "ISSUE-3", startAt: "2026-10-01T14:30:00", endAt: "2026-10-01T18:00:00" },
      ],
    });
  });

  test("Should end multiple consecutive open sessions", async ({ fs, timesheetSanitizer }) => {
    fs.seedMonth("2026-10", {
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:00:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:00:00", endAt: null },
        { id: "ISSUE-3", issueKey: "ISSUE-3", startAt: "2026-10-01T12:00:00", endAt: null },
        { id: "ISSUE-4", issueKey: "ISSUE-4", startAt: "2026-10-01T14:00:00", endAt: null },
      ],
    });

    await timesheetSanitizer.closeOpenTimers();

    const month = fs.readMonth("2026-10");
    expect(month).toBeDefined();
    expect(month).toMatchObject({
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:00:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:00:00", endAt: "2026-10-01T12:00:00" },
        { id: "ISSUE-3", issueKey: "ISSUE-3", startAt: "2026-10-01T12:00:00", endAt: "2026-10-01T14:00:00" },
        { id: "ISSUE-4", issueKey: "ISSUE-4", startAt: "2026-10-01T14:00:00", endAt: "2026-10-01T23:59:59" },
      ],
    });
  });

  test("Should not write if no file needs sanitization", async ({ fs, timesheetSanitizer, timesheetRepository }) => {
    fs.seedMonth("2026-10", {
      "2026-10-1": [
        { id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T10:30:00" },
        { id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-01T10:30:00", endAt: "2026-10-01T14:00:00" },
        { id: "ISSUE-3", issueKey: "ISSUE-3", startAt: "2026-10-01T14:30:00", endAt: "2026-10-01T18:00:00" },
      ],
    });

    const writeSpy = vi.spyOn(timesheetRepository, "writeFile");
    await timesheetSanitizer.closeOpenTimers();
    expect(writeSpy).toHaveBeenCalledTimes(0);
  });

  test("Should only write sanitized files, skip clean files", async ({ fs, timesheetSanitizer, timesheetRepository }) => {
    fs.seedMonth("2026-10", {
      "2026-10-2": [{ id: "ISSUE-2", issueKey: "ISSUE-2", startAt: "2026-10-02T09:00:00", endAt: null }],
    });

    fs.seedMonth("2026-11", {
      "2026-10-1": [{ id: "ISSUE-1", issueKey: "ISSUE-1", startAt: "2026-10-01T08:00:00", endAt: "2026-10-01T12:00:00" }],
    });

    const writeSpy = vi.spyOn(timesheetRepository, "writeFile");
    await timesheetSanitizer.closeOpenTimers();

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy).toHaveBeenCalledWith(
      "2026-10",
      expect.objectContaining({ "2026-10-2": expect.arrayContaining([expect.objectContaining({ endAt: "2026-10-02T23:59:59" })]) }),
    );
  });
});
