import type { ExtensionContext } from "vscode";

/**
 * Minimaler ExtensionContext: globalState (get/update) im Speicher und globalStorageUri.
 * Ein Wert von undefined löscht den Key, wie in VS Code.
 */
export function createExtensionContextMock({ globalStoragePath = "/storage" } = {}): ExtensionContext {
  const state = new Map<string, unknown>();
  const subscriptions: unknown[] = [];

  const context = {
    globalStorageUri: { path: globalStoragePath, fsPath: globalStoragePath },
    globalState: {
      get: <T>(key: string, defaultValue?: T) => (state.has(key) ? (state.get(key) as T) : defaultValue),
      update: async (key: string, value: unknown) => {
        if (value === undefined) {
          state.delete(key);
        } else {
          state.set(key, value);
        }
      },
    },
    subscriptions,
  };

  return context as unknown as ExtensionContext;
}
