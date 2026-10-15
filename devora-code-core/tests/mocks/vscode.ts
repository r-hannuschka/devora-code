/**
 * Minimaler Ersatz für das "vscode" Modul (existiert nur im Extension Host).
 * Wird per Alias in vitest.config.ts eingebunden.
 */
export const FileType = { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 } as const;

export const Uri = {
  joinPath: (base: { path: string }, ...parts: string[]) => ({
    path: [base.path, ...parts].join("/"),
    fsPath: [base.path, ...parts].join("/"),
  }),
};

export const workspace = {
  fs: {
    readFile: async () => new Uint8Array(),
    writeFile: async () => undefined,
    readDirectory: async () => [] as [string, number][],
    createDirectory: async () => undefined,
    stat: async () => ({ type: FileType.Directory }),
  },
};

export type ExtensionContext = unknown;
