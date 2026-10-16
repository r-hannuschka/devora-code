// tests/helpers/fixtures.ts
import { TimesheetService } from "@/domain/timesheet";
import { test as base } from "@/support";

// Definition der im Test verfügbaren Fixtures
interface MyFixtures {
  timesheetService: TimesheetService;
}

// Wir erweitern das Vitest 'test' Objekt um unsere Fixtures
export const test = base.extend<MyFixtures>({
  timesheetService: async ({ diContainer }, use) => {
    const service = diContainer.resolve(TimesheetService);
    await use(service);
  },
});

export { expect } from "vitest";
