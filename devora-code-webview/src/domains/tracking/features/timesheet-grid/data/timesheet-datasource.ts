import type { TimesheetApi } from '@/core/api';
import { computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { TimeEntry } from '@devora-code/api/core';
import { of } from 'rxjs';

export interface TimesheetData {
  data: TimeEntry[];
  total: number;
  page: number;
  pages: number;
}

export class TimesheetDatasource {
  private readonly ITEMS_PER_PAGE = 30;
  private readonly = new Intl.Collator('de', { sensitivity: 'base', usage: 'search' });

  private cached: TimeEntry[] = [];

  private readonly range = signal<{ startAt: string; endAt: string }>({
    startAt: '',
    endAt: '',
  });

  private readonly page = signal<number>(0);

  private readonly keywords = signal<string>('');

  constructor(private readonly api: TimesheetApi) {}

  private readonly timeEntryResource = rxResource({
    params: () => ({ range: this.range() }),
    stream: ({ params }) => {
      const { startAt, endAt } = params.range ?? {};
      if (!startAt) {
        return of<{ entries: TimeEntry[] }>({ entries: [] });
      }
      return this.api.getPeriod(startAt, endAt);
    },
  });

  private readonly timeEntriesRaw = computed(() => {
    const resource = this.timeEntryResource;
    if (resource.isLoading()) {
      return this.cached;
    }

    if (resource.error()) {
      return [];
    }

    return resource.value()?.entries ?? [];
  });

  private readonly filteredData = computed(() => {
    const raw = this.timeEntriesRaw();
    const searchKeywords = this.keywords();

    if (!searchKeywords || searchKeywords.trim().length === 0) {
      return raw;
    }

    const search = searchKeywords.toLocaleLowerCase();
    const filtered = raw.filter((entry) => {
      const issueKey = entry.issueKey.toLocaleLowerCase();
      return issueKey.includes(search);
    });
    return filtered;
  });

  reload() {
    this.timeEntryResource.reload();
  }

  setRange(startAt: string, endAt: string) {
    this.range.set({ startAt, endAt });
    this.setPage(1);
  }

  setPage(page: number) {
    this.page.set(Math.max(0, page - 1));
  }

  setSearch(keywords: string) {
    this.keywords.set(keywords);
    this.setPage(1);
  }

  readonly data = computed(() => {
    const entries = this.filteredData();
    const page = this.page();

    const start = this.ITEMS_PER_PAGE * page;
    const data = entries.slice(start, this.ITEMS_PER_PAGE + start);
    const pages = Math.ceil(entries.length / this.ITEMS_PER_PAGE);
    this.cached = data;

    return {
      data,
      page: Math.min(page + 1, pages),
      pages,
      total: entries.length,
    };
  });
}
