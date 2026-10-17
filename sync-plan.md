# Plan: Timesheet Sync — von Merge zu Range-Replace

## Problem

Aktuell macht `syncTimesData` (timesheet.service.ts:166-189) ein **shallow merge** pro Tag:

```ts
.then((raw: TimesData = {}) => ({ ...raw, ...timesData }))
```

Das heisst:
- Tage die im Raw-File **vorkommen** → werden überschrieben ✅
- Tage die **nicht** im Raw-File vorkommen → bleiben in der DB ❌ (stehengeblieben)

Wenn der User z.B. nur 3 Tage sync't, bleiben alle anderen Tage des Monats unverändert. Das ist ein Merge, kein Sync.

## Filename-Format

Der Raw-File heisst: `yyyy-MM-dd_yyyy-MM-dd.devora-timesheet`

Das gibt uns die **explizite Sync-Range**. Beispiel:
- Filename: `2025-01-03_2025-01-05.devora-timesheet` → Range: 03.01. bis 05.01.
- Filename: `2025-01-14_2025-01-21.devora-timesheet` → Range: 14.01. bis 21.01.

## Gewünschtes Verhalten

**Brutal replace** innerhalb der Sync-Range aus dem Filename:
- Alle Tage **in der Range** → werden komplett aus der DB gelöscht und durch Raw ersetzt
- Alle Tage **außerhalb der Range** → bleiben in der DB unverändert

Beispiel:
```
DB vor Sync:  [01, 02, 03, 04, 05, 06, ..., 31]  (ganzer Monat)
Filename:     2025-01-03_2025-01-05.devora-timesheet  (Range: 03-05)
Raw-File:     [03, 04, 05]

DB nach Sync: [01, 02, 03*, 04*, 05*, 06, ..., 31]
              ^^^^^^^^^^^^^^^^ Range wird ersetzt ^^^^^^^^^^^
```

## Änderung

### 1. `syncFromRaw` — Range als Parameter mitgeben

**Aktuell (Zeile 145-164):**
```ts
async syncFromRaw(raw: TimesData) {
  const groupedByMonth = new Map<String, TimesData>();
  // ... group by month ...
  const bufferedRaw: Record<string, TimesData> = Object.fromEntries(groupedByMonth);
  return this.syncTimesData(bufferedRaw);
}
```

**Änderung:** Range aus Filename extrahieren und mitgeben.

Der Command Handler hat den Filename:
```ts
// activeDocument.fileName = "2025-01-03_2025-01-05.devora-timesheet"
const match = activeDocument.fileName.match(/^(.+?)_(.+?)\.devora-timesheet$/);
const range = { minDate: match[1], maxDate: match[2] };
await timesheetService.syncFromRaw(raw, range);
```

`syncFromRaw` nimmt dann `range` mit in die Gruppierung:
```ts
async syncFromRaw(raw: TimesData, range: { minDate: string; maxDate: string }) {
  const groupedByMonth = new Map<string, { data: TimesData; range: typeof range }>();
  // ...
  return this.syncTimesData(groupedByMonth);
}
```

### 2. `syncTimesData` — Range-Replace statt Merge

**Aktuell (Zeile 166-189):**
```ts
private async syncTimesData(data: Record<string, TimesData>) {
  for (const [fileName, timesData] of Object.entries(data)) {
    const write$ = this.repository
      .getMonth(fileName)
      .catch(() => ({}) as TimesData)
      .then((raw: TimesData = {}) => ({ ...raw, ...timesData }))  // ← MERGE
      // ...
  }
}
```

**Nachher:**
```ts
private async syncTimesData(data: Map<string, { data: TimesData; range: Range }>) {
  for (const [month, { data: timesData, range }] of data.entries()) {
    const write$ = this.repository
      .getMonth(month)
      .catch(() => ({}) as TimesData)
      .then((existing: TimesData = {}) => {
        // Tage in der Range löschen
        const result = { ...existing };
        for (const date of Object.keys(existing)) {
          if (date >= range.minDate && date <= range.maxDate) {
            delete result[date];  // ← BRUTAL ERSETZEN
          }
        }
        // Raw-Daten reinschreiben
        Object.assign(result, timesData);
        return result;
      })
      // ...
  }
}
```

## Dateien

| Datei | Änderung |
|---|---|
| `.../commands/timesheet-sync-from-raw.command.ts` | Range aus Filename extrahieren und an `syncFromRaw` übergeben |
| `.../service/timesheet.service.ts` | `syncFromRaw` + `syncTimesData` auf Range-Replace umstellen |

Keine Repository-Änderungen nötig.

## Risiken

- Einträge in der Range, die **nicht** im Raw vorkommen, werden **gelöscht** — das ist das gewünschte Verhalten
- Die Range kommt aus dem **Filename**, nicht aus den Daten — damit ist das Verhalten deterministisch und kein Raten nötig
