// tests/modules/timesheet/fixtures/test.fixture.ts
import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimesheetRepository } from "@/core/infrastructure";
import { container } from "tsyringe";
import { test as base } from "@/tests/core/fixture";
import { TimesheetService } from "@src/modules/timesheet/domain/timesheet.service";

interface MyFixtures {
  timesheetService: TimesheetService;
  timesheetRepository: TimesheetRepository;
}

export const test = base.extend<MyFixtures>({
  timesheetService: [async ({ vscodeContext, fs }, use) => {
    container.clearInstances();

    // Echte Repo-Instanz — workspace.fs ist gemockt durch installInMemoryFs
    const repo = new TimesheetRepository(vscodeContext);
    const service = new TimesheetService(repo, vscodeContext);

    container.registerInstance(TimesheetService, service);
    await use(service);
  }, { auto: true }],

  timesheetRepository: async ({ vscodeContext }, use) => {
    const repository = new TimesheetRepository(vscodeContext);
    await use(repository);
  },
});

export { expect } from "vitest";
