import type { Command, CommandErrorResponse, CommandResponse } from "@devora-code/api/core";
import { container, singleton } from "tsyringe";

import { CommandController } from "@devora-code/sdk/command";
import { SatelliteService } from "@/domain/satellite";

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
  ]);

  constructor(private readonly satelliteService: SatelliteService) {}

  /**
   * Führt ein Command aus – entweder selbst (Core) oder an einen Satelliten delegiert.
   */
  async execute(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const type = command.type as string;

    // Core bedient es selbst
    if (CommandRouter.CORE_COMMANDS.has(type)) {
      return this.executeCoreCommand(command);
    }

    // Delegation an einen Satelliten
    return this.executeSatelliteCommand(command);
  }

  private async executeCoreCommand(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const commandController = container.resolve(CommandController);
    return commandController.exec(command);
  }

  private async executeSatelliteCommand(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    const type = command.type as string;
    const satellite = this.satelliteService.getSatelliteForCommand(type);

    console.log(`Satellite ${satellite}`)
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
