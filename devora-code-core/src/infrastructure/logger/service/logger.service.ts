import { AsyncQueue } from "@devora-code/sdk";
import { singleton } from "tsyringe";
import { Uri, workspace } from "vscode";

@singleton()
export class LoggerService {
  private static readonly LOG_FILE = "devora-code.log";
  private readonly queue: AsyncQueue = new AsyncQueue();
  private isProcessing = false;

  /**
   * Base-Path für die Log-Datei.
   * - In Tests: Umgebungsvariable `LOG_FILE_PATH` (z.B. `/storage/booking-data`)
   * - In Produktion: `workspace.workspaceFolders[0]?.uri`
   */
  private get logUri(): Uri {
    const logPath = process.env.LOG_FILE_PATH;
    if (logPath) {
      return Uri.joinPath(Uri.parse(logPath), LoggerService.LOG_FILE);
    }

    const baseFolder = workspace.workspaceFolders?.[0]?.uri ?? Uri.parse("file:///dev/null");
    return Uri.joinPath(baseFolder, ".devora-code", LoggerService.LOG_FILE);
  }

  log(level: string, message: string, context?: string): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: context ? `[${context}] ${message}` : message,
    };

    const logLine = JSON.stringify(entry);
    this.queue.enqueue(async () => {
      try {
        let existing = "";
        try {
          const buf = await workspace.fs.readFile(this.logUri);
          existing = decoder.decode(buf);
        } catch {
          // Datei existiert noch nicht – OK
        }

        const content = existing + logLine + "\n";
        await workspace.fs.writeFile(this.logUri, encoder.encode(content));
      } catch (error) {}
    });
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

const encoder = new TextEncoder();
const decoder = new TextDecoder();
