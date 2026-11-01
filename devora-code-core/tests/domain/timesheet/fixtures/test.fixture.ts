// tests/helpers/fixtures.ts
import { SessionService } from "@/domain/session";
import { TimesheetService } from "@/domain/timesheet";
import { test as base } from "@/support";

// Definition der im Test verfügbaren Fixtures
interface MyFixtures {
  timesheetService: TimesheetService;
  sessionService: SessionService;
}

// Wir erweitern das Vitest 'test' Objekt um unsere Fixtures
export const test = base.extend<MyFixtures>({

  sessionService: async ({ diContainer }, use) => {
    const sessionService = diContainer.resolve(SessionService);
    await use(sessionService);
  },

  timesheetService: [async ({ diContainer }, use) => {
    const service = diContainer.resolve(TimesheetService);
    await use(service);
  }, { auto: true }]
});

export { expect } from "vitest";
