# Issue: UTC-Zeitkonvertierung zeigt Endzeit von Übernachtungen falsch an

**Kategorie:** Bug  
**Komponente:** Webview / WeekBookingsComponent  
**Priorität:** Medium  

## Problem

Bei Zeiteinträgen die über Mitternacht gehen (z.B. 22:00 → 02:00 nächster Tag) wird die Endzeit als `01:59` angezeigt ohne den Tag zu zeigen. Der User sieht nicht dass es sich um den **nächsten Tag** handelt.

### Beispiel

```
2026-10-09    KVQAIP-2220    11:40    01:59    14h 19min
                                  ↑
                         Eigentlich 10.10. 01:59 MESZ
```

### Hintergrund

- Alle Zeiten werden als ISO-Strings mit `Z` (UTC) gespeichert
- Sommerzeit: UTC+2 → 23:59 UTC = 01:59 nächsten Tag lokal
- Die Anzeige extrahiert nur die Uhrzeit (`HH:mm`) ohne Tageskontext

## Erwartetes Verhalten

Bei Einträgen die über Mitternacht gehen, soll der End-Tag zusätzlich angezeigt werden:

```
2026-10-09    KVQAIP-2220    11:40    01:59 (10.10.)    14h 19min
```

## To-Do

- [ ] `formatTime()` in WeekBookingsComponent prüfen ob End-Datum != Start-Datum
- [ ] Bei Tageswechsel: `{uhrzeit} ({tag})` anzeigen
- [ ] Testfälle für Über-Mitternacht-Einträge hinzufügen
