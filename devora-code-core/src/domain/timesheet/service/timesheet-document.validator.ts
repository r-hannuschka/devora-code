import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { LoggerService } from "@/infrastructure/logger";
import type { TimesDataDTO } from "@/infrastructure/timesheet";
import type { TimesheetRange } from "@devora-code/api/timesheet";
import { AsyncQueue } from "@devora-code/sdk";
import { inject, singleton } from "tsyringe";
import {
  Diagnostic,
  DiagnosticSeverity,
  languages,
  Range,
  window,
  workspace,
  type DiagnosticCollection,
  type ExtensionContext,
  type TextDocument,
} from "vscode";
import { TimesheetRawValidator } from "./timesheet-raw.validator"; // Pfad anpassen

@singleton()
export class TimesheetDocumentValidatorService {
  private readonly queue = new AsyncQueue();

  private abortController: AbortController | null = null;
  private diagnosticCollection: DiagnosticCollection;

  constructor(
    @inject(EXTENSION_CONTEXT_TOKEN) private readonly extensionContext: ExtensionContext,
    private readonly logger: LoggerService,
    private readonly rawValidator: TimesheetRawValidator,
  ) {
    this.diagnosticCollection = languages.createDiagnosticCollection("devora-timesheet");
    this.extensionContext.subscriptions.push(this.diagnosticCollection);
  }

  public initialize() {
    this.extensionContext.subscriptions.push(
      workspace.onDidOpenTextDocument((doc) => this.queue.enqueue(() => this.validatedDocument(doc))),
      workspace.onDidChangeTextDocument((event) => this.handleDocumentChange(event.document)),
      window.onDidChangeActiveTextEditor((editor) => this.queue.enqueue(() => this.validatedDocument(editor?.document))),
    );
  }

  private handleDocumentChange(doc: TextDocument) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    this.debounce(300, this.abortController.signal)
      .then(() => {
        this.queue.enqueue(() => this.validatedDocument(doc));
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.error(error);
      });
  }

  private validatedDocument(doc?: TextDocument) {
    const path = doc?.uri?.fsPath;

    if (!doc || !path || !path.endsWith(".devora-timesheet")) return;
    this.diagnosticCollection.delete(doc.uri);

    const range = this.extractDateRangeFromFilename(doc.uri.fsPath);
    if (!range) return;

    let jsonData: TimesDataDTO;
    try {
      jsonData = JSON.parse(doc.getText());
    } catch {
      return; // Ungültiges JSON beim Tippen lautlos ignorieren
    }

    const errors = this.rawValidator.validate(jsonData as any, range);
    if (!errors) return;

    const diagnostics: Diagnostic[] = [];
    for (const error of errors) {
      const lineIndex = this.findLineIndexForText(doc, `"${error.dateStr}"`);

      if (lineIndex !== -1) {
        const line = doc.lineAt(lineIndex);
        const vscodeRange = new Range(lineIndex, 0, lineIndex, line.text.length);

        diagnostics.push(new Diagnostic(vscodeRange, `[Devora Code] ${error.message}`, DiagnosticSeverity.Error));
      }
    }

    if (diagnostics.length > 0) {
      this.diagnosticCollection.set(doc.uri, diagnostics);
    }
  }

  private extractDateRangeFromFilename(path: string): TimesheetRange | null {
    const namePattern = /(?<start>\d{4}-\d{2}-\d{2})_(?<end>\d{4}-\d{2}-\d{2})\.devora-timesheet$/;
    const nameMatch = path.match(namePattern);

    if (!nameMatch || !nameMatch.groups) return null;
    const { start, end } = nameMatch.groups;

    return start && end ? { minDate: start, maxDate: end } : null;
  }

  private findLineIndexForText(doc: TextDocument, searchText: string): number {
    for (let i = 0; i < doc.lineCount; i++) {
      if (doc.lineAt(i).text.includes(searchText)) return i;
    }
    return -1;
  }

  private debounce(ms: number, signal: AbortSignal): Promise<void> {
    const delayTime = process.env.NODE_ENV === "test" || process.env.VITEST ? 0 : ms;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(), delayTime);

      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        const abortError = new Error("Aborted");
        abortError.name = "AbortError";
        reject(abortError);
      });
    });
  }
}
