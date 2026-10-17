import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

/**
 * SessionService helper methods testet die State-Abfragen:
 * - isTracking: prüft ob ein bestimmter IssueKey aktuell aktiv ist
 * - getActiveTimer: liefert den aktiven Timer oder null
 * - getActiveIssueKey: liefert den IssueKey oder null
 * - getActiveTimerRef: liefert die ID des aktiven Timers oder null
 */
describe("SessionService helpers", () => {
  // ========================================================================
  // getActiveTimer
  // ========================================================================

  test("sollte aktiven Timer zurueckgeben wenn einer existiert", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "timer-1",
      issueKey: "PROJ-42",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    const result = sessionService.getActiveTimer();

    expect(result).not.toBeNull();
    expect(result?.issueKey).toBe("PROJ-42");
    expect(result?.id).toBe("timer-1");
  });

  test("sollte null zurueckgeben wenn kein Timer aktiv", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const result = sessionService.getActiveTimer();

    expect(result).toBeNull();
  });

  // ========================================================================
  // getActiveIssueKey
  // ========================================================================

  test("sollte IssueKey des aktiven Timers zurueckgeben", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "timer-2",
      issueKey: "TASK-99",
      startAt: "2026-10-15T10:00:00",
      endAt: null,
    });

    const result = sessionService.getActiveIssueKey();

    expect(result).toBe("TASK-99");
  });

  test("sollte null zurueckgeben wenn kein Timer aktiv", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const result = sessionService.getActiveIssueKey();

    expect(result).toBeNull();
  });

  // ========================================================================
  // getActiveTimerRef
  // ========================================================================

  test("sollte ID des aktiven Timers zurueckgeben", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "timer-3",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    const result = sessionService.getActiveTimerRef();

    expect(result).toBe("timer-3");
  });

  test("sollte null zurueckgeben wenn kein Timer aktiv", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const result = sessionService.getActiveTimerRef();

    expect(result).toBeNull();
  });

  // ========================================================================
  // isTracking
  // ========================================================================

  test("sollte true zurueckgeben wenn IssueKey aktiv ist", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "timer-4",
      issueKey: "ACTIVE-ISSUE",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    const result = sessionService.isTracking("ACTIVE-ISSUE");

    expect(result).toBe(true);
  });

  test("sollte false zurueckgeben wenn IssueKey nicht aktiv ist", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "timer-5",
      issueKey: "SOME-ISSUE",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    const result = sessionService.isTracking("ANOTHER-ISSUE");

    expect(result).toBe(false);
  });

  test("sollte false zurueckgeben wenn kein Timer aktiv", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const result = sessionService.isTracking("ANY-ISSUE");

    expect(result).toBe(false);
  });
});
