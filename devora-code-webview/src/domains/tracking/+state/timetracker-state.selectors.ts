import { Selector } from '@ngxs/store';
import { TimetrackerState } from './timetracker-state';
import type { TimetrackerStateModel } from './timetracker-state.model';
import type { TimeEntry } from '@devora-code/api/core';
import { differenceInMinutes } from "date-fns";

export class TimetrackerStateSelectors {
  @Selector([TimetrackerState])
  static monthData(ctx: TimetrackerStateModel) {
    return ctx.monthData;
  }

  @Selector([TimetrackerState])
  static trackedToday(ctx: TimetrackerStateModel) {
    return ctx.trackedToday;
  }
}
