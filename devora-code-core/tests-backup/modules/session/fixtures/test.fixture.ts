// tests/helpers/fixtures.ts
import { TimesheetRepository } from "@/infrastructure/timesheet";
import { test as base } from "@/tests/core/fixture";
import { SessionService } from "@/domain/session/domain/session.service";

// Definition der im Test verfügbaren Fixtures
interface MyFixtures {
  sessionService: SessionService;
  timesheetRepository: TimesheetRepository;
}

// Wir erweitern das Vitest 'test' Objekt um unsere Fixtures
export const test = base.extend<MyFixtures>({
  sessionService: async ({ timesheetRepository, vscodeContext }, use) => {
    const service = new SessionService(timesheetRepository, vscodeContext);
    await use(service);
  },

  timesheetRepository: async ({ vscodeContext }, use) => {
    const repository = new TimesheetRepository(vscodeContext);
    await use(repository);
  },
});

export { expect } from "vitest";
