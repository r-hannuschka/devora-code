import type { CommandResponse, CommandErrorResponse } from "./command.bus";

export function isErrorResponse(response: CommandResponse | CommandErrorResponse): response is CommandErrorResponse {
  return response.code !== 0;
}