import type { TimeEntry } from "@devora-code/api";
import { addDays, differenceInCalendarDays } from "date-fns";
import { createTimeEntry } from "./create-time-entry";
import { dateLocal, endOfDay, nowLocal, startOfDay } from "./time";

/**
 * Mappt ein Zeitintervall (Start + Ende) auf storage-taugliche TimeEntries.
 * NUTZT JETZT DATE-FNS: Absolut sicher gegen Zeitzonen- und Schaltjahr-Fehler!
 */
export function normalizeTimeSpan(entry: TimeEntry): TimeEntry[] {
  // 💡 date-fns vergleicht rein die Kalendertage (Uhrzeit wird ignoriert)
  const dayDifference = differenceInCalendarDays(entry.endAt ?? nowLocal(), entry.startAt);

  // 1. Gleicher Kalendertag (Differenz ist 0): Keine Magie nötig
  if (dayDifference === 0) {
    return [{ ...entry }];
  }

  const result: TimeEntry[] = [];

  // 2. Erster Tag: Vom ursprünglichen startAt bis zum harten Tagesende (23:59:59)
  result.push({
    ...entry,
    endAt: endOfDay(entry.startAt),
  });

  // 3. Zwischen-Tage: Ganze Tage auffüllen
  const dateRunner = new Date(entry.startAt);

  // Wir laufen von Tag 1 bis kurz vor dem End-Tag
  for (let i = 1; i < dayDifference; i++) {
    const nextDay = addDays(dateRunner, i);
    result.push(createTimeEntry(entry.issueKey, startOfDay(nextDay), endOfDay(nextDay)));
  }

  // 4. Letzter Tag: Von Tagesanfang (00:00:00) bis zum echten endAt
  const lastDay = new Date(entry.endAt ?? dateLocal());
  const lastEntry = createTimeEntry(entry.issueKey, startOfDay(lastDay), entry.endAt);

  result.push(lastEntry);
  return result;
}
