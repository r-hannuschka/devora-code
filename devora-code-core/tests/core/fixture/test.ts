// tests/helpers/fixtures.ts
import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { LoggerService } from "@/core/logger";
import { NotificationService } from "@/core/notification";
import { TimesheetService } from "@src/modules/timesheet/domain/timesheet.service";
import { container } from "tsyringe";
import { test as base } from "vitest";
import type { ExtensionContext } from "vscode";
import { createExtensionContextMock } from "../mock/extension-context.mock";
import { installInMemoryFs, type InMemoryFs } from "../util/in-memory-fs";

// Definition der im Test verfügbaren Fixtures
interface MyFixtures {
  diContainer: typeof container;
  vscodeContext: ExtensionContext;
  timesheetService: TimesheetService;
  loggerService: LoggerService;
  notificationService: NotificationService;
  fs: InMemoryFs;
}

// Wir erweitern das Vitest 'test' Objekt um unsere Fixtures
export const test = base.extend<MyFixtures>({
  diContainer: async ({}, use) => {
    container.clearInstances();
    await use(container);
  },

  fs: [
    async ({}, use) => {
      await use(installInMemoryFs("/storage/booking-data"));
    },
    { auto: true },
  ],

  vscodeContext: [
    async ({ diContainer }, use) => {
      const mockCtx = createExtensionContextMock();
      diContainer.registerInstance(EXTENSION_CONTEXT_TOKEN, mockCtx);
      await use(mockCtx as unknown as ExtensionContext);
    },
    { auto: true },
  ],

  timesheetService: async ({ diContainer }, use) => {
    const timesheetService = diContainer.resolve(TimesheetService);
    await use(timesheetService);
  },

  loggerService: async ({ diContainer }, use) => {
    const loggerService = diContainer.resolve(LoggerService);
    await use(loggerService);
  },

  notificationService: async ({ diContainer }, use) => {
    const notificationService = diContainer.resolve(NotificationService);
    await use(notificationService);
  },
});

export { expect } from "vitest";
