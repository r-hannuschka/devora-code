import { container } from "tsyringe";
import { CommandRegistry } from "./command.registry";
import { CommandHandlerConstructor } from "./command.interface";

export function RegisterCommand(domain: string) {
  return function (ctor: CommandHandlerConstructor<any>) {
    const registry = container.resolve(CommandRegistry);
    registry.register(domain, ctor);
  };
}
