/**
 * Diagnostics: Range, Diagnostic, DiagnosticCollection, InMemory-Impl, languages.
 */
import { vi } from "vitest";
import type { DiagnosticSeverity } from "./types";

// ====================================================================
// Diagnostic & Range
// ====================================================================

export class Range {
  constructor(
    public readonly startLine: number,
    public readonly startCharacter: number,
    public readonly endLine: number,
    public readonly endCharacter: number,
  ) {}
}

export class Diagnostic {
  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly severity: DiagnosticSeverity,
    public readonly source?: string,
    public readonly code?: string | { value: string; target: any },
    public readonly tags?: any[],
  ) {}
}

// ====================================================================
// DiagnosticCollection (In-Memory Interface)
// ====================================================================

export interface DiagnosticCollection {
  set(uri: any, diagnostics: Diagnostic[]): void;
  delete(uri: any): void;
  /** Liefert alle aktuell gespeicherten Diagnostics. Nur für Tests. */
  get(uri: any): Diagnostic[] | undefined;
  /** Liefert alle gespeicherten URIs. Nur für Tests. */
  keys(): any[];
  clear(): void;
  dispose(): void;
}

/**
 * Standard-DiagnosticCollection — leer.
 * Im Test mit vi.spyOn oder Mock ersetzen:
 *   const mock = { set: vi.fn(), delete: vi.fn(), keys: vi.fn(() => []) };
 *   vi.spyOn(vscode.languages, "createDiagnosticCollection").mockReturnValue(mock);
 */
export const mockDiagnosticCollection: DiagnosticCollection = {
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(() => undefined),
  keys: vi.fn(() => []),
  clear: vi.fn(),
  dispose: vi.fn(),
};

class InMemoryDiagnosticCollection implements DiagnosticCollection {
  private readonly map = new Map<any, Diagnostic[]>();

  set(uri: any, diagnostics: Diagnostic[]): void {
    this.map.set(uri, diagnostics);
  }

  delete(uri: any): void {
    this.map.delete(uri);
  }

  get(uri: any): Diagnostic[] | undefined {
    return this.map.get(uri);
  }

  keys(): any[] {
    return [...this.map.keys()];
  }

  clear(): void {
    this.map.clear();
  }

  dispose(): void {
    this.map.clear();
  }
}

export const languages = {
  createDiagnosticCollection: () => mockDiagnosticCollection,
};
