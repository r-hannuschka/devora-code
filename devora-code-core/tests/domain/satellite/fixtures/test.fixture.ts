import { SatelliteService } from "@/domain/satellite";
import { test as base } from "@/support";

interface MyFixtures {
  satelliteService: SatelliteService;
}

export const test = base.extend<MyFixtures>({
  satelliteService: async ({ diContainer }, use) => {
    const satelliteService = diContainer.resolve(SatelliteService);
    await use(satelliteService);
  },
});

export { expect } from "vitest";
