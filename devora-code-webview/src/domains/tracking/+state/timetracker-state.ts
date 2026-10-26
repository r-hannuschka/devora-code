import { TimesheetApi } from '@/core/api';
import { inject, Injectable } from '@angular/core';
import { Action, State, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { format } from 'date-fns';
import { switchMap, tap } from 'rxjs';
import { AddTimeEntry, FetchMonth } from './timetracker-state.actions';
import type { TimetrackerStateModel } from './timetracker-state.model';

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

  @Action(AddTimeEntry)
  protected addTimeEntry(ctx: StateContext<TimetrackerStateModel>, { timeEntry }: AddTimeEntry) {
    const month = format(timeEntry.startAt, 'yyyy-MM');

    return this.timesheetApi.addEntry(timeEntry).pipe(
      switchMap(() => this.timesheetApi.getMonth(month)),
      tap((monthData) => ctx.setState(patch({ monthData }))),
    );
  }
}
