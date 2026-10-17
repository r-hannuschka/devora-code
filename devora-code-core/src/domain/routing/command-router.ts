import type { Command, CommandErrorResponse, CommandResponse } from "@devora-code/api/core";
import { container, singleton } from "tsyringe";

import { SatelliteService } from "@/domain/satellite";
import { NotificationService } from "@/infrastructure/notification";
import { CommandController, isErrorResponse } from "@devora-code/sdk/command";

/**
 * Der Command-Router.
 *
 * Er ist die Single Source of Truth für das Routing:
 * - Core-Commands (timetracker, logger) → eigener CommandController
 * - Satellite-Commands (issues, focus) → registrierter Satellit
 *
 * Der Router hat keine Abhängigkeiten zu konkreten Commands –
 * die Core-Command-Types kommen aus @devora-code/api.
 */
@singleton()
export class CommandRouter {
  /**
   * Die Command-Types die der Core selbst bedient.
   * Alle anderen Commands gehen an registrierte Satelliten.
   */
  private static readonly CORE_COMMANDS = new Set<string>([
    "session:start",
    "session:stop",
    "session:get-active",
    "session:reset-session",
    "timesheet:get-month",
    "timesheet:get-period",
    "timesheet:add-entry",
    "timesheet:open",
    "timesheet:sync-from-raw",
  ]);

  constructor(
    private readonly satelliteService: SatelliteService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Führt ein Command aus – entweder selbst (Core) oder an einen Satelliten delegiert.
   */
  async execute(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const type = command.type as string;

    // Core bedient es selbst
    if (CommandRouter.CORE_COMMANDS.has(type)) {
      return this.executeCoreCommand(command).then((response) => {
        if (isErrorResponse(response)) {
          this.notificationService.showError(response.error.message);
        }

        return response;
      });
    }

    // Delegation an einen Satelliten
    return this.executeSatelliteCommand(command).catch((error) => {
      const satellite = this.satelliteService.getSatelliteForCommand(type);
      this.notificationService.showError(`[Sattelite:${satellite?.id}]: ${error.message}`);
      throw error;
    });
  }

  private async executeCoreCommand(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const commandController = container.resolve(CommandController);
    return commandController.exec(command);
  }

  private async executeSatelliteCommand(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const type = command.type as string;
    const satellite = this.satelliteService.getSatelliteForCommand(type);

    if (!satellite) {
      return this.notFoundResponse(command.id, type);
    }

    return satellite.handleHostCommand(command);
  }

  private notFoundResponse(id: string, commandType: string): CommandErrorResponse {
    return {
      id,
      code: 404,
      error: new Error(`Unknown command: "${commandType}"`),
    };
  }
}
