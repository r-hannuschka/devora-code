import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'devora-code-teaser',
  standalone: true,
  templateUrl: './teaser.component.html',
  styleUrls: ['./teaser.component.scss'],
})
export class workpulseTeaserComponent {
  readonly isOpen = signal(false);
}
