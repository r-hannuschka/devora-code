import { StopSessionHandler } from "@/domain/session";
import { describe, expect, vi } from "vitest";
import { test } from "@/tests/core/fixture";
import { buildTimeEntry } from "@/tests/core/util";

describe("StopTrackingHandler", () => {

  test("sollte Timer stoppen und globalState leeren", async ({ vscodeContext, fs }) => {
    const issueKey = "PROJ-42";
    const startAt = "2026-10-14T09:00:00";
    const entry = buildTimeEntry({ id: "active-id", issueKey, startAt, endAt: null });
    await vscodeContext.globalState.update("activeTimeEntry", entry);
    fs.seedMonth("2026-10", { "2026-10-14": [entry] });

    // set system time
    const endAt = "2026-10-14T10:00:00";
    vi.useFakeTimers();
    vi.setSystemTime(new Date(endAt));

    // trigger handler
    const handler = new StopSessionHandler();
    const result = await handler.execute();

    expect(result).toBeDefined();
    expect(result).toMatchObject([
      {
        ...entry,
        endAt: endAt,
      },
    ]);
    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeUndefined();
    vi.useRealTimers();
  });

  test("sollte null zurückgeben wenn kein Timer läuft", async ({ vscodeContext, fs }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const handler = new StopSessionHandler();
    const result = await handler.execute();

    expect(result).toBeNull();
    expect(fs.readMonth("2026-10")).toBeUndefined();
  });
});
