import { inject, Injectable } from '@angular/core';
import { TimesheetApi } from '@/core/timesheet';
import { Action, State, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { tap } from 'rxjs';
import { FetchMonth, FetchToday } from './timetracker-state.actions';
import type { TimetrackerStateModel } from './timetracker-state.model';
import { format, startOfDay } from 'date-fns';

@State<TimetrackerStateModel>({
  name: 'TimetrackerState',
  defaults: {
    monthData: null,
    trackedToday: null,
  },
})
@Injectable()
export class TimetrackerState {
  private readonly timesheetApi = inject(TimesheetApi);

  @Action(FetchMonth)
  protected fetchMonth(ctx: StateContext<TimetrackerStateModel>, { payload }: FetchMonth) {
    return this.timesheetApi
      .getMonth(payload.month)
      .pipe(tap((data) => ctx.setState(patch({ monthData: data }))));
  }

  @Action(FetchToday)
  protected fetchToday(ctx: StateContext<TimetrackerStateModel>) {
  }
}
