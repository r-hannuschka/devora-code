# Plan: Wochen-/Tages-Switch für Zeiterfassung

## Ziel

Die bestehende Wochenansicht (`WeekBookingsComponent`) wird um einen Switch erweitert, der zwischen Wochen- und Tagesansicht umschaltet. Die Tabelle bleibt unverwendbar — nur Header und Daten-Filter ändern sich.

## Aktueller Stand

- `WeekBookingsComponent` zeigt Wochen-Tabelle mit Navigation (← KW41 →)
- `TimeTrackerService.periode` signal: `{ startDate, endDate }`
- Tabelle: Datum | Issue | Von | Bis | Dauer + Summe

## Änderungen

### 1. Component: Wochen-/Tages-Switch

**`week-bookings.component.ts`**

```typescript
// Neu: View-Modus
readonly view = signal<'week' | 'day'>('week');

// Signal für gewähltes Tagesdatum (nur bei day-View relevant)
readonly selectedDate = signal<string>(format(new Date(), 'yyyy-MM-dd'));

// effect wechselt View und setzt periode
effect(() => {
  if (this.view() === 'week') {
    const { weekStart } = this;
    const endDate = addDays(weekStart(), 6);
    this.tracker.periode.set({
      startDate: format(weekStart(), 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
  } else {
    this.tracker.periode.set({
      startDate: this.selectedDate(),
      endDate: this.selectedDate(),
    });
  }
});

// Neu: Methoden
previousWeek() { /* existing */ }
nextWeek() { /* existing */ }
previousDay() { this.selectedDate.set(addDays(this.selectedDate(), -1)) }
nextDay() { this.selectedDate.set(addDays(this.selectedDate(), 1)) }
```

### 2. Template: Switch + angepasster Header

**`week-bookings.component.html`**

```html
<div class="devora-code-week-bookings">
  <!-- View-Switch: Woche | Tag -->
  <div class="view-switch">
    <mat-button-toggle-group [value]="view()" (change)="view.set($event.value)">
      <mat-button-toggle value="week">Woche</mat-button-toggle>
      <mat-button-toggle value="day">Tag</mat-button-toggle>
    </mat-button-toggle-group>
  </div>

  <!-- Header: je nach View -->
  @if (view() === 'week') {
    <div class="week-header">
      <button mat-mini-fab (click)="previousWeek()"><mat-icon class="devora-code-icon-arrow-left"></mat-icon></button>
      <h2>{{ weekLabel() }}</h2>
      <button mat-mini-fab (click)="nextWeek()"><mat-icon class="devora-code-icon-arrow-right"></mat-icon></button>
      <button mat-mini-fab (click)="reload()"><mat-icon class="devora-code-icon-refresh"></mat-icon></button>
    </div>
  } @else {
    <div class="day-header">
      <button mat-mini-fab (click)="previousDay()"><mat-icon class="devora-code-icon-arrow-left"></mat-icon></button>
      <h2>{{ dayLabel() }}</h2>
      <button mat-mini-fab (click)="nextDay()"><mat-icon class="devora-code-icon-arrow-right"></mat-icon></button>
      <button mat-mini-fab (click)="reload()"><mat-icon class="devora-code-icon-refresh"></mat-icon></button>
    </div>
  }

  <!-- Tabelle (unverändert) -->
  @if (entries().length > 0) { ... }

  <!-- Summe: je nach View -->
  @if (view() === 'week') {
    <div class="week-sum">...</div>
  } @else {
    <div class="day-sum">...</div>
  }

  <!-- Empty-State: je nach View -->
  @if (entries().length === 0) {
    <p class="empty-state">Keine Zeiteinträge für {{ view() === 'week' ? 'diese Woche' : 'diesen Tag' }}.</p>
  }
</div>
```

### 3. SCSS: Switch-Styling

**`week-bookings.component.scss`**

```scss
.view-switch {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.day-header {
  @extend .week-header; // Gleiche Flex-Layout-Logik
}
```

## Files

| File | Änderung |
|------|----------|
| `week-bookings.component.ts` | + `view` signal, + `selectedDate` signal, + `previousDay()`, + `nextDay()`, + `dayLabel()` computed |
| `week-bookings.component.html` | + View-Switch, bedingte Header, bedingte Summe |
| `week-bookings.component.scss` | + `.view-switch` |
| `mat-button-toggle` | + Import in `imports: []` Array |

## Timeline

- ~15 min: Component + Template + SCSS
- Keine neuen Dependencies
