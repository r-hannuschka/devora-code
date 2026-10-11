import { inject, Injectable } from '@angular/core';
import { TimeTrackerFlowFacade } from '@/core/api';
import { Action, State, type StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { tap } from 'rxjs';
import { FetchMonth } from './timetracker-state.actions';
import type { TimetrackerStateModel } from './timetracker-state.model';

@State<TimetrackerStateModel>({
  name: 'TimetrackerState',
  defaults: {
    monthData: null,
  },
})
@Injectable()
export class TimetrackerState {
  private readonly tracker = inject(TimeTrackerFlowFacade);

  @Action(FetchMonth)
  protected fetchMonth(ctx: StateContext<TimetrackerStateModel>, { payload }: FetchMonth) {
    return this.tracker
      .getMonth(payload.month)
      .pipe(tap((data) => ctx.setState(patch({ monthData: data }))));
  }
}
