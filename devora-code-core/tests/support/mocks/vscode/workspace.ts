/**
 * Workspace-Mock: Dateisystem, Konfiguration, Workspace-Ordner, Text-Dokumente.
 */
import { vi } from "vitest";
import { createMockUri } from "./uri";

export const workspace = {
  fs: {
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readDirectory: vi.fn().mockResolvedValue([]),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ type: 1 as const }),
    delete: vi.fn().mockResolvedValue(undefined),
  },

  openTextDocument: vi.fn().mockImplementation(async (arg: any) => {
    if (arg && arg.path) {
      return {
        uri: arg,
        fileName: arg.path,
        getText: () => "{}",
      };
    }
    return {
      content: arg?.content,
      language: arg?.language,
      getText: () => arg?.content || "{}",
    };
  }),

  workspaceFolders: [
    {
      uri: createMockUri("/dev/null"),
      name: "vitest",
      index: 0,
    },
  ],

  getConfiguration: vi.fn().mockImplementation((key: string, uri: any) => ({
    get(section: string) {
      if (section === "timesheetStorageDir") return "/storage/booking-data";
      if (section === "projectName") return "vitest";
      return null;
    },
  })),
};
