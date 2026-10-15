// tests/helpers/fixtures.ts
import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { TimesheetRepository } from "@/core/infrastructure";
import { container } from "tsyringe";
import { test as base, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import type { ExtensionContext } from "vscode";
import { createExtensionContextMock } from "../mock/extension-context.mock";
import { installInMemoryFs, type InMemoryFs } from "../util/in-memory-fs";

// Definition der im Test verfügbaren Fixtures
interface MyFixtures {
  diContainer: typeof container;
  vscodeContext: ExtensionContext;
  timesheetRepo: TimesheetRepository;
  fs: InMemoryFs;
}

// Wir erweitern das Vitest 'test' Objekt um unsere Fixtures
export const test = base.extend<MyFixtures>({
  diContainer: async ({}, use) => {
    container.clearInstances();
    await use(container);
  },

  fs: [async ({}, use) => {
    await use(installInMemoryFs("/storage/booking-data"));
  }, { auto: true }],

  vscodeContext: [async ({ diContainer }, use) => {
    const mockCtx = createExtensionContextMock();
    diContainer.registerInstance(EXTENSION_CONTEXT_TOKEN, mockCtx);
    await use(mockCtx as unknown as ExtensionContext);
  }, { auto: true }],

  timesheetRepo: async ({ diContainer, vscodeContext, fs }, use) => {
    const repo = new TimesheetRepository(vscodeContext);
    diContainer.registerInstance(TimesheetRepository, repo);
    await use(repo);
  },
});

export { expect } from "vitest";
