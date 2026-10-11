import { singleton } from "tsyringe";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { LogEntry } from "@devora-code/api";

@singleton()
export class LoggerService {
  private static readonly LOG_DIR = join(process.env.HOME ?? "", "devora-code-logs");
  private static readonly LOG_FILE = join(LoggerService.LOG_DIR, "devora-code.log");

  constructor() {
    mkdirSync(LoggerService.LOG_DIR, { recursive: true });
  }

  log(level: LogEntry["level"], message: string, context?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: context ? `[${context}] ${message}` : message,
    };

    try {
      appendFileSync(LoggerService.LOG_FILE, JSON.stringify(entry) + "\n");
    } catch {
      // Logger darf nicht den Betrieb stören
    }
  }

  debug(message: string, context?: string): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: string): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: string): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: string): void {
    this.log("error", message, context);
  }
}
