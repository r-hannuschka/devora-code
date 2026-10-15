import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";
import type { TimeEntry } from "@devora-code/api/core";
import type { TimeEntryDTO } from "@/core/infrastructure";

describe("SessionService.splitActiveTimer", () => {

  test("sollte Timer unterbrechen und Eintrag einfuegen", async ({ sessionService, vscodeContext }) => {
    const activeId = "active-id";
    const source: TimeEntry = {
      id: activeId,
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    };
    const toInsert: TimeEntry = {
      id: "insert-id",
      issueKey: "MEETING-1",
      startAt: "2026-10-14T10:00:00",
      endAt: "2026-10-14T10:30:00",
    };

    await vscodeContext.globalState.update("activeTimeEntry", source);

    const result = await sessionService.splitActiveTimer(toInsert, source);

    expect(result).toBeDefined();
    expect(result.length).toBe(3);

    // Erster Eintrag: Timer von 09:00 bis 10:00
    expect(result[0]?.id).toBe(activeId);
    expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");

    // Zweiter Eintrag: der eingefügte Eintrag
    expect(result[1]?.id).toBe("insert-id");

    // Dritter Eintrag: neuer Timer ab 10:30
    expect(result[2]?.id).not.toBe(activeId);
    expect(result[2]?.endAt).toBeNull();
    expect(result[2]?.startAt).toBe("2026-10-14T10:30:00");
    expect(result[2]?.issueKey).toBe("PROJ-10");

    // GlobalState zeigt neuen Timer
    const active = vscodeContext.globalState.get("activeTimeEntry") as TimeEntryDTO | undefined;
    expect(active?.id).toBe(result[2]?.id);
  });

  test("sollte fehlschlagen wenn source bereits beendet wurde", async ({ sessionService }) => {
    const source: TimeEntry = {
      id: "done-id",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: "2026-10-14T10:00:00",
    };
    const toInsert: TimeEntry = {
      id: "insert-id",
      issueKey: "MEETING-1",
      startAt: "2026-10-14T10:00:00",
      endAt: "2026-10-14T10:30:00",
    };

    await expect(sessionService.splitActiveTimer(toInsert, source)).rejects.toThrow(
      "[Timetracker]: Aktiver Timer wurde schon beendet.",
    );
  });

  test("sollte fehlschlagen wenn toInsert kein Ende hat", async ({ sessionService }) => {
    const source: TimeEntry = {
      id: "active-id",
      issueKey: "PROJ-10",
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    };
    const toInsert: TimeEntry = {
      id: "insert-id",
      issueKey: "MEETING-1",
      startAt: "2026-10-14T10:00:00",
      endAt: null,
    };

    await expect(sessionService.splitActiveTimer(toInsert, source)).rejects.toThrow(
      "[Timetracker]: Eintrag konnte nicht dazwischen geschoben werden da das Ende Datum fehlt.",
    );
  });
});
