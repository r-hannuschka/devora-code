export interface Settings {
    /**
     * amount of fragments which will created for navigation
     * default 5
     */
    displayCount?: number;
    /**
     * current page
     */
    page: number;
    /**
     * total count of pages
     */
    total: number;
}

export interface PaginationItem {
    clickable: boolean;
    text: string;
    value: string | number;
}

export interface PaginationState {
    active: number;
    isLast: boolean;
    isFirst: boolean;
    total: number;
}

export interface PaginationData {
    items: PaginationItem[];
    state: PaginationState;
}