import type { TimeEntry } from "@devora-code/api";
import { format } from "date-fns";
import type { TimeEntryDTO, TimesDataDTO } from "./model/time-entry.dto";

/** Ohne ID = neuer Eintrag, die ID wird hier vergeben. Das Original bleibt unverändert. */
export const toDto = (entry: TimeEntry): TimeEntryDTO => ({ ...entry, id: entry.id ?? crypto.randomUUID() });

export const monthOf = (entry: TimeEntryDTO): string => format(entry.startAt, "yyyy-MM");
export const dayOf = (entry: TimeEntryDTO): string => format(entry.startAt, "yyyy-MM-dd");

export function groupByMonth(entries: TimeEntryDTO[]): Map<string, TimeEntryDTO[]> {
  const groups = new Map<string, TimeEntryDTO[]>();
  for (const entry of entries) {
    const month = monthOf(entry);
    groups.set(month, [...(groups.get(month) ?? []), entry]);
  }
  return groups;
}

/** Monatsdatei { Tag: Einträge } -> flache Liste aller Einträge */
export const flatten = (month: TimesDataDTO): TimeEntryDTO[] => Object.values(month).flat();

/**
 * Bestehende Einträge mit gleicher ID werden aktualisiert (neues Objekt, das alte bleibt unverändert),
 * unbekannte Einträge hinten angehängt.
 */
export function mergeEntries(existing: TimeEntryDTO[], incoming: TimeEntryDTO[]): TimeEntryDTO[] {
  const updated = existing.map((entry) => {
    const match = incoming.find((i) => i.id === entry.id);
    return match ? { ...entry, ...match } : entry;
  });
  const known = new Set(existing.map((entry) => entry.id));
  return [...updated, ...incoming.filter((entry) => !known.has(entry.id))];
}

/** Flache Liste -> { Tag: Einträge }, der Tag kommt aus der startAt */
export const groupByDay = (entries: TimeEntryDTO[]): TimesDataDTO =>
  entries.reduce<TimesDataDTO>((days, entry) => {
    const day = dayOf(entry);
    return { ...days, [day]: [...(days[day] ?? []), entry] };
  }, {});
