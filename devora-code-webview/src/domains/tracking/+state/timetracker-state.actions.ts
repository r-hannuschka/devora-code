
export class FetchMonth {
  static readonly type = '[Timetracker] fetch month';
  constructor(readonly payload: { month: string }) {}
}

export class FetchToday {
  static readonly type = '[Timetracker] fetch today';
}
