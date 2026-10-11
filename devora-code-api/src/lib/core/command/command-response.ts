export interface CommandResponse<TData = unknown> {
  id: string;
  code: number;
  data?: TData;
}

export interface CommandErrorResponse {
  id: string;
  code: number;
  error: Error;
}
