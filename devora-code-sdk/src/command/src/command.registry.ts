import { singleton } from "tsyringe";
import { CommandHandlerConstructor } from "./command.interface";

@singleton()
export class CommandRegistry {
  private readonly handlerMap = new Map<string, CommandHandlerConstructor>();

  public register(type: string, ctor: CommandHandlerConstructor): void {
    this.handlerMap.set(type, ctor);
    console.debug(`Handler registriert: "${type}"`);
  }

  public get(type: string): CommandHandlerConstructor {
    const ctor = this.handlerMap.get(type);
    if (!ctor) {
      throw new Error(`Kein Handler für Command-Typ gefunden: "${type}"`);
    }
    return ctor;
  }
}
