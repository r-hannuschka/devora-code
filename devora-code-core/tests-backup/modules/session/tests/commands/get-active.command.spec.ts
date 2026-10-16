import { GetActiveTimerHandler } from "@/domain/session";
import { describe, expect } from "vitest";
import { test } from "@/tests/core/fixture";
import { buildTimeEntry } from "@/tests/core/util";

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
