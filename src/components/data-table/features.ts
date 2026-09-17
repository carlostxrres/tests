import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

// Filtering is done outside the table (rows are pre-filtered in each page),
// so only sorting, pagination and column visibility are registered.
export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  // Type-only slot for `columnDef.meta`. Most headers are JSX, so the plain
  // text label for the column menu lives here instead.
  columnMeta: metaHelper<{ label?: string }>(),
});

export type DataTableFeatures = typeof dataTableFeatures;
