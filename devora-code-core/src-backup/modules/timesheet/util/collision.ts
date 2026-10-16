import type { TimeEntry } from "@devora-code/api/core";
import { isAfter, isBefore } from "date-fns";

export enum CollisionResolution {
  NONE = "NONE",
  BLOCK = "BLOCK",
  SPLIT = "SPLIT",
}

/** Ergebnis einer Kollisionsprüfung. */
export interface CollisionResult {
  resolution: CollisionResolution;
  conflictingEntry?: TimeEntry;
}

/**
 * Pure function: prüft, ob ein neuer Eintrag mit bestehenden kollidiert.
 *
 * - BLOCK: geschlossener Eintrag überschneidet sich
 * - SPLIT: laufender Timer (endAt === null) überschneidet sich
 * - NONE: keine Kollision
 */
export function analyzeCollision(entries: TimeEntry[], newStartIso: string, newEndIso: string): CollisionResult {
  // Prio 1: Abgeschlossene Blockaden haben Vorrang (BLOCK)
  const closedConflict = entries.find((entry) => {
    return entry.endAt !== null && isBefore(newStartIso, entry.endAt) && isAfter(newEndIso, entry.startAt);
  });

  if (closedConflict) {
    return { resolution: CollisionResolution.BLOCK, conflictingEntry: closedConflict };
  }

  // Prio 2: Laufende Timer finden (SPLIT)
  const runningConflict = entries.find((entry) => entry.endAt === null);
  if (runningConflict && isAfter(newEndIso, runningConflict.startAt)) {
    return { resolution: CollisionResolution.SPLIT, conflictingEntry: runningConflict };
  }

  return { resolution: CollisionResolution.NONE };
}
