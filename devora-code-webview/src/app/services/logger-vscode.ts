import { inject, Injectable } from '@angular/core';
import { VsCodeBridge } from './vscode-bridge';
import type { SendLogCommand } from '@devora-code/api';
import type { ILoggerFacade } from '@/core/api';

/**
 * Logger-Implementation im Webview.
 * Sendet Logs per Command-Pattern an den Extension-Host,
 * der sie in ~/devora-code-logs/devora-code.log schreibt.
 */
@Injectable()
export class LoggerVsCode implements ILoggerFacade {
  private readonly vscodeBridge = inject(VsCodeBridge);

  private send(level: SendLogCommand['payload']['level'], message: string, context?: string): void {
    const command: SendLogCommand = {
      id: crypto.randomUUID(),
      type: 'logger:send-log',
      payload: { level, message, context },
    };

    this.vscodeBridge.request<void>(command).subscribe({
      error: () => {
        // Silent fail — Logger darf nicht den Betrieb stören
      },
    });
  }

  debug(message: string, context?: string): void {
    this.send('debug', message, context);
  }

  info(message: string, context?: string): void {
    this.send('info', message, context);
  }

  warn(message: string, context?: string): void {
    this.send('warn', message, context);
  }

  error(message: string, context?: string): void {
    this.send('error', message, context);
  }
}
