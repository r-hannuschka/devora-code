import { workspace, type Uri } from "vscode";

export abstract class DevoraCodeSettings<TSettings> {
  /**
   * @key der einstellungen, zum beispiel devora-code.jira
   */
  protected abstract readonly key: string;

  get<TSettingKey extends keyof TSettings>(section: TSettingKey): TSettings[TSettingKey] | null {
    const uri = this.getWorkspaceUri();
    if (!uri) {
      return null;
    }

    const config = workspace.getConfiguration(this.key, uri);
    return config.get<TSettings[TSettingKey]>(section as string) ?? null;
  }

  private getWorkspaceUri(): Uri | null {
    return workspace.workspaceFolders?.[0]?.uri ?? null;
  }
}
