import "reflect-metadata";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { JiraCommandController } from "./jira-command.controller";

export function activate(): void {
  const hostExtension = vscode.extensions.getExtension("trueffelmafia.devora-code");

  if (hostExtension) {
    const hostApi = hostExtension.exports;
    if (hostApi && typeof hostApi.registerSubModule === "function") {
      const commandController = container.resolve(JiraCommandController);
      hostApi.registerSubModule(commandController);
      console.debug("[DevoraCode Jira]: Erfolgreich beim DevoraCode Core registriert und einsatzbereit.");
    } else {
      console.error("[DevoraCode Jira]: Der Core hat keine gültige registerSubModule-API freigegeben!");
    }
  } else {
      console.error("[DevoraCode Jira]: Der Core konnte nicht gefunden werden!");
  }
}

export function deactivate(): void {
  // noop;
}
