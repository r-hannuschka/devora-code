import { NotificationService } from "@/core/notification";
import { CommandRouter } from "@/domain/routing";
import { isErrorResponse } from "@devora-code/sdk/command";
import type { Command } from "@devora-code/api";
import { container, singleton } from "tsyringe";
import type { WebviewPanel } from "vscode";
import { DevoraCodeWebview } from "./provider/webview";

@singleton()
export class WebviewModule {
  private activePanel: WebviewPanel | undefined;

  constructor(
    private readonly commandRouter: CommandRouter,
    private readonly notificationService: NotificationService,
  ) {}

  public openDashboard(): void {
    if (this.activePanel) {
      this.activePanel.reveal();
      return;
    }

    const webview = container.resolve(DevoraCodeWebview);
    this.activePanel = webview.show();

    this.registerListener(this.activePanel);
    this.registerCleanup(this.activePanel);
  }

  private registerCleanup(panel: WebviewPanel): void {
    panel.onDidDispose(
      () => {
        console.log("Dashboard geschlossen");
        this.activePanel = undefined;
      },
      null,
      [],
    );
  }

  private registerListener(panel: WebviewPanel): void {
    panel.webview.onDidReceiveMessage(
      async (command: Command) => {
        const result = await this.commandRouter.execute(command);
        if (isErrorResponse(result)) {
          this.notificationService.showError(`Command "${command.type}" fehlgeschlagen: ${result.error.message}`, result.error);
        }

        panel.webview.postMessage(result);
      },
      undefined,
      [],
    );
  }
}
