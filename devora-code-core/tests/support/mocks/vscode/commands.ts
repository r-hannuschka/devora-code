/**
 * Commands-Mock.
 */
import { vi } from "vitest";

export const commands = {
  executeCommand: vi.fn().mockResolvedValue(undefined),
};
