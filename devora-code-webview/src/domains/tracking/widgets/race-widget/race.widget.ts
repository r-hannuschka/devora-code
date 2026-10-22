import { DEVORA_CODE_WIDGET, type DevoraCodeWidget, type DevoraCodeWidgetAction } from '@/core/widget';
import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RaceWidgetService } from './race.widget.service';

@Component({
  selector: 'devora-code-tracking-race',
  standalone: true,
  providers: [
    RaceWidgetService,
    {
      provide: DEVORA_CODE_WIDGET,
      useExisting: RaceWidgetComponent,
    },
  ],
  templateUrl: './race.widget.html',
  styleUrl: './race.widget.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RaceWidgetComponent implements DevoraCodeWidget {
  private readonly el = inject(ElementRef);
  protected readonly raceWidgetService = inject(RaceWidgetService);

  readonly title = 'Rot ist schneller';

  // --- SVG coordinate system (matches viewBox="0 0 800 120") ---
  private readonly svgStartX = 50;
  private readonly svgFinishX = 730;

  // --- container width in DOM pixels ---
  private readonly raceTrackElementWidth = signal<number>(300);

  // --- static values ---
  protected readonly paddingX = 60;
  protected readonly targetMinutes = 8 * 60; // 8 Stunden
  protected readonly timerActive = signal<boolean>(true);

  attached(): void {
    const nativeElement = this.el.nativeElement;
    this.raceTrackElementWidth.set(nativeElement.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.raceTrackElementWidth.set(entry.contentRect.width);
      }
    });
    observer.observe(nativeElement);
  }

  // --- DOM pixel track length (actual available width minus padding) ---
  protected readonly raceTrackLength = computed(() => {
    return Math.max(this.raceTrackElementWidth() - this.paddingX * 2, 0);
  });

  // --- runner position in SVG viewBox coordinates (0–800) ---
  protected readonly runnerX = computed(() => {
    const workedMinutesResource = this.raceWidgetService.trackedToday;

    if (workedMinutesResource.hasValue()) {
      const progress = Math.min(workedMinutesResource.value() / this.targetMinutes, 1);
      return this.svgStartX + progress * (this.svgFinishX - this.svgStartX);
    }

    return 0;
  });

  // --- finish line position in SVG viewBox coordinates ---
  protected readonly finishLineX = computed(() => {
    return this.svgFinishX;
  });
}
