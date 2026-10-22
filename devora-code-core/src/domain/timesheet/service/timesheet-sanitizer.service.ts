import { LoggerService } from "@/infrastructure/logger";
import { TimesheetRepository } from "@/infrastructure/timesheet";
import type { TimeEntry, TimesData } from "@devora-code/api/core";
import { endOfDay, format } from "date-fns";
import { basename } from "path";
import { singleton } from "tsyringe";
import type { Uri } from "vscode";
import { workspace } from "vscode";

@singleton()
export class TimesheetSanitizerService {
  private readonly decoder = new TextDecoder();

  constructor(
    private readonly timesheetRepository: TimesheetRepository,
    private readonly loggerService: LoggerService,
  ) {}

  // --- Close Open Timers ---

  async closeOpenTimers() {
    const fileList = await this.timesheetRepository.list();
    const total = fileList.length;
    const BATCH_SIZE = 10;

    let processedCount = 0;

    const processed: PromiseSettledResult<void>[] = [];
    while (processedCount < total) {
      const batch = fileList.slice(processedCount, processedCount + BATCH_SIZE);
      processedCount += batch.length;

      const results = await Promise.allSettled(batch.map((file) => this.sanitizeOpenSessions(file)));
      processed.push(...results);
    }

    // --- Error Report ---

    const errors = processed.filter((item) => item.status === "rejected").map((item) => item.reason);

    if (errors.length > 0) {
      this.loggerService.error(`Sanitizing timesheets failed: ${errors.join("\n")}`, "Timesheet Sanitizer");
    }
  }

  // --- Sanitize Open Sessions ---

  private async sanitizeOpenSessions(file: Uri) {
    const raw = await workspace.fs.readFile(file);
    const text = this.decoder.decode(raw);

    const timesData = JSON.parse(text) as TimesData;
    const sanitizedTimesData: TimesData = {};

    let isSanitized = false;

    for (const [day, entries] of Object.entries(timesData)) {
      const sanitizedEntries: TimeEntry[] = [];

      for (const entry of [...entries].reverse()) {
        if (entry.endAt !== null) {
          sanitizedEntries.unshift(entry);
          continue;
        }

        isSanitized = true;
        const lastWritten = sanitizedEntries.at(0);
        let endAt = lastWritten?.startAt;
        if (!endAt) {
          endAt = format(endOfDay(entry.startAt), "yyyy-MM-dd'T'HH:mm:ss");
        }

        sanitizedEntries.unshift({ ...entry, endAt });
      }
      sanitizedTimesData[day] = sanitizedEntries;
    }

    if (isSanitized) {
      return this.timesheetRepository.writeFile(basename(file.fsPath, ".json"), sanitizedTimesData);
    }
  }
}
