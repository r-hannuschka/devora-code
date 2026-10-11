import type { Command } from "../../core";

/** Timesheet für Zeitraum – Start-/Enddatum */
export interface GetPeriodPayload {
  startDate: string;
  endDate?: string;
}

export type GetPeriodCommand = Command<"timetracker:get-period", GetPeriodPayload>;
