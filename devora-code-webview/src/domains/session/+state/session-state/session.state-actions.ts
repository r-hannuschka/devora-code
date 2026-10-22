import type { ActiveSession } from '@devora-code/api/session';

export class FetchActiveSession {
  static readonly type = '[Session] fetch active session';
}

export class StartSession {
  static readonly type = '[Session] start session';
  constructor(readonly payload: { issueKey: string }) {}
}

export class SessionStarted {
  static readonly type = '[Session] session started';
  constructor(readonly payload: ActiveSession) {}
}

export class StopSession {
  static readonly type = '[Session] stop session';
}

export class SessionStopped {
  static readonly type = '[Session] session stopped';
}

export class PauseSession {
  static readonly type = '[Session] pause session';
}

export class SessionPaused {
  static readonly type = '[Session] session paused';
}

export class ResumeSession {
  static readonly type = '[Session] resume session';
}

export class SessionResumed {
  static readonly type = '[Session] session resumed';
}
