# Edge-Case-Katalog

> Dieser Katalog listet alle projektspezifischen Edge Cases, die in Integrationstests
> abgedeckt werden müssen. Jeder Case enthält den Pattern, die Beschreibung und ein
> Codesnippet.

---

## Mitternacht / Cross-Day

Eintrag erstreckt sich über die Tagesgrenze und muss in zwei Einträge aufgeteilt werden.

**Beschreibung**: Wenn `startAt` und `endAt` auf verschiedene Tage fallen, muss die
Business-Logik den Eintrag am 23:59:59 des Start-Tags und bei 00:00:00 des Folge-Tags
trennen.

**Tests**:
- Eintrag 22:00 bis 02:00 → zwei Einträge (22:00-23:59:59, 00:00-02:00)
- Eintrag 20:29 bis 00:30 → drei Einträge (Timer bis 00:00, Meeting 00:00-00:30, Timer ab 00:30)

**Seed**:
```typescript
fs.seedMonth("2026-10", {});
fs.seedMonth("2026-11", {});
```

**Assertion**:
```typescript
expect(result.length).toBe(2);
expect(result[0]?.endAt).toBe("2026-10-31T23:59:59");
expect(result[1]?.startAt).toBe("2026-11-01T00:00:00");
expect(fs.readMonth("2026-10")).toMatchObject({
  "2026-10-31": [expect.objectContaining({ issueKey: "PROJ-42" })],
});
expect(fs.readMonth("2026-11")).toMatchObject({
  "2026-11-01": [expect.objectContaining({ issueKey: "PROJ-42" })],
});
```

---

## Cross-Month

Eintrag erstreckt sich über die Monatsgrenze.

**Beschreibung**: Derzeit nicht direkt getesteter Fall in add-entry (Mitternacht abgedeckt,
aber nicht explizit Mitternacht+Monatswechsel). Kann durch `startAt: "2026-10-31T22:00:00", endAt: "2026-11-02T02:00:00"` getestet werden.

---

## Nothing-Op / Leer-Szenario

Operation mit keinem/passeendem State soll sanft zurückkehren.

**Beschreibung**: Viele Operationen sind idempotent — wenn nichts zu tun ist, passiert
nichts und kein Error wird geworfen.

**Tests**:
- Kein Timer aktiv → `stopTracking()` gibt `null` zurück
- Kein Timer aktiv → `resetSession()` gibt `true` zurück, globalState bleibt leer
- Leerer Zeitraum → `getPeriod()` gibt leeres Array zurück
- Kein startDate → `getPeriod()` gibt leeres Array zurück
- Non-existent issueKey → `getByIssueKey()` gibt leeres Array zurück

**Seed**:
```typescript
await vscodeContext.globalState.update("activeTimeEntry", undefined);
fs.seedMonth("2026-10", {});
```

**Assertion**:
```typescript
expect(result).toBeNull();
expect(result).toBe(true);
expect(result.entries.length).toBe(0);
expect(result).toEqual([]);
```

---

## Kollision (BLOCK)

Geschlossener Eintrag überlappt mit neuem Eintrag → Error.

**Beschreibung**: Wenn ein NEUER Eintrag (mit startAt UND endAt) sich mit einem bestehenden
geschlossenen Eintrag überschneidet, muss ein Error geworfen werden.

**Tests**:
- Neuer Eintrag 09:30-11:00 kollidiert mit bestehendem 09:00-10:30 → Error

**Seed**:
```typescript
fs.seedMonth("2026-10", {
  "2026-10-14": [
    { id: "existing", issueKey: "BLOCK-TASK", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T10:30:00" },
  ],
});
```

**Assertion**:
```typescript
await expect(handler.execute()).rejects.toThrow(
  "[Timetracker]: Zeitkonflikt: Der Eintrag überschneidet sich mit einer Buchung für: BLOCK-TASK",
);
```

---

## Session Split (SPLIT)

Neuer Eintrag wird mitten in einen laufenden Timer geschoben.

**Beschreibung**: Wenn ein NEUER Eintrag in die Zukunft eines offenen Timers (endAt=null)
fällt, wird der Timer unterbrochen:
1. Timer bis zum neuen Eintrag (endAt = insert.startAt)
2. Der neue Eintrag
3. Timer ab dem neuen Eintrag (wieder offen, endAt=null)

**Tests**:
- Meeting 10:00-10:30 in Timer 09:00-null → 3 Einträge
- Meeting 10:00-12:00 in Timer 09:00-null → 3 Einträge
- Meeting VOR Timer-Start → kein Split, nur Meeting
- Meeting NACH Timer-Start aber ENDET vor Timer-Start → kein Split

**Seed**:
```typescript
await vscodeContext.globalState.update("activeTimeEntry", {
  id: "active-1",
  issueKey: "PROJ-10",
  startAt: "2026-10-14T09:00:00",
  endAt: null,
});
fs.seedMonth("2026-10", {
  "2026-10-14": [
    { id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null },
  ],
});
```

**Assertion**:
```typescript
expect(result.length).toBe(3);
expect(result[0]?.id).toBe("active-1");
expect(result[0]?.endAt).toBe("2026-10-14T10:00:00");
expect(result[1]?.issueKey).toBe("Meeting");
expect(result[2]?.issueKey).toBe("PROJ-10");
expect(result[2]?.startAt).toBe("2026-10-14T10:30:00");
expect(result[2]?.endAt).toBeNull();
```

---

## Priorität: BLOCK vor SPLIT

Wenn ein neuer Eintrag sowohl mit einem geschlossenen Eintrag ALS AUCH mit einem offenen
Timer kollidiert, gewinnt BLOCK.

**Beschreibung**: Die Collision-Priorität ist: BLOCK (geschlossener Eintrag) VOR SPLIT
(offener Timer). Auch wenn ein Eintrag in einen laufenden Timer fallen würde, wird zuerst
auf Kollision mit geschlossenen Einträgen geprüft.

**Tests**:
- Neuer Eintrag 09:15-10:30, bestehend: Timer 09:00-null UND closed 09:30-10:00 → Error (BLOCK gewinnt)

**Seed**:
```typescript
await vscodeContext.globalState.update("activeTimeEntry", {
  id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null,
});
fs.seedMonth("2026-10", {
  "2026-10-14": [
    { id: "active-1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: null },
    { id: "closed-1", issueKey: "BLOCKED", startAt: "2026-10-14T09:30:00", endAt: "2026-10-14T10:00:00" },
  ],
});
```

**Assertion**:
```typescript
await expect(handler.execute()).rejects.toThrow("Zeitkonflikt");
```

---

## Multiple Sessions hintereinander

Mehrere Timer-Starts hintereinander sollen alle vorherige Timer korrekt beenden.

**Beschreibung**: Jeder neue Timer-Start beendet den vorherigen Timer mit der aktuellen
Zeit als endAt. Alle Timings müssen stimmen.

**Tests**:
- Session 1: 09:00-10:00, Session 2: 10:00-11:00, Session 3: 11:00-offen

**Seed + Timing**:
```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date("2026-10-14T10:00:00"));
// Session 1 wird zu Session 2
vi.setSystemTime(new Date("2026-10-14T11:00:00"));
// Session 2 wird zu Session 3
vi.useRealTimers();
```

---

## Aktiver Timer über mehrere Tage

Ein Timer läuft über die Mitternachtsgrenze und wird später beendet.

**Beschreibung**: Ein Timer mit startAt am 14.10. 22:00 und endAt am 15.10. 01:00 muss
auf beide Tage aufgeteilt werden (normalizeTimeSpan).

---

## Offener Timer vom Vormonat

Wenn ein offener Timer (endAt=null) vom Vormonat in den aktuellen Monat hineinläuft,
soll er bei getRaw/getPeriod mitgeliefert werden.

**Beschreibung**: `getRaw("2026-10-01", "2026-10-01")` soll nicht nur den 1.10. enthalten,
sondern auch den offenen Timer vom 30.09.

**Seed**:
```typescript
fs.seedMonth("2026-09", {
  "2026-09-30": [{ id: "1", issueKey: "OPEN", startAt: "2026-09-30T09:00:00", endAt: null }],
});
fs.seedMonth("2026-10", {
  "2026-10-01": [{ id: "2", issueKey: "CLOSED", startAt: "2026-10-01T09:00:00", endAt: "2026-10-01T10:00:00" }],
});
```

**Assertion**:
```typescript
expect(Object.keys(result)).toHaveLength(2);
expect(result["2026-10-01"]).toHaveLength(1);
expect(result["2026-09-30"]).toHaveLength(1);
expect(result["2026-09-30"]?.[0]?.endAt).toBeNull();
```

---

## Error-Handling: Repository-Fehler

Wenn das Repository keinen Eintrag zurückschreibt.

**Beschreibung**: `repository.write()` gibt ein leeres Array zurück → Error.

**Seed + Spy**:
```typescript
vi.spyOn(timesheetRepository, "write").mockImplementation(async () => []);
await expect(service.start("PROJ-42")).rejects.toThrow("Der Eintrag konnte nicht im Repository erstellt werden.");
```

---

## Error-Handling: Timer schon beendet

`splitActiveTimer()` wirft Error wenn source schon endAt hat.

**Seed**:
```typescript
const endedSource = { id: "1", issueKey: "PROJ-10", startAt: "2026-10-14T09:00:00", endAt: "2026-10-14T09:30:00" };
await expect(service.splitActiveTimer(insertion, endedSource)).rejects.toThrow("Aktiver Timer wurde schon beendet");
```

---

## Error-Handling: Insertion hat kein Ende

`splitActiveTimer()` wirft Error wenn insertion endAt=null hat.

**Seed**:
```typescript
const openInsertion = { id: "2", issueKey: "PROJ-20", startAt: "2026-10-14T10:00:00", endAt: null };
await expect(service.splitActiveTimer(openInsertion, activeSource)).rejects.toThrow(
  "Eintrag konnte nicht dazwischen geschoben werden da das Ende Datum fehlt",
);
```

---

## FS-Zugriff nach Operationen

Wichtig: Nach jeder Operation MUSS neu gelesen werden!

```typescript
// ❌ FALSCH — month1 wird nicht aktualisiert
const month1 = fs.readMonth("2026-10");
await service.start("PROJ-42");
expect(month1).toMatchObject({ ... });  // month1 zeigt immer noch den alten Stand!

// ✅ RICHTIG
const month1 = fs.readMonth("2026-10");
await service.start("PROJ-42");
const month2 = fs.readMonth("2026-10"); // Neu lesen!
expect(month2).toMatchObject({ ... });
```

---

## Shared State: globalState nach Split

Nach einem Split muss der `activeTimeEntry` im globalState auf den NEUEN offenen Timer zeigen.

**Assertion**:
```typescript
const persistedActive = vscodeContext.globalState.get("activeTimeEntry") as TimeEntryDTO;
expect(persistedActive.issueKey).toBe("PROJ-10");
expect(persistedActive.startAt).toBe("2026-10-14T10:30:00");
expect(persistedActive.endAt).toBeNull();
```
