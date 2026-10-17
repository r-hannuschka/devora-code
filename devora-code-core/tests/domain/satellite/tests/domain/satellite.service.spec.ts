import { describe, expect, vi } from "vitest";
import { test } from "../../fixtures/test.fixture";

/**
 * SatelliteService tests: Registrierung von Satelliten und Kommando-Routing.
 */
describe("SatelliteService", () => {
  // ========================================================================
  // registerSatellite
  // ========================================================================

  test("sollte Satelliten registrieren und Commands der Dispatch-Tabelle hinzufuegen", async ({ satelliteService }) => {
    const mockSatellite = {
      id: "test-satellite",
      commands: ["test:command-1", "test:command-2"],
      handleHostCommand: vi.fn().mockResolvedValue({ success: true }),
    };

    satelliteService.registerSatellite(mockSatellite);

    expect(satelliteService.hasSatelliteForCommand("test:command-1")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("test:command-2")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("test:command-3")).toBe(false);
  });

  test("sollte mehrere Satelliten registrieren koennen", async ({ satelliteService }) => {
    const satelliteA = {
      id: "satellite-a",
      commands: ["a:cmd"],
      handleHostCommand: vi.fn().mockResolvedValue({ ok: true }),
    };
    const satelliteB = {
      id: "satellite-b",
      commands: ["b:cmd"],
      handleHostCommand: vi.fn().mockResolvedValue({ ok: true }),
    };

    satelliteService.registerSatellite(satelliteA);
    satelliteService.registerSatellite(satelliteB);

    expect(satelliteService.hasSatelliteForCommand("a:cmd")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("b:cmd")).toBe(true);
  });

  test("sollte Warnung logs wenn Command bereits registriert ist", async ({ satelliteService, loggerService }) => {
    vi.spyOn(loggerService, "warn");

    const satelliteA = {
      id: "sat-a",
      commands: ["shared:cmd"],
      handleHostCommand: vi.fn().mockResolvedValue({}),
    };
    const satelliteB = {
      id: "sat-b",
      commands: ["shared:cmd"],
      handleHostCommand: vi.fn().mockResolvedValue({}),
    };

    satelliteService.registerSatellite(satelliteA);
    satelliteService.registerSatellite(satelliteB);

    expect(loggerService.warn).toHaveBeenCalledWith(
      expect.stringContaining("shared:cmd"),
    );
  });

  test("sollte mehrere Commands eines Satelliten auf einmal registrieren", async ({ satelliteService }) => {
    const mockSatellite = {
      id: "multi-satellite",
      commands: ["multi:one", "multi:two", "multi:three"],
      handleHostCommand: vi.fn().mockResolvedValue({}),
    };

    satelliteService.registerSatellite(mockSatellite);

    expect(satelliteService.hasSatelliteForCommand("multi:one")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("multi:two")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("multi:three")).toBe(true);
  });

  // ========================================================================
  // getSatelliteForCommand
  // ========================================================================

  test("sollte registrierten Satelliten fuer Command zurueckgeben", async ({ satelliteService }) => {
    const mockSatellite = {
      id: "fetcher",
      commands: ["git:fetch", "git:push"],
      handleHostCommand: vi.fn().mockResolvedValue({}),
    };

    satelliteService.registerSatellite(mockSatellite);

    const result = satelliteService.getSatelliteForCommand("git:fetch");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("fetcher");
  });

  test("sollte null zurueckgeben wenn kein Satellit fuer Command registriert ist", async ({ satelliteService }) => {
    const result = satelliteService.getSatelliteForCommand("nonexistent:command");

    expect(result).toBeNull();
  });

  // ========================================================================
  // hasSatelliteForCommand
  // ========================================================================

  test("sollte true zurueckgeben wenn Command von Satellit bedient wird", async ({ satelliteService }) => {
    const mockSatellite = {
      id: "issue-tracker",
      commands: ["jira:create", "jira:transition"],
      handleHostCommand: vi.fn().mockResolvedValue({}),
    };

    satelliteService.registerSatellite(mockSatellite);

    expect(satelliteService.hasSatelliteForCommand("jira:create")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("jira:transition")).toBe(true);
  });

  test("sollte false zurueckgeben wenn kein Satellit registriert ist", async ({ satelliteService }) => {
    expect(satelliteService.hasSatelliteForCommand("jira:create")).toBe(false);
  });

  test("sollte false zurueckgeben auch nach Registrierung anderer Satelliten", async ({ satelliteService }) => {
    const mockSatellite = {
      id: "git-sat",
      commands: ["git:fetch"],
      handleHostCommand: vi.fn().mockResolvedValue({}),
    };

    satelliteService.registerSatellite(mockSatellite);

    expect(satelliteService.hasSatelliteForCommand("git:fetch")).toBe(true);
    expect(satelliteService.hasSatelliteForCommand("git:push")).toBe(false);
  });
});
