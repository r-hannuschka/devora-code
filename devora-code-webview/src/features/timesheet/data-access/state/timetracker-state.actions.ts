
export class FetchMonth {
  static readonly type = '[Timetracker] fetch month';
  constructor(readonly payload: { month: string }) {}
}
