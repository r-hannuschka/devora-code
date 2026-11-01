import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { PaginationItem } from './api';
import { PaginationController } from './pagination-controller';

@Component({
  selector: 'devora-code-pagination',
  standalone: true,
  styleUrl: './pagination.component.scss',
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [MatIcon],
})
export class PaginationComponent {
  private readonly paginationCtrl = inject(PaginationController);

  /**
   * Da 'change' im Service bereits ein computed() Signal ist,
   * weisen wir es hier einfach direkt zu. Kein 'toSignal()' nötig!
   */
  public readonly data = this.paginationCtrl.change;

  /**
   * Go to page
   */
  public goTo(item: PaginationItem): void {
    const page = item.value as number;
    this.paginationCtrl.goTo(page);
  }

  /**
   * Go to next page
   */
  public nextPage(): void {
    this.paginationCtrl.nextPage();
  }

  /**
   * Go to prev page
   */
  public prevPage(): void {
    this.paginationCtrl.prevPage();
  }
}
