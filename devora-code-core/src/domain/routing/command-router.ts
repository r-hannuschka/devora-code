import type { Command, CommandErrorResponse, CommandResponse } from "@devora-code/api/core";
import { singleton } from "tsyringe";

import { NotificationService } from "@/infrastructure/notification";
import { DEVORA_CODE_SERVICES, DevoraCodeServices, SettingsService } from "@/infrastructure/settings";
import { CommandController, isErrorResponse, type ISatelliteController } from "@devora-code/sdk";
import { extensions } from "vscode";

/**
 * Central routing hub for all commands.
 *
 * Acts as the single source of truth for command dispatch:
 * - Core commands (timetracker, logger) → handled by the local CommandController
 * - Satellite commands (issues, focus) → delegated to a satellite VSCode extension
 *
 * The router has no dependencies on concrete command implementations –
 * core command types are imported from @devora-code/api.
 */
@singleton()
export class CommandRouter {
  private services = new Map<DevoraCodeServices, Promise<ISatelliteController>>();

  constructor(
    private readonly settingsService: SettingsService,
    private readonly notificationService: NotificationService,
    private readonly commandController: CommandController,
  ) {}

  /**
   * Executes a command — either locally (Core) or delegates to a satellite extension.
   */
  async execute(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const type = command.type as string;

    if (this.commandController.hasCommandHandler(command.type)) {
      const response = await this.commandController.exec(command);
      if (isErrorResponse(response)) {
        this.notificationService.showError(response.error.message);
      }
      return response;
    }

    // Delegate to a satellite extension
    try {
      return await this.executeSatelliteCommand(command);
    } catch (error: unknown) {
      const serviceKey = this.extractServiceKey(type);
      const errorMsg = error instanceof Error ? error.message : "unknown error";
      this.notificationService.showError(`[Satellite:${serviceKey}]: ${errorMsg}`);

      return {
        id: command.id,
        code: 500,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Delegates a command to the appropriate satellite extension.
   *
   * Extracts the service key from the command type (format: "service:action"),
   * resolves the satellite controller, and forwards the command.
   */
  private async executeSatelliteCommand(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const serviceKey = this.extractServiceKey(command.type);
    const satellite = await this.getSatelliteForCommand(serviceKey);
    if (!satellite) {
      return this.notFoundResponse(command.id, serviceKey);
    }

    return satellite.handleHostCommand(command);
  }

  /**
   * Returns an error response for an unknown satellite service.
   */
  private notFoundResponse(id: string, commandType: string): CommandErrorResponse {
    return {
      id,
      code: 404,
      error: new Error(`Unknown command: "${commandType}"`),
    };
  }

  /**
   * Returns the ISatelliteController for a given service key, or null if none is configured.
   *
   * Uses a Promise-based deduplication cache: concurrent callers requesting the same
   * satellite share the same activation Promise instead of triggering duplicate
   * extension activations. The cached Promise persists after resolution — no stale
   * state concerns since VSCode does not deactivate extensions during normal operation.
   */
  private async getSatelliteForCommand(key: DevoraCodeServices): Promise<ISatelliteController> {
    let cached = this.services.get(key);
    if (cached) return cached;
    // Resolve extension ID from settings
    const service$ = new Promise<ISatelliteController>(async (resolve, reject) => {
      try {
        const serviceId = this.settingsService.get("services")?.[key];
        if (!serviceId) {
          reject(new Error("No satellite service configured"));
          return;
        }
        // Locate the VSCode extension by its ID
        const extension = extensions.getExtension<ISatelliteController>(serviceId);
        if (!extension) {
          reject(new Error(`No satellite service found for id ${serviceId}`));
          return;
        }
        // Lazy-activate the extension if not yet loaded
        if (!extension.isActive) {
          await extension.activate();
        }
        // Validate that the extension exports a valid controller
        const controller = extension.exports;
        if (!controller || typeof controller.handleHostCommand !== "function") {
          return reject(new Error(`Extension "${serviceId}" does not export a valid ISatelliteController.`));
        }
        resolve(extension.exports);
      } catch (error) {
        reject(error);
      }
    });
    // Cache and return the shared promise for deduplication
    this.services.set(key, service$);
    return service$;
  }

  /**
   * Extracts the service key from a command type string.
   *
   * Parses the "service:action" format (e.g. "jira:fetch-issues") and
   * validates the service part against the known DEVORA_CODE_SERVICES list.
   * @throws Error if the format is invalid or the service is not recognized.
   */
  private extractServiceKey(key: string): DevoraCodeServices {
    const colonIndex = key.indexOf(":");

    if (colonIndex === -1) {
      throw new Error("No Service name found");
    }

    const extractedKey = key.substring(0, colonIndex);
    const serviceKey = DEVORA_CODE_SERVICES.find((serviceKey) => serviceKey === extractedKey);

    if (!serviceKey) {
      throw new Error("Service key not accepted");
    }
    return serviceKey;
  }
}
