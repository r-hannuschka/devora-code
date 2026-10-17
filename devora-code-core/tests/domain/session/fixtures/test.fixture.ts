// tests/helpers/fixtures.ts
import { SessionService } from "@/domain/session";
import { test as base } from "@/support";

// Definition der im Test verfügbaren Fixtures
interface MyFixtures {
  sessionService: SessionService;
}

// Wir erweitern das Vitest 'test' Objekt um unsere Fixtures
export const test = base.extend<MyFixtures>({
  sessionService: async ({ diContainer }, use) => {
    const sessionService = diContainer.resolve(SessionService);
    await use(sessionService);
  },
});

export { expect } from "vitest";
