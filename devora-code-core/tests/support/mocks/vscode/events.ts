/**
 * Event-System: createEvent-Factory, Event-Interface und konkrete Events.
 * Erweitert workspace und window mit Listener-Properties.
 */
import { workspace } from "./workspace";
import { window as windowObj } from "./window";

export interface Event<T> {
  (listener: (e: T) => void): { dispose(): void };
  fire(event: T): void;
}

function createEvent<T>(): Event<T> {
  const listeners = new Set<(e: T) => void>();
  const event: Event<T> = ((listener: (e: T) => void) => {
    listeners.add(listener);
    return {
      dispose: () => listeners.delete(listener),
    };
  }) as Event<T>;
  event.fire = (eventData: T) => {
    for (const listener of listeners) {
      listener(eventData);
    }
  };
  return event;
}

export const onDidOpenTextDocument: Event<TextDocument> = createEvent<TextDocument>();
export const onDidChangeTextDocument: Event<{ document: TextDocument }> = createEvent<{ document: TextDocument }>();
export const onDidChangeActiveTextEditor: Event<TextEditor | undefined> = createEvent<TextEditor | undefined>();

// Extend workspace + window mit Event-Listeners
Object.assign(workspace, {
  onDidOpenTextDocument,
  onDidChangeTextDocument,
});

Object.assign(windowObj, {
  onDidChangeActiveTextEditor,
});

export interface TextDocument {
  uri: any;
  fileName: string;
  lineCount: number;
  getText(): string;
  lineAt(index: number): { text: string };
}

function createTextDocument(
  uri: { path: string; fsPath: string; toString: () => string },
  content: string,
): TextDocument {
  const lines = content.split("\n");
  return {
    uri,
    fileName: uri.path,
    lineCount: lines.length,
    getText: () => content,
    lineAt: (index: number) => ({ text: lines[index] ?? "" }),
  };
}

export interface TextEditor {
  document: TextDocument;
}

export { createTextDocument };
