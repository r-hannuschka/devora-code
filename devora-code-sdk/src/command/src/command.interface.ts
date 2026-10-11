import type { Command } from "@devora-code/api";

export interface CommandHandler<TResult = unknown> {
  execute(): Promise<TResult> | TResult;
}

export type CommandHandlerConstructor<T extends Command = Command> = new (command: T) => CommandHandler;

