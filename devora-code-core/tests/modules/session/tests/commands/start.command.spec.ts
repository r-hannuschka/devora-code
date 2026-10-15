import type { TimeEntryDTO } from "@/core/infrastructure";
import { StartSessionHandler } from "@/modules/session";
import { test } from "@/tests/core/fixture";
import type { StartSessionCommand } from "@devora-code/api/session";
import { describe, expect, vi } from "vitest";

describe("StartTrackingHandler", () => {
  test("sollte Timer starten wenn keiner läuft", async ({ vscodeContext, fs }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);
    fs.seedMonth("2026-10", {});

    const startAt = "2026-10-14T09:00:00";
    vi.useFakeTimers();
    vi.setSystemTime(new Date(startAt));

    const command: StartSessionCommand = {
      id: "test-1",
      type: "session:start",
      payload: { issueKey: "PROJ-42" },
    };
    const handler = new StartSessionHandler(command);
    const result = await handler.execute();

    expect(result.issueKey).toBe("PROJ-42");
    expect(result.endAt).toBeNull();
    expect(fs.readMonth("2026-10")).toMatchObject({
      "2026-10-14": [expect.objectContaining({ issueKey: "PROJ-42", endAt: null })],
    });
    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeDefined();

    vi.useRealTimers();
  });

  // ========================================================================
  // Session-Überschreibung: laufender Timer wird beendet
  // ========================================================================

  test("sollte laufenden Timer beenden wenn neuer gestartet wird", async ({ vscodeContext, fs }) => {
    const newStartAt = "2026-10-14T14:00:00";
    const oldIssueKey = "OLD-1";
    const newIssueKey = "NEW-1";

    vi.useFakeTimers();
    vi.setSystemTime(new Date(newStartAt));

    // 1. Aktiven Timer im globalState vorbereiten (simuliert laufende Session)
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "active-1",
      issueKey: oldIssueKey,
      startAt: "2026-10-14T09:00:00",
      endAt: null,
    });

    // 2. Repository mit dem offenen Eintrag seeden
    fs.seedMonth("2026-10", {
      "2026-10-14": [
        { id: "active-1", issueKey: oldIssueKey, startAt: "2026-10-14T09:00:00", endAt: null },
      ],
    });

    // 3. Neuen Timer starten – das ist der eigentliche Test-Aufruf
    const command: StartSessionCommand = {
      id: "test-2",
      type: "session:start",
      payload: { issueKey: newIssueKey },
    };
    const handler = new StartSessionHandler(command);
    const result = await handler.execute();

    // 4. ALTE Session: Timer wurde mit nowLocal() beendet
    const monthData = fs.readMonth("2026-10") ?? {};
    const oldEntries = monthData["2026-10-14"]?.filter((e) => e.id === "active-1") ?? [];
    expect(oldEntries).toHaveLength(1);
    expect(oldEntries[0]?.issueKey).toBe(oldIssueKey);
    expect(oldEntries[0]?.endAt).toBe(newStartAt); // endAt = Zeitpunkt des neuen Starts

    // 5. NEUE Session: Timer läuft (open-ended)
    expect(result.issueKey).toBe(newIssueKey);
    expect(result.endAt).toBeNull();

    const newEntries = monthData["2026-10-14"]?.filter((e) => e.issueKey === newIssueKey) ?? [];
    expect(newEntries.length).toBeGreaterThanOrEqual(1);
    expect(newEntries[newEntries.length - 1]?.endAt).toBeNull(); // letzter Eintrag ist active

    // 6. globalState: nur neue Session aktiv
    const activeEntry = vscodeContext.globalState.get("activeTimeEntry") as TimeEntryDTO;
    expect(activeEntry?.issueKey).toBe(newIssueKey);

    vi.useRealTimers();
  });

  test("sollte mehrere Sessions hintereinander stoppen", async ({ vscodeContext, fs }) => {
    vi.useFakeTimers();

    // Session 1: 09:00 - 10:00
    await vscodeContext.globalState.update("activeTimeEntry", {
      id: "s1", issueKey: "SESS-1", startAt: "2026-10-14T09:00:00", endAt: null,
    });
    fs.seedMonth("2026-10", {
      "2026-10-14": [{ id: "s1", issueKey: "SESS-1", startAt: "2026-10-14T09:00:00", endAt: null }],
    });

    vi.setSystemTime(new Date("2026-10-14T10:00:00"));
    await new StartSessionHandler({ id: "t1", type: "session:start", payload: { issueKey: "SESS-2" } }).execute();

    // Session 2: 10:00 - 11:00
    const month1 = fs.readMonth("2026-10") ?? {};
    const s1Entries = month1["2026-10-14"]?.filter((e) => e.id === "s1");
    expect(s1Entries?.[0]?.endAt).toBe("2026-10-14T10:00:00");

    // Session 3: 11:00 - offen
    vi.setSystemTime(new Date("2026-10-14T11:00:00"));
    const result = await new StartSessionHandler({ id: "t2", type: "session:start", payload: { issueKey: "SESS-3" } }).execute();

    // Neu lesen – month1 ist veraltet nach den start() Calls
    const month2 = fs.readMonth("2026-10") ?? {};
    const s2Entries = month2["2026-10-14"]?.filter((e) => e.issueKey === "SESS-2");
    expect(s2Entries?.[0]?.endAt).toBe("2026-10-14T11:00:00");
    expect(result.issueKey).toBe("SESS-3");
    expect(result.endAt).toBeNull();

    vi.useRealTimers();
  });
});
