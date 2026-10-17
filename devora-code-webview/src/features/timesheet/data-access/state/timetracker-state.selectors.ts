import { Selector } from '@ngxs/store';
import { TimetrackerState } from './timetracker-state';
import type { TimetrackerStateModel } from './timetracker-state.model';

export class TimetrackerStateSelectors {
  @Selector([TimetrackerState])
  static monthData(ctx: TimetrackerStateModel) {
    return ctx.monthData;
  }
}
