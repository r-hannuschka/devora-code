import { format } from "date-fns";

/**
 * Lokale Zeit im ISO-Format — KEIN UTC!
 * "2024-01-15T14:30:00" statt "2024-01-15T13:30:00.000Z"
 */
export function nowLocal(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Nur das Datum als "YYYY-MM-DD" im lokalen Zeitformat.
 */
export function dateLocal(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Ende des Tages im lokalen Format: "2024-01-15T23:59:59"
 */
export function endOfDay(date: Date | string = new Date()): string {
  return format(date, "yyyy-MM-dd'T'23:59:59");
}

/**
 * Anfang des Tages im lokalen Format: "2024-01-15T00:00:00"
 */
export function startOfDay(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd'T'00:00:00");
}

/**
 * Datum aus einem ISO-String (lokales Format) extrahieren: "2024-01-15"
 */
export function extractDayKey(isoString: string): string {
  return isoString.substring(0, 10);
}
