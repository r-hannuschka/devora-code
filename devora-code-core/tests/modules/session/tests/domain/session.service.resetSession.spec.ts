import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

describe("SessionService.resetSession", () => {

  test("sollte Timer stoppen und globalState leeren", async ({ sessionService, fs, vscodeContext }) => {
    const entry = { id: "hanging-id", issueKey: "PROJ-42", startAt: "2026-10-14T09:00:00", endAt: null };

    await vscodeContext.globalState.update("activeTimeEntry", entry);
    fs.seedMonth("2026-10", { "2026-10-14": [entry] });

    const result = await sessionService.resetSession();

    expect(result).toBe(true);
    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeUndefined();
    expect(fs.readMonth("2026-10")?.["2026-10-14"]).toMatchObject([
      expect.objectContaining({ id: "hanging-id", endAt: expect.any(String) }),
    ]);
  });

  test("sollte auch Nothing-op sein wenn kein aktiver Timer", async ({ sessionService, vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const result = await sessionService.resetSession();

    expect(result).toBe(true);
    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeUndefined();
  });
});
