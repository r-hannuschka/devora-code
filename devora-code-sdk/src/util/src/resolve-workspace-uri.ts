import { isAbsolute } from "path";
import { Uri, workspace } from "vscode";

export function resolveWorkspaceUri(customPath: string | undefined | null, fallbackPath: string): Uri {
  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri;

  let targetPath = customPath;
  if (!targetPath || targetPath.trim() === "") {
    targetPath = fallbackPath;
  }

  if (isAbsolute(targetPath)) {
    return Uri.file(targetPath);
  }

  if (!workspaceFolder) {
    throw new Error(`No workspace directory found.`);
  }

  return Uri.joinPath(workspaceFolder, targetPath);
}
