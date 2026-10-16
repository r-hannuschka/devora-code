import { ResetSessionHandler } from "@/domain/session";
import { describe, expect } from "vitest";
import { test } from "@/tests/core/fixture";
import { buildTimeEntry } from "@/tests/core/util";

describe("ResetSessionCommandHandler", () => {

  test("sollte aktiven Timer stoppen und globalState leeren", async ({ vscodeContext, fs }) => {
    const entry = buildTimeEntry();
    await vscodeContext.globalState.update("activeTimeEntry", entry);
    fs.seedMonth("2026-10", { "2026-10-11": [entry] });

    const command = new ResetSessionHandler();
    await command.execute();

    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeUndefined();
    expect(fs.readMonth("2026-10")?.["2026-10-11"]).toMatchObject([
      expect.objectContaining({ endAt: expect.any(String) }),
    ]);
  });

  test("sollte auch Nothing-op sein wenn kein aktiver Timer", async ({ vscodeContext, fs }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const command = new ResetSessionHandler();
    await command.execute();

    expect(vscodeContext.globalState.get("activeTimeEntry")).toBeUndefined();
    expect(fs.readMonth("2026-10")).toBeUndefined();
  });
});
