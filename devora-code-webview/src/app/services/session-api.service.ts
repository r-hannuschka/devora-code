import type { SessionApi } from '@/core/session';
import { inject } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import type {
  StartSessionCommand,
  ResetSessionCommand,
  StopSessionCommand,
  GetActiveSessionCommand,
} from '@devora-code/api/session';
import type { Observable } from 'rxjs';
import { VsCodeBridge } from './vscode-bridge';

/** SessionApi Implementierung — ruft VS Code Core Commands auf */
export class SessionApiService implements SessionApi {
  private readonly vscode = inject(VsCodeBridge);

  startTracking(issueKey: string): Observable<TimeEntry> {
    return this.vscode.request<TimeEntry>({
      id: crypto.randomUUID(),
      type: 'session:start',
      payload: { issueKey },
    } as StartSessionCommand);
  }

  stopTracking(): Observable<TimeEntry> {
    return this.vscode.request<TimeEntry>({
      id: crypto.randomUUID(),
      type: 'session:stop',
    } as StopSessionCommand);
  }

  resetSession(): Observable<boolean> {
    return this.vscode.request<boolean>({
      id: crypto.randomUUID(),
      type: 'session:reset',
    } as ResetSessionCommand);
  }

  getActiveTimer(): Observable<TimeEntry | null> {
    return this.vscode.request<TimeEntry | null>({
      id: crypto.randomUUID(),
      type: 'session:get-active',
    } as GetActiveSessionCommand);
  }
}
