import type { Command } from "../../core";

/** Month-Sheet für einen bestimmten Monat (yyyy-MM) */
export interface GetMonthPayload {
  month: string;
}

export type GetMonthCommand = Command<"timetracker:get-month", GetMonthPayload>;
