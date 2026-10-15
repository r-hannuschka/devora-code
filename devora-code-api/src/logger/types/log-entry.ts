import type { LogLevel } from "./log-level";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}