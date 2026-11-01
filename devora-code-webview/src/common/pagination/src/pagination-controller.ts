import { Service, computed, signal } from '@angular/core';
import { PaginationData, PaginationItem, Settings } from './api';

@Service({ autoProvided: false })
export class PaginationController {
  private readonly _page = signal<number>(1);
  private readonly _total = signal<number>(1);
  private readonly _displayCount = signal<number>(5);

  set display(count: number) {
    let finalCount = count;
    if (isNaN(count) || count < 1) {
      finalCount = 5;
    }
    if (finalCount % 2 === 0) {
      finalCount = finalCount - 1;
    }
    this._displayCount.set(finalCount);
  }

  get display(): number {
    return this._displayCount();
  }

  get settings(): Settings {
    return {
      page: this._page(),
      total: this._total(),
    };
  }

  // Berechnet die Fragmente exakt nach deinem Original-Algorithmus
  private readonly navigationFragments = computed<Array<string | number>>(() => {
    const page = this._page();
    const total = this._total();
    const display = this._displayCount();

    const items: Array<string | number> = total > 5 ? [1, '...', '...', total] : [];

    if (total <= display) {
      for (let i = 1; i <= total; i++) {
        items.push(i);
      }
    } else {
      // create subpages
      const pages: number[] = [];

      let i = display - 1;
      let j = Math.floor(i / 2) * -1;

      for (; i >= 0; i--, j++) {
        const skip = page + j <= 1 || page + j >= total;
        if (!skip) {
          pages.push(page + j);
        }
      }

      // Absicherung, falls das pages-Array beim ersten Render-Zyklus noch leer ist
      if (pages.length > 0) {
        /**
         * base template: [1, '...', '...', l] (l = last page)
         *
         * page 1: move to index 1 and replace 1 item -> [1, pages, '...', l]
         * page n: move to index 2 and replace 0 item -> [1, '...', pages, '...', l]
         * page l: move to index 2 and replace 1 item -> [1, '...', pages, l]
         */
        const start   = pages[0] - 1 === 1 ? 1 : 2;
        const replace = pages[0] - 1 > 1 && pages[pages.length - 1] + 1 < total ? 0 : 1;
        items.splice(start, replace, ...pages);
      }
    }
    return items;
  });


  private readonly paginationItems = computed<PaginationItem[]>(() => {
    const page = this._page();
    return this.navigationFragments().map((item) => {
      let clickable = typeof item === 'number';
      clickable = clickable && item !== page;

      return {
        clickable: clickable,
        text: item.toString(),
        value: item,
      };
    });
  });

  readonly change = computed<PaginationData>(() => {
    return {
      items: this.paginationItems(),
      state: {
        active: this._page(),
        isFirst: this._page() === 1,
        isLast: this._page() === this._total(),
        total: this._total(),
      },
    };
  });

  readonly pageChange = computed<number>(() => this._page());

  goTo(page: number) {
    if (page < 1 || page > this._total()) {
      return;
    }

    this._page.set(page);
  }

  nextPage() {
    if (this._page() + 1 > this._total()) {
      return;
    }
    this.goTo(this._page() + 1);
  }

  prevPage() {
    if (this._page() - 1 < 0) {
      return;
    }
    this.goTo(this._page() - 1);
  }

  update(settings: Settings) {
    this._total.set(settings.total);
    this._page.set(settings.page);
    this.display = settings.displayCount || this.display;
  }
}
