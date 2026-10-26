import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { inject, Service, type ComponentRef } from '@angular/core';
import type { TimeEntry } from '@devora-code/api/core';
import { Subject, take, type Observable } from 'rxjs';
import { AddTimeEntryOverlayComponent } from './add-time-entry.overlay-component';

class AddTimeEntryOverlayRef {
  private afterClosed$ = new Subject<TimeEntry | null>();

  constructor(private readonly overlayRef: OverlayRef) {
    this.attachBackdropClickListener();
  }

  private attachBackdropClickListener() {
    this.overlayRef
      .backdropClick()
      .pipe(take(1))
      .subscribe(() => this.close(null));
  }

  close(timeEntry: TimeEntry | null) {
    this.afterClosed$.next(timeEntry);
    this.afterClosed$.complete();
    this.overlayRef.dispose();
  }

  afterClosed(): Observable<TimeEntry | null> {
    return this.afterClosed$.asObservable();
  }
}

@Service({ autoProvided: false })
export class AddTimeEntryOverlay {
  private readonly overlay = inject(Overlay);
  private addTimeEntryOverlayRef: AddTimeEntryOverlayRef | null = null;

  open(): Pick<AddTimeEntryOverlayRef, 'afterClosed'> {
    const overlayRef = this.createOverlay();
    const componentRef = this.attachPortal(overlayRef);

    this.addTimeEntryOverlayRef = new AddTimeEntryOverlayRef(overlayRef);

    this.registerListener(componentRef);
    return this.addTimeEntryOverlayRef;
  }

  private createOverlay() {
    const positionStrategy = this.overlay.position().global().centerHorizontally().top('88px');
    return this.overlay.create({
      hasBackdrop: true,
      positionStrategy,
    });
  }

  private attachPortal(overlayRef: OverlayRef) {
    const portal = new ComponentPortal(AddTimeEntryOverlayComponent);
    return overlayRef.attach(portal);
  }

  private registerListener(componentRef: ComponentRef<AddTimeEntryOverlayComponent>) {
    const sub = componentRef.instance.submitted.subscribe((timeEntry) => {
      this.addTimeEntryOverlayRef?.close(timeEntry);
      this.addTimeEntryOverlayRef = null;
      sub.unsubscribe();
    });
  }
}
