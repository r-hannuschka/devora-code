import { BaseException } from "@/core/exception";

export class TimeTrackerError extends BaseException {
  protected errorCode = 10_000;

  constructor(message = "TimeTracker-Fehler") {
    super(message);
  }
}
