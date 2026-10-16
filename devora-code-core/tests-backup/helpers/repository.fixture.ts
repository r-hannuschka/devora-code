import { TimesheetRepository } from "@src/modules/timetracker/infrastructure/timesheet.repository";
import { installInMemoryFs } from "../mocks/in-memory-fs";
import { createExtensionContextMock } from "./extension-context";

const GLOBAL_STORAGE_PATH = "/storage";

/**
 * Echtes TimesheetRepository auf einem Dateisystem im Speicher.
 * Nach dem Test: vi.restoreAllMocks() (z.B. im afterEach).
 */
export function createRepositoryFixture() {
  // gleicher Pfad wie im Repository: <globalStorage>/booking-data
  const storageDir = `${GLOBAL_STORAGE_PATH}/booking-data`;

  const fs = installInMemoryFs(storageDir);
  const context = createExtensionContextMock({ globalStoragePath: GLOBAL_STORAGE_PATH });
  const repository = new TimesheetRepository(context);

  return { repository, fs, storageDir };
}

export type RepositoryFixture = ReturnType<typeof createRepositoryFixture>;
