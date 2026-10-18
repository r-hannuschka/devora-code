import type { TimeEntry } from "@devora-code/api/core";
import { vi } from "vitest";
import { FileType, workspace, type Uri } from "vscode";

/**
 * Ersetzt workspace.fs durch ein Dateisystem im Speicher (per vi.spyOn).
 * Aufräumen: vi.restoreAllMocks() im afterEach.
 *
 * Verhält sich wie VS Code, wo es für die Repository-Tests zählt:
 * - readFile / stat / readDirectory werfen, wenn es Datei bzw. Verzeichnis nicht gibt
 * - writeFile wirft, wenn das Verzeichnis fehlt (das Repository muss es vorher anlegen)
 * - createDirectory ist idempotent
 */
export function installInMemoryFs(storageDir: string) {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const fileNotFound = (path: string) => Object.assign(new Error(`FileNotFound: ${path}`), { code: "FileNotFound" });
  const parentOf = (path: string) => path.slice(0, path.lastIndexOf("/"));
  const monthPath = (month: string) => `${storageDir}/${month}.json`;

  vi.spyOn(workspace.fs, "stat").mockImplementation(async (uri: Uri) => {
    if (dirs.has(uri.path)) return { type: FileType.Directory, ctime: 0, mtime: 0, size: 0 };
    const file = files.get(uri.path);
    if (file !== undefined) return { type: FileType.File, ctime: 0, mtime: 0, size: file.length };
    throw fileNotFound(uri.path);
  });

  vi.spyOn(workspace.fs, "readFile").mockImplementation(async (uri: Uri) => {
    const file = files.get(uri.path);
    if (file === undefined) throw fileNotFound(uri.path);
    return encoder.encode(file);
  });

  vi.spyOn(workspace.fs, "writeFile").mockImplementation(async (uri: Uri, content: Uint8Array) => {
    if (!dirs.has(parentOf(uri.path))) throw fileNotFound(parentOf(uri.path));
    files.set(uri.path, decoder.decode(content));
  });

  vi.spyOn(workspace.fs, "createDirectory").mockImplementation(async (uri: Uri) => {
    dirs.add(uri.path);
  });

  vi.spyOn(workspace.fs, "readDirectory").mockImplementation(async (uri: Uri) => {
    if (!dirs.has(uri.path)) throw fileNotFound(uri.path);
    return [...files.keys()]
      .filter((path) => parentOf(path) === uri.path)
      .map((path) => [path.slice(path.lastIndexOf("/") + 1), FileType.File] as [string, FileType]);
  });

  vi.spyOn(workspace.fs, "delete").mockImplementation(async (uri: Uri) => {
    files.delete(uri.path);
  });

  return {
    /** Rohzugriff: Pfad -> Dateiinhalt als String */
    files,
    dirs,

    /** Legt eine Monatsdatei (inkl. Storage-Verzeichnis) so an, wie sie auf der Platte liegen würde. */
    seedMonth(month: string, data: Record<string, TimeEntry[]>) {
      dirs.add(storageDir);
      files.set(monthPath(month), JSON.stringify(data, null, 2) + "\n");
    },

    /** Liest eine Monatsdatei geparst zurück, undefined wenn es sie nicht gibt. */
    readMonth(month: string): Record<string, TimeEntry[]> | undefined {
      const raw = files.get(monthPath(month));
      return raw === undefined ? undefined : JSON.parse(raw);
    },

    /** Dateinamen im Storage-Verzeichnis, sortiert (z.B. ["2026-10.json", "2026-11.json"]). */
    listMonths(): string[] {
      return [...files.keys()]
        .filter((path) => parentOf(path) === storageDir)
        .map((path) => path.slice(path.lastIndexOf("/") + 1))
        .sort();
    },

    storageDirExists: () => dirs.has(storageDir),
  };
}

export type InMemoryFs = ReturnType<typeof installInMemoryFs>;
