import { TimesheetDocumentValidatorService } from "@/domain/timesheet";
import { test as base } from "@/support";
import { TimesheetSanitizerService } from "@src/domain/timesheet/service/timesheet-sanitizer.service";

interface MyFixtures {
  timesheetSanitizer: TimesheetSanitizerService;
}

export const test = base.extend<MyFixtures>({
  timesheetSanitizer: async ({ diContainer }, use) => {
    const service = diContainer.resolve(TimesheetSanitizerService);
    await use(service);
  },
});
