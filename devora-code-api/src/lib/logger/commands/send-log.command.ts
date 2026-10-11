import type { Command } from "../../core";

/** Log-Eintrag an Core-Logger senden */
export interface LogPayload {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  context?: string;
}

export type SendLogCommand = Command<"logger:send-log", LogPayload>;
