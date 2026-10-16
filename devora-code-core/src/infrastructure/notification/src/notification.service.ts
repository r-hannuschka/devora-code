import { singleton } from "tsyringe";
import { window } from "vscode";

@singleton()
export class NotificationService {
  showError(message: string, error?: Error): void {
    const details = error ? ` (${error.message})` : "";
    window.showErrorMessage(`${message} ${details}`);
  }

  showWarning(message: string): void {
    window.showWarningMessage(message);
  }

  showInfo(message: string): void {
    window.showInformationMessage(message);
  }
}
