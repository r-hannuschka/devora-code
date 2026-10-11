import { randomUUID } from "crypto";

// 1. Hilfstypen (Müssen VOR ihrer Verwendung definiert sein)
type ExtractType<T> = T extends { type: infer Type } ? (Type extends string ? Type : string) : string;
type ExtractPayload<T> = T extends { payload: infer Payload } ? Payload : undefined;

// 2. Das Rückgabe-Interface (Nutzt jetzt die stabilen Hilfstypen)
export interface CommandInstance<TCommand> {
  id: string;
  type: ExtractType<TCommand>;
  payload: ExtractPayload<TCommand>;
}

// 3. Die Fabrikfunktion
export function createCommand<TCommand extends { type: string; payload?: any }>(
  type: ExtractType<TCommand>,
  ...args: undefined extends ExtractPayload<TCommand> ? [payload?: ExtractPayload<TCommand>] : [payload: ExtractPayload<TCommand>]
): CommandInstance<TCommand> {
  return {
    id: randomUUID(),
    type: type as any,
    // args[0] greift das Objekt ab. Wenn args leer ist, wird es sauber 'undefined'
    payload: (args.length > 0 ? args[0] : undefined) as any,
  };
}
