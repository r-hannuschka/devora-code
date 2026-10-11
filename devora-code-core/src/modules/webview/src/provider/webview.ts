import { EXTENSION_CONTEXT_TOKEN } from "@/core/constants";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { inject, singleton } from "tsyringe";
import { type ExtensionContext, Uri, ViewColumn, type WebviewPanel, window } from "vscode";

@singleton()
export class WorkpulseWebview {

  constructor(@inject(EXTENSION_CONTEXT_TOKEN) private readonly context: ExtensionContext) {}

  show(): WebviewPanel {
    const distFolderPath = path.join(this.context.extensionPath, "dist", "browser");
    const indexPath = path.join(distFolderPath, "index.html");

    if (!existsSync(indexPath)) {
      window.showErrorMessage(`WebView nicht gefunden: ${indexPath}`);
      throw new Error("WebView Datei nicht vorhanden");
    }

    const panel = this.createWebviewPanel();
    this.render(panel, distFolderPath, indexPath);

    return panel;
  }

  private createWebviewPanel(): WebviewPanel {
    return window.createWebviewPanel("timetrackerWebview", "TimeTracker Dashboard", ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [Uri.file(path.join(this.context.extensionPath, "dist"))],
    });
  }

  private render(panel: WebviewPanel, distFolderPath: string, indexPath: string): void {
    let htmlContent = readFileSync(indexPath, "utf-8");

    htmlContent = this.convertPathsForWebview(panel, distFolderPath, htmlContent);
    htmlContent = this.injectCSP(panel, htmlContent);

    panel.webview.html = htmlContent;
  }

  private convertPathsForWebview(panel: WebviewPanel, distFolderPath: string, html: string): string {
    return html.replace(/(href|src)="([^"]*)"/g, (match, type, link) => {
      if (link.startsWith("http") || link.startsWith("data:")) {
        return match;
      }

      const resourceUri = Uri.file(path.join(distFolderPath, link));
      const webviewUri = panel.webview.asWebviewUri(resourceUri);
      return `${type}="${webviewUri}"`;
    });
  }

  private injectCSP(panel: WebviewPanel, html: string): string {
    const cspSource = panel.webview.cspSource;
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${cspSource} 'unsafe-inline' 'unsafe-eval'; style-src ${cspSource} 'unsafe-inline'; font-src ${cspSource}; img-src ${cspSource} data:;">`;

    return html.replace("<head>", `<head>${cspMeta}`);
  }
}
