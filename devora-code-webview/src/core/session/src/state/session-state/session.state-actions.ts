import type { TimeEntry } from "@devora-code/api";

export class FetchActiveSession {
  static readonly type = '[Session] fetch active session';
}

export class StartSession {
  static readonly type = '[Session] start session';
  constructor(readonly payload: { issueKey: string }) {}
}

export class SessionStarted {
  static readonly type = '[Session] session started';
  constructor(readonly payload: TimeEntry) {}
}

export class StopSession {
  static readonly type = '[Session] stop session';
}

export class SessionStopped {
  static readonly type = '[Session] session stopped';
}
