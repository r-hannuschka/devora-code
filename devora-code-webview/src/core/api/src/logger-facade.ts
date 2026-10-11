import { InjectionToken } from '@angular/core';

/**
 * Logger Interface für den Webview.
 * Definiert das Contract, die konkrete Implementierung (LoggerVsCode)
 * nutzt dann VsCodeBridge für die Kommunikation mit dem Extension-Host.
 */
export interface ILoggerFacade {
  debug(message: string, context?: string): void;
  info(message: string, context?: string): void;
  warn(message: string, context?: string): void;
  error(message: string, context?: string): void;
}

export const LoggerFacade = new InjectionToken<ILoggerFacade>('LoggerFacade');
