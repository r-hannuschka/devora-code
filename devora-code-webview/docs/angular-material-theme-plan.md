# Angular Material Custom Theme — Anleitung

## Ziel

Ein eigenes SCSS-basiertes Angular Material Theme erstellen, das VS Code CSS-Variablen nutzt und den Theming-Mechanismus unter der Haube zeigt. Du lernst dabei, wie Material-Theming funktioniert.

## Warum der aktuelle Stand nicht reicht

Die [styles.scss](src/styles.scss) importiert aktuell `@angular/material/prebuilt-themes/azure-blue.css` — das ist eine **fertig kompilierte CSS-Datei** mit hartkodierten Hex-Farben. Kein Zugriff auf SCSS-Variable, kein VS Code Theming.

## Wie Material v22 Theming funktioniert

```
Material v22 nutzt Material 3 Token-basiertes Theming — NICHT mehr
das alte M2 Palette-System (define-palette / define-light-theme).

Neue API: mat.theme($config)
```

### Der Ablauf in 3 Schritten:

```
1. Palette definieren (Farben + Neutrals)
2. mat.theme($config) aufrufen
   → erzeugt CSS-Variablen (--mat-sys-primary, --mat-sys-surface, …)
3. Komponenten-Skins einbinden
   → mat.all-component-themes() oder nur einzelne Mixins
```

### Die Config-Map für `mat.theme()`:

```scss
$my-config: (
  color: (
    primary: <M3-Palette-Map>,       // required: Hauptfarbe
    tertiary: <M3-Palette-Map>,      // optional, default: primary
    theme-type: color-scheme | light | dark
  ),
  typography: <Font-String> | <Typo-Map>,  // optional
  density: <Number> | <Density-Map>,        // optional
);
```

### Die M3-Palette-Map (internes Format):

Eine Material-Palette ist ein SCSS-Map mit folgenden Schlüsseln:

```scss
$my-palette: (
  0:            #000000,     // Hintergrund (bei Dark) / Surface-Hintergrund
  10:           #1a1b1f,     // Oberflächen-Hintergrund (bei Light)
  20:           #2f3033,     // Container-Farbe
  ...                    // 10 → 100 in 10er-Schritten (Helligkeitsstufen)
  4:            #0d0e11,     // Speziell: tiefster Schatten-/Overlay-Ton
  6:            #121316,     // Speziell: leicht darüber
  12:           #1f2022,     // Speziell: Oberflächen-Hintergrund
  17:           #292a2c,     // Speziell: Overlay
  22:           #343537,     // Speziell: Disabled
  24:           #38393c,     // Speziell: Focus/Highlight
  87:           #dbd9dd,     // Speziell: Hover (Light only)
  92:           #e9e7eb,     // Speziell: Elevated
  94:           #efedf0,     // Speziell: Dialog
  96:           #f4f3f6,     // Speziell: Modal
  secondary:    (<Map>),     // Sekundärfarben — gleiche Struktur
  neutral:      (<Map>),     // Neutrale Farben — gleiche Struktur
  neutral-variant: (<Map>),  // Alternative Neutrale — gleiche Struktur
);
```

### Wie `mat.theme()` die Farben mappingt:

Die Funktion `md-sys-color-values-light()` im Material-Kern (Quelldatei `_system.scss`) mappingt die Palette auf semantische Token:

| CSS Variable | Mapping (Light) | Bedeutung |
|---|---|---|
| `--mat-sys-background` | `palette[6]` | Seitenhintergrund |
| `--mat-sys-surface` | `palette[6]` | Karten-/Container-Hintergrund |
| `--mat-sys-on-surface` | `palette[90]` | Text auf Oberfläche |
| `--mat-sys-primary` | `palette[80]` | Primäre Akzentfarbe |
| `--mat-sys-on-primary` | `palette[20]` | Text auf Primärfarbe |
| `--mat-sys-primary-container` | `palette[30]` | Primär-Container |
| `--mat-sys-on-primary-container` | `palette[90]` | Text auf Primär-Container |
| `--mat-sys-secondary` | `palette[secondary, 80]` | Sekundärfarbe |
| `--mat-sys-error` | `palette[error, 80]` | Fehlerfarbe |
| `--mat-sys-shadow` | `palette[0]` | Schattenfarbe (schwarz) |

Das ist **der Kern-Insight**: Die Zahl hinter `[<N>]` bestimmt die Helligkeitsstufe der Farbe. `80` = helle Farbe (für Buttons, Highlights), `20` = dunkle Farbe (für Text auf hellem Grund), `6` = dunkler Hintergrund (Dark Mode) / heller Hintergrund (Light Mode).

## Schritt-für-Schritt-Anleitung

### Schritt 1: Neue Palettes erstellen

Erstelle `src/theme/material/palettes.scss` mit Palettes, die VS Code CSS-Variablen als CSS `var()` nutzen:

```scss
@use 'sass:map';
@use '@angular/material' as mat;

// ===========================================================================
// Palettes für Angular Material v22 (M3 Token-basiertes Theming)
//
// Jede Palette ist eine SCSS-Map, die auf VS Code CSS-Variablen verweist.
// Die Schlüssel (10, 20, 30, … 100, 4, 6, 12, …) sind Helligkeitsstufen:
//   10-100 in 10er-Schritten (10=dunkel, 100=hell/weiß)
//   4, 6, 12, 17, 22, 24 → spezielle Oberflächen-Töne
//   87, 92, 94, 96 → Hover/Elevated/Dialog (Light Mode)
// ===========================================================================

// ---------- Primary Palette ----------
// Dient als Haupt-Akzentfarbe (Buttons, Links, Highlights)
// Mapping: [80] → --mat-sys-primary, [30] → --mat-sys-primary-container
$vscode-primary-palette: (
  // Hauptfarbverlauf
  0:   #000000,
  10:  var(--vscode-badge-background, #0e1a2b),
  20:  var(--vscode-badge-background, #163052),
  30:  var(--vscode-input-option-activeBorder, #1a4a8a),
  40:  var(--vscode-inputOption-activeBorder, #2563a8),
  50:  var(--vscode-inputOption-activeBorder, #3b7fd0),
  60:  #438fff,
  70:  #7cabff,
  80:  #abc7ff,  // ← helle Blauton für Buttons
  90:  #d7e3ff,
  95:  #ecf0ff,
  98:  #f9f9ff,
  99:  #fdfbff,
  100: #ffffff,
  // Spezielle Töne
  4:   var(--vscode-editor-background, #0a0e14),
  6:   var(--vscode-editor-background, #0d1117),
  12:  var(--vscode-sideBar-background, #161b22),
  17:  var(--vscode-editor-background, #131820),
  22:  var(--vscode-editor-background, #1b2129),
  24:  var(--vscode-input-border, #30363d),
  // Hover/Elevated (Light Mode Fallbacks)
  87:  #c0d4f5,
  92:  #d4e2fc,
  94:  #dde9fd,
  96:  #e8f0fe,

  // ---------- Secondary Palette ----------
  // Subtilere Akzente (Chips, Segmente)
  secondary: (
    0:   #000000,
    10:  var(--vscode-sideBar-background, #0e131b),
    20:  var(--vscode-sideBar-background, #171e29),
    30:  var(--vscode-sideBar-background, #1f2a38),
    40:  var(--vscode-sideBar-background, #283547),
    50:  var(--vscode-sideBar-background, #364a5e),
    60:  #506680,
    70:  #6f85a0,
    80:  #92acc4,
    90:  #c0d0e8,
    95:  #dfe8f5,
    98:  #f0f5fb,
    99:  #fdfbff,
    100: #ffffff,
    4:   var(--vscode-editor-background, #06090e),
    6:   var(--vscode-editor-background, #0a0e14),
    12:  var(--vscode-sideBar-background, #131820),
    17:  var(--vscode-editor-background, #0d1219),
    22:  var(--vscode-editor-background, #151a23),
    24:  var(--vscode-input-border, #30363d),
    87:  #b5c6e0,
    92:  #cddbf0,
    94:  #d9e4f5,
    96:  #e5ecfa,
  ),

  // ---------- Neutral Palette ----------
  // Oberflächen, Hintergründe, Text-Farbe
  neutral: (
    0:   #000000,
    10:  var(--vscode-editor-background, #0a0e14),
    20:  var(--vscode-editor-background, #0d1117),
    30:  var(--vscode-sideBar-background, #161b22),
    40:  var(--vscode-sideBar-background, #1c2333),
    50:  var(--vscode-sideBar-background, #273148),
    60:  var(--vscode-sideBar-border, #30363d),
    70:  var(--vscode-foreground, #6e7a8d),
    80:  var(--vscode-foreground, #8b949e),
    90:  var(--vscode-editor-foreground, #c9d1d9),
    95:  var(--vscode-editor-foreground, #e6edf3),
    98:  var(--vscode-editor-foreground, #f0f3f6),
    99:  var(--vscode-editor-foreground, #f5f7f9),
    100: #ffffff,
    4:   var(--vscode-editor-background, #030508),
    6:   var(--vscode-editor-background, #06090e),
    12:  var(--vscode-sideBar-background, #0d1219),
    17:  var(--vscode-editor-background, #0a0f15),
    22:  var(--vscode-editor-background, #111721),
    24:  var(--vscode-input-border, #30363d),
    87:  #b5c4d8,
    92:  #cddbea,
    94:  #d9e4f1,
    96:  #e5ecf6,
  ),

  // ---------- Neutral Variant Palette ----------
  // Alternative neutrale Farben für Container
  neutral-variant: (
    0:   #000000,
    10:  var(--vscode-editor-background, #0a0e14),
    20:  var(--vscode-editor-background, #0d1117),
    30:  var(--vscode-sideBar-background, #161b22),
    40:  var(--vscode-sideBar-background, #1c2333),
    50:  var(--vscode-sideBar-background, #273148),
    60:  var(--vscode-sideBar-border, #30363d),
    70:  var(--vscode-foreground, #6e7a8d),
    80:  var(--vscode-foreground, #8b949e),
    90:  var(--vscode-editor-foreground, #c9d1d9),
    95:  var(--vscode-editor-foreground, #e6edf3),
    98:  var(--vscode-editor-foreground, #f0f3f6),
    99:  var(--vscode-editor-foreground, #f5f7f9),
    100: #ffffff,
    4:   var(--vscode-editor-background, #030508),
    6:   var(--vscode-editor-background, #06090e),
    12:  var(--vscode-sideBar-background, #0d1219),
    17:  var(--vscode-editor-background, #0a0f15),
    22:  var(--vscode-editor-background, #111721),
    24:  var(--vscode-input-border, #30363d),
    87:  #b5c4d8,
    92:  #cddbea,
    94:  #d9e4f1,
    96:  #e5ecf6,
  ),
);

// ---------- Warn Palette ----------
// Fehleranzeige, Validierungsfehler
// Nutzt VS Code Error-Farben (rot)
$vscode-warn-palette: (
  0:   #000000,
  10:  #3d0008,
  20:  #690012,
  30:  #93001a,
  40:  #ba1a2b,
  50:  #de3742,
  60:  #ff5465,
  70:  #ff8993,
  80:  #ffb4bc,
  90:  #ffd9dc,
  95:  #ffeaeb,
  98:  #fff2f3,
  99:  #fff8f9,
  100: #ffffff,
  secondary: (
    0:   #000000,
    10:  #2d0c14,
    20:  #461d24,
    30:  #5f2e35,
    40:  #794249,
    50:  #95595f,
    60:  #b17279,
    70:  #cc8d94,
    80:  #e9a9aa,
    90:  #ffd3d4,
    95:  #ffe5e6,
    98:  #fff0f1,
    99:  #fff7f8,
    100: #ffffff,
    4:   #1a0004,
    6:   #200006,
    12:  #30000b,
    17:  #3b000e,
    22:  #460a14,
    24:  #4c101a,
    87:  #e1b0b2,
    92:  #efc9ca,
    94:  #f5d4d5,
    96:  #fae0e1,
  ),
  neutral: (
    0:   #000000,
    10:  #201a19,
    20:  #362f2e,
    30:  #4d4544,
    40:  #655c5b,
    50:  #7f7573,
    60:  #998e8d,
    70:  #b4a9a7,
    80:  #d0c4c2,
    90:  #ede0dd,
    95:  #fbeeec,
    98:  #fff8f6,
    99:  #fffbff,
    100: #ffffff,
    4:   #130d0c,
    6:   #181211,
    12:  #251e1d,
    17:  #302828,
    22:  #3b3332,
    24:  #3f3737,
    87:  #e4d7d6,
    92:  #f3e5e4,
    94:  #f9ebe9,
    96:  #fef1ef,
  ),
  neutral-variant: (
    0:   #000000,
    10:  #251917,
    20:  #3b2d2b,
    30:  #534341,
    40:  #6c5a58,
    50:  #857370,
    60:  #a08c89,
    70:  #bca7a3,
    80:  #d8c2be,
    90:  #f5ddda,
    95:  #ffedea,
    98:  #fff8f6,
    99:  #fffbff,
    100: #ffffff,
    4:   #120d0b,
    6:   #181210,
    12:  #241e1b,
    17:  #2f2926,
    22:  #3a3330,
    24:  #3f3834,
    87:  #e3d8d3,
    92:  #f2e6e1,
    94:  #f8ebe6,
    96:  #fef1ec,
  ),
);
```

### Schritt 2: Theme-Config erstellen

Erstelle `src/theme/material/theme.scss`:

```scss
@use 'sass:map';
@use '@angular/material' as mat;
@use './palettes';

// ===========================================================================
// Angular Material Custom Theme
//
// Verwendet M3 Token-basiertes Theming (mat.theme()) statt des veralteten
// M2 Systems (define-palette / define-light-theme).
//
// Wie es funktioniert:
//   1. mat.theme() generiert CSS-Variablen (--mat-sys-*) mit den
//      Farben aus den Palettes
//   2. mat.all-component-themes() wendet die CSS-Variablen auf alle
//      Material-Komponenten an
// ===========================================================================

// ---------- Theme-Config ----------
//
// Die Config-Map steuert alles:
//   - color:  Primäre + Secondary + Warn Palette (M3-Format)
//   - typography: Font-Familie oder Map mit Fonts + Gewichten
//   - density: 0 = Standard, -1 = Compact, 1 = Comfortable
//
// theme-type:
//   - "color-scheme" (default): Nutzt prefers-color-scheme für auto
//     Light/Dark-Erkennung über CSS media query
//   - "light" / "dark": Feste Theme-Bindung
// ===========================================================================
$vscode-theme: mat.theme((
  color: (
    primary: $vscode-primary-palette,
    tertiary: $vscode-primary-palette,    // Default: gleiche wie primary
    theme-type: color-scheme,
  ),
  typography: (
    plain-family: (var(--vscode-font-family, system-ui), sans-serif),
    brand-family: (var(--vscode-font-family, system-ui), sans-serif),
    bold-weight: 700,
    medium-weight: 500,
    regular-weight: 400,
  ),
  density: 0,
));

// ---------- System-Level CSS-Variablen ----------
//
// mat.theme() generiert automatisch diese CSS-Variablen:
//   --mat-sys-background        → Seitenhintergrund
//   --mat-sys-surface           → Karten-/Container-Hintergrund
//   --mat-sys-on-surface        → Text auf Oberfläche
//   --mat-sys-primary           → Primärfarbe (Buttons, Links)
//   --mat-sys-on-primary        → Text auf Primärfarbe (kontrastierend)
//   --mat-sys-primary-container → Primär-Container-Hintergrund
//   --mat-sys-on-primary-container
//   --mat-sys-secondary         → Sekundärfarbe
//   --mat-sys-error             → Fehlerfarbe
//   --mat-sys-outline           → Rahmenfarbe
//   --mat-sys-shadow            → Schattenfarbe
//
// Diese werden im <style> als :root und [data-color-scheme="dark"]
// über die Palettes aus Schritt 1 generiert.
// ===========================================================================
@include mat.theme($vscode-theme);

// ---------- Komponenten-Skins ----------
//
// mat.theme() setzt nur die System-Variablen (--mat-sys-*).
// Für die eigentlichen Material-Komponenten (Toolbar, Autocomplete, …)
// muss jeder Komponente ihr Skin-Mixin mitbekommen:
//
//   mat.all-component-themes($vscode-theme)
//     → generiert CSS für ALLE Material-Komponenten
//
//   Oder selektiv:
//     @include mat.toolbar-theme($vscode-theme);
//     @include mat.autocomplete-theme($vscode-theme);
//     @include mat.button-theme($vscode-theme);
//     …
//
// Der Skin-Mixin liest die --mat-sys-* Variablen und wendet sie
// auf die jeweiligen CSS-Regeln der Komponente an.
// ===========================================================================
@include mat.all-component-themes($vscode-theme);
```

### Schritt 3: `styles.scss` aktualisieren

Die bestehende [styles.scss](src/styles.scss) bearbeiten:

```scss
// Aus:
@use '@angular/material' as mat;

// …
@include mat.core();
@import '@angular/material/prebuilt-themes/azure-blue.css';

// Wird zu:
@use '@angular/material' as mat;
@include mat.core();

@import './theme/material/theme';  // Unser Custom-Theme
```

Das Prebuilt-Theme (`azure-blue.css`) wird vollständig durch das eigene Custom-Theme ersetzt.

## Dateistruktur nach dem Aufbau

```
webview/src/
├── styles.scss                          ← Entry-Point (angepasst)
└── theme/
    ├── styles/                          ← existierend (unverändert)
    │   ├── index.scss
    │   ├── base/
    │   │   ├── _reboot.scss
    │   │   └── _list.scss
    │   ├── components/
    │   │   ├── _button.scss
    │   │   ├── _widget.scss
    │   │   └── form/
    │   │       ├── _form-field.scss
    │   │       └── _form-control.scss
    │   └── material/                    ← NEU
    │       ├── palettes.scss            ← Farb-Palettes (Schritt 1)
    │       └── theme.scss               ← Theme-Config (Schritt 2)
```

## Was du lernst (Concepts)

### 1. M3 Tokens vs. M2 Palettes

| Feature | M2 (alt) | M3 (neu) |
|---|---|---|
| API | `define-palette()` + `define-light-theme()` | `mat.theme($config)` |
| Farben | 10 Farbstufen (50–950) | 12 Stufen (4–96) + semantische Mapping |
| Output | Direkt CSS-Farben | CSS-Variablen (`--mat-sys-*`) |
| Dynamisch | Nein | Ja — über CSS `var()` → VS Code Themes |

### 2. Die Palette-Map Struktur

Eine M3-Palette ist ein verschachteltes SCSS-Map. Die Schlüsselnummern bestimmen die **Helligkeitsstufe** (`< 100`):

- `0`–`100`: Reine Farbskala (0=schwarz, 100=weiß)
- `4`, `6`, `12`, `17`, `22`, `24`: Spezielle Oberflächen-Töne
- `87`, `92`, `94`, `96`: Hover/Elevated/Dialog-Modifikatoren

### 3. Semantic Mapping

`mat.theme()` nimmt deine rohe Palette und mappingt sie auf semantische Namen:

```
primary[80]  → --mat-sys-primary        (aktive Elemente)
primary[30]  → --mat-sys-primary-container  (inaktive/aktive Container)
primary[20]  → --mat-sys-on-primary     (Text darauf)
```

Das macht es möglich, die gesamte App-Farben zu wechseln, indem nur **eine** Palette angepasst wird.

### 4. `mat.core()` vs. `mat.theme()` vs. `mat.all-component-themes()`

| Funktion | Aufgabe |
|---|---|
| `mat.core()` | Generiert Basis-CSS-Reset, Font-Setup, `--mat-app-*` Variablen |
| `mat.theme()` | Generiert `--mat-sys-*` CSS-Variablen aus Palettes |
| `mat.all-component-themes()` | Generiert CSS für jede Material-Component, liest `--mat-sys-*` |

Reihenfolge in `styles.scss`: `core()` → `theme()` → `all-component-themes()`

### 5. CSS `var()` als Brücke zu VS Code

Indem du VS Code CSS-Variablen wie `--vscode-editor-background` direkt in die M3-Palette schreibst, **wandert** das Material-Theme automatisch mit jedem VS Code-Theme (Light, Dark, High Contrast, …).

## Zusammenfassung der Änderungen

1. **Neu erstellen**: `src/theme/material/palettes.scss` + `src/theme/material/theme.scss`
2. **Ändern**: `src/styles.scss` — Prebuilt-Import durch Custom-Theme ersetzen
3. **Löschen**: `node_modules/.cache` falls vorhanden (SCSS-Clear)

**Nichts installieren** — `@angular/material` (v22) bringt das SCSS-Theming bereits mit.
