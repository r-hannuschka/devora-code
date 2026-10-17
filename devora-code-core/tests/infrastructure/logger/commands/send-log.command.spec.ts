import type { SendLogCommand } from "@devora-code/api/logger";
import { afterEach, describe, expect, vi } from "vitest";
import { test } from "@/support";
import { SendLogHandler } from "@src/infrastructure/logger/commands";

/**
 * SendLogHandler testet den Command-Handler-Wrapper:
 * - Delegiert payload an LoggerService.log()
 * - Liefert void
 * - Kein payload → kein Error, nichts passiert
 */
describe("SendLogHandler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_FILE_PATH;
  });

  // ========================================================================
  // Grundfunktionalitaet
  // ========================================================================

  test("sollte log-Eintrag schreiben wenn payload vorhanden", async ({ fs, loggerService }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    const command: SendLogCommand = {
      id: "log-1",
      type: "logger:send-log",
      payload: { level: "info", message: "Handler-Nachricht", context: "TestContext" },
    };

    await new SendLogHandler(command).execute();

    // Fire-and-forget: kurz warten bis Logger geschrieben hat
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("info");
    expect(logContent).toContain("Handler-Nachricht");
    expect(logContent).toContain("[TestContext]");
  });

  test("sollte log-Eintrag ohne context schreiben", async ({ fs, loggerService }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    const command: SendLogCommand = {
      id: "log-2",
      type: "logger:send-log",
      payload: { level: "warn", message: "Ohne-Kontext" },
    };

    await new SendLogHandler(command).execute();

    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("warn");
    expect(logContent).toContain("Ohne-Kontext");
    expect(logContent).not.toContain("[]");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte kein Error werfen wenn payload null ist", async () => {
    const command: SendLogCommand = {
      id: "log-3",
      type: "logger:send-log",
      payload: null as any
    };

    // Keine Exception — nur return
    expect(() => new SendLogHandler(command).execute()).not.toThrow();
  });

  test("sollte log-Eintrag anhaengen wenn Datei bereits existiert", async ({ fs, loggerService }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    // Erster Eintrag
    const cmd1: SendLogCommand = {
      id: "log-4a",
      type: "logger:send-log",
      payload: { level: "info", message: "Erster" },
    };
    new SendLogHandler(cmd1).execute();
    await new Promise((r) => setTimeout(r, 50));

    // Zweiter Eintrag — muss angehangen werden
    const cmd2: SendLogCommand = {
      id: "log-4b",
      type: "logger:send-log",
      payload: { level: "error", message: "Zweiter" },
    };
    new SendLogHandler(cmd2).execute();
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("Erster");
    expect(logContent).toContain("Zweiter");
  });
});
