import { buildTimeEntry } from "@/support";
import { GetActiveTimerHandler } from "@src/domain/session/commands";
import { describe, expect } from "vitest";
import { test } from "../../fixtures/test.fixture";

describe("GetActiveTimerHandler", () => {
  test("sollte den aktiven Timer zurückgeben wenn einer existiert", async ({ vscodeContext }) => {
    const entry = buildTimeEntry();
    await vscodeContext.globalState.update("activeTimeEntry", entry);

    const command = new GetActiveTimerHandler();
    const result = await command.execute();

    expect(result).toEqual(entry);
  });

  test("sollte null zurückgeben wenn kein aktiver Timer", async ({ vscodeContext }) => {
    await vscodeContext.globalState.update("activeTimeEntry", undefined);

    const command = new GetActiveTimerHandler();
    const result = await command.execute();

    expect(result).toBeNull();
  });
});
