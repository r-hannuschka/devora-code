import type { TimesData } from "@devora-code/api/core";
import type { TimesheetRange } from "@devora-code/api/timesheet";
import { isWithinInterval, parseISO } from "date-fns";
import { singleton } from "tsyringe";

export interface ValidationError {
  dateStr: string;
  code: "OUT_OF_RANGE";
  message: string;
}

@singleton()
export class TimesheetRawValidator {
  /**
   * Validiert ein flaches TimesData-Objekt gegen eine Range
   */
  public validate(raw: TimesData, range: TimesheetRange): ValidationError[] | null {
    const errors: ValidationError[] = [];

    for (const dateStr of Object.keys(raw)) {
      if (!this.isDateInRange(dateStr, range)) {
        errors.push({
          dateStr,
          code: "OUT_OF_RANGE",
          message: `Datum außerhalb des erlaubten Bereichs (${range.minDate} bis ${range.maxDate})!`,
        });
      }
    }

    return errors.length > 0  ? errors : null;
  }

  /**
   * Prüft plattformunabhängig, ob ein Datums-String im Intervall liegt
   */
  public isDateInRange(dateStr: string, range: TimesheetRange): boolean {
    try {
      const currentDate = parseISO(dateStr);
      const startInterval = parseISO(range.minDate);
      const endInterval = parseISO(range.maxDate);

      return isWithinInterval(currentDate, { start: startInterval, end: endInterval });
    } catch {
      return false;
    }
  }
}
