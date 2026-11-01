/**
 * URI-Helfer für VSCode Uri-Mock — sorgt dafür, dass .toString() und Pfade matchen.
 */
import { FileType } from "./types";

export const createMockUri = (fullPath: string) => ({
  scheme: "file",
  authority: "",
  path: fullPath,
  query: "",
  fragment: "",
  fsPath: fullPath,
  with: () => { throw new Error("Not implemented"); },
  toJSON: () => {},
  toString: () => `file://${fullPath}`,
});

export const Uri = {
  file: (path: string) => createMockUri(path),
  joinPath: (base: { path: string }, ...parts: string[]) =>
    createMockUri([base.path, ...parts].join("/")),
  parse: (str: string) => createMockUri(str.replace(/^[a-z]+:/, "")),
};

export { FileType };
