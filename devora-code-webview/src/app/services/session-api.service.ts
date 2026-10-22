import type { SessionApi } from '@/core/api';
import { inject } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import type {
  GetActiveSessionCommand,
  PauseSessionCommand,
  ResumeSessionCommand,
  ResetSessionCommand,
  StartSessionCommand,
  StopSessionCommand,
} from '@devora-code/api/session';
import type { ActiveSession } from '@devora-code/api/session';
import type { Observable } from 'rxjs';
import { VsCodeBridge } from './vscode-bridge';

/** SessionApi Implementierung — ruft VS Code Core Commands auf */
export class SessionApiService implements SessionApi {
  private readonly vscode = inject(VsCodeBridge);

  startTracking(issueKey: string): Observable<ActiveSession> {
    return this.vscode.request<ActiveSession>({
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

  getActiveTimer(): Observable<ActiveSession | null> {
    return this.vscode.request<ActiveSession | null>({
      id: crypto.randomUUID(),
      type: 'session:get-active',
    } as GetActiveSessionCommand);
  }

  pauseSession(): Observable<ActiveSession | null> {
    return this.vscode.request<ActiveSession | null>({
      id: crypto.randomUUID(),
      type: 'session:pause',
    } as PauseSessionCommand);
  }

  resumeSession(): Observable<ActiveSession | null> {
    return this.vscode.request<ActiveSession | null>({
      id: crypto.randomUUID(),
      type: 'session:resume',
    } as ResumeSessionCommand);
  }
}
