import { afterEach, describe, expect, vi } from "vitest";
import { test } from "../fixture";

/**
 * LoggerService testet das Schreiben und Anhängen der Log-Datei
 * über workspace.fs.
 * - info/debug/warn/error: delegieren an public log() mit korrektem Level
 * - Fire-and-forget: kein await nötig, Promise muss vor Assert warten
 */
describe("LoggerService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_FILE_PATH;
  });

  // ========================================================================
  // Grundfunktionalitaet
  // ========================================================================

  test("sollte log-Eintrag an die Log-Datei schreiben", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.info("Test-Nachricht");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("info");
    expect(logContent).toContain("Test-Nachricht");
  });

  test("sollte debug-Level korrekt schreiben", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.debug("Debug-Nachricht");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("debug");
    expect(logContent).toContain("Debug-Nachricht");
  });

  test("sollte warn-Level korrekt schreiben", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.warn("Warn-Nachricht");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("warn");
    expect(logContent).toContain("Warn-Nachricht");
  });

  test("sollte error-Level korrekt schreiben", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.error("Error-Nachricht");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("error");
    expect(logContent).toContain("Error-Nachricht");
  });

  // ========================================================================
  // Context-Unterstuertzung
  // ========================================================================

  test("sollte context-Label vor der Nachricht einfuegen", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.info("Mit-Context", "MeinContext");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("[MeinContext]");
    expect(logContent).toContain("Mit-Context");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  test("sollte mehrere Eintraege anhaengen", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.info("Erster");
    await new Promise((r) => setTimeout(r, 50));

    loggerService.error("Zweiter");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("Erster");
    expect(logContent).toContain("Zweiter");
  });

  test("sollte Timestamp mit ISO-Format schreiben", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    loggerService.info("Timestamp-Test");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    const entry = JSON.parse(logContent.trim());
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("sollte auch ohne Log-Datei starten (Datei existiert noch nicht)", async ({ loggerService, fs }) => {
    const logDir = "/storage/booking-data";
    process.env.LOG_FILE_PATH = logDir;
    fs.dirs.add(logDir);

    // Datei existiert noch nicht – Logger darf nicht craschen
    loggerService.info("Erste-Log");
    await new Promise((r) => setTimeout(r, 50));

    const logContent = fs.files.get(`${logDir}/devora-code.log`);
    expect(logContent).toContain("Erste-Log");
  });
});
