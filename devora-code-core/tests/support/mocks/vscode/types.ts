/**
 * Grundlegende VSCode-Typen und Enumerationswerte.
 */

export const FileType = { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 } as const;

export const ViewColumn = { Active: -1, Beside: 2, One: 1 } as const;

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}
