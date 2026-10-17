import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimesheetDocumentValidatorService } from "@/domain/timesheet";
import { container } from "tsyringe";
import { test as base } from "@/support";
import type { ExtensionContext } from "vscode";

interface MyFixtures {
  documentValidator: TimesheetDocumentValidatorService;
}

export const test = base.extend<MyFixtures>({
  documentValidator: [
    async ({ diContainer }, use) => {
      const service = diContainer.resolve(TimesheetDocumentValidatorService);
      await use(service);
    },
    { auto: true },
  ],
});
