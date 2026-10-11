import type { Command, CommandErrorResponse, CommandResponse } from "@devora-code/api";
import { createHash } from "crypto";
import { singleton } from "tsyringe";
import { CommandRegistry } from "./command.registry";

export type { CommandErrorResponse, CommandResponse };

@singleton()
export class CommandController {
  private readonly TIMEOUT_MS = 30_000;
  private readonly runningCommandMap = new Map<string, Promise<{ code: number; data?: any } | { code: number; error: Error }>>();

  constructor(private readonly commandRegistry: CommandRegistry) {}

  // Public API
  public async exec<TCommand extends Command>(command: Command): Promise<CommandResponse | CommandErrorResponse> {
    if (!command.type) {
      throw new Error("Command-Typ ist erforderlich");
    }

    const token = this.createDeduplicationToken(command);

    // Dedup: zwei identische Commands teilen sich ein Promise
    let runningCommand = this.runningCommandMap.get(token);
    if (!runningCommand) {
      runningCommand = Promise.race([
        this.executeCommand(command),
        this.createTimeout(this.TIMEOUT_MS, `Command "${command.type}" hat Timeout nach 30 Sekunden`),
      ])
        .catch((error: unknown) => this.createErrorResponse(command.type, error))
        .finally(() => this.runningCommandMap.delete(token));

      this.runningCommandMap.set(token, runningCommand);
    }

    // Jeder Aufrufer bekommt seine Container-ID in der Response
    const response = await runningCommand;
    return {
      id: command.id,
      ...response,
    } as CommandResponse | CommandErrorResponse;
  }

  // Execution
  private async executeCommand(command: Command): Promise<{ code: number; data?: any }> {
    const commandEntity = this.commandRegistry.get(command.type);
    const handlerInstance = new commandEntity(command);
    const result = await handlerInstance.execute();

    return {
      code: 0,
      data: result,
    };
  }

  // Error Handling
  private createErrorResponse(commandName: string, error: unknown): { code: number; error: Error } {
    return {
      code: 500,
      error: new Error(`${commandName}: ${(error as Error).message}`),
    };
  }

  // Utilities
  private createDeduplicationToken(command: Command): string {
    const payloadHash = createHash("sha256")
      .update(JSON.stringify(command.payload ?? {}))
      .digest("hex")
      .substring(0, 8);
    return `${command.type}_${payloadHash}`;
  }

  private createTimeout(ms: number, errorMessage: string): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(errorMessage), ms));
  }
}
