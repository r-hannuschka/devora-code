import { assertInInjectionContext, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, timer } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

/**
 * Erstellt eine reaktive, sich selbst zerstörende Stoppuhr auf Basis einer Startzeit.
 * Muss im Injection-Context (z. B. Constructor oder Feld-Initialisierung) aufgerufen werden!
 */
export function createElapsedTimer(startAtSignal: Signal<string | null>) {
  // Sicherheitsschranke: Verhindert, dass jemand die Funktion falsch aufruft
  assertInInjectionContext(createElapsedTimer);

  return rxResource({
    params: () => ({ startAt: startAtSignal() }),
    stream: ({ params }) => {
      const { startAt } = params;
      if (!startAt) return EMPTY;

      const startTime = new Date(startAt).getTime();

      return timer(0, 1000).pipe(
        map(() => {
          const diffMs = Date.now() - startTime;
          return formatToHms(diffMs);
        })
      );
    }
  });
}

function formatToHms(ms: number): string {
  if (ms < 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // padStart sorgt für die führenden Nullen (z.B. "02:05:09")
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');

  return `${h}:${m}:${s}`;
}
