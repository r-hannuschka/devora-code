import { singleton } from "tsyringe";
import { Uri, workspace } from "vscode";

@singleton()
export class LoggerService {
  private static readonly LOG_FILE = "devora-code.log";

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

    // Fire-and-forget — Logger darf den Betrieb nicht stören
    (async () => {
      try {
        let existing = "";
        try {
          const buf = await workspace.fs.readFile(this.logUri);
          existing = decoder.decode(buf);
        } catch {
          // Datei existiert noch nicht – OK
        }

        const content = existing + JSON.stringify(entry) + "\n";
        await workspace.fs.writeFile(this.logUri, encoder.encode(content));
      } catch {
        // Logger darf nicht den Betrieb stören
      }
    })();
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
