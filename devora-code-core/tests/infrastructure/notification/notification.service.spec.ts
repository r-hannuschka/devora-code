import { NotificationService } from "@/infrastructure/notification";
import * as vscode from "vscode";
import { afterEach, describe, expect, vi } from "vitest";
import { test } from "@/support";

/**
 * NotificationService testet die drei Notification-Methoden:
 * - showError: zeigt Error-Message mit optionaler Error-Nachricht
 * - showWarning: zeigt Warning-Message
 * - showInfo: zeigt Info-Message
 *
 * Alle Methoden delegieren an vscode.window — die Tests prüfen,
 * dass die korrekte vscode-Methode aufgerufen wird.
 */
describe("NotificationService", () => {
  afterEach(() => vi.restoreAllMocks());

  // ========================================================================
  // showError
  // ========================================================================

  test("sollte showErrorMessage aufrufen mit der Nachricht", async ({ notificationService }) => {
    const message = "Etwas ist schiefgelaufen";
    vi.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined);

    notificationService.showError(message);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`${message} `);
  });

  test("sollte Error-Nachricht anhängen wenn Error-Objekt übergeben", async ({ notificationService }) => {
    const message = "Verbindung fehlgeschlagen";
    const error = new Error("Timeout");
    vi.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined);

    notificationService.showError(message, error);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`${message}  (${error.message})`);
  });

  test("sollte showErrorMessage aufrufen ohne Error-Teil wenn error undefined", async ({ notificationService }) => {
    const message = "Etwas ist schiefgelaufen";
    vi.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined);

    notificationService.showError(message, undefined);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`${message} `);
  });

  // ========================================================================
  // showWarning
  // ========================================================================

  test("sollte showWarningMessage aufrufen mit der Nachricht", async ({ notificationService }) => {
    const message = "Achtung: Speicher wird voll";
    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue(undefined);

    notificationService.showWarning(message);

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(message);
  });

  // ========================================================================
  // showInfo
  // ========================================================================

  test("sollte showInformationMessage aufrufen mit der Nachricht", async ({ notificationService }) => {
    const message = "Speicherung erfolgreich";
    vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);

    notificationService.showInfo(message);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message);
  });

  // ========================================================================
  // Combined: Fehlerhafter Input
  // ========================================================================

  test("sollte auch leere Nachrichten korrekt weiterleiten", async ({ notificationService }) => {
    vi.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined);

    notificationService.showError("");

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(" ");
  });

  test("sollte auch leere Error-Nachricht korrekt anhängen", async ({ notificationService }) => {
    vi.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined);

    notificationService.showError("Vorgang fehlgeschlagen", new Error(""));

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Vorgang fehlgeschlagen  ()");
  });
});
