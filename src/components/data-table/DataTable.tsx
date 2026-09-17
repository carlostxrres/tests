import {
  type ColumnDef,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { type DataTableFeatures, dataTableFeatures } from "./features";

type DataTableProps<TData extends RowData> = {
  // `any` mirrors columnHelper.columns(): each column carries its own value type.
  // biome-ignore lint/suspicious/noExplicitAny: matches TanStack's own signature
  columns: ReadonlyArray<ColumnDef<DataTableFeatures, TData, any>>;
  data: TData[];
  // Identifies this table's stored column visibility. Must be unique per table.
  tableId: string;
  initialSorting?: SortingState;
  // Columns to start hidden, for tables dense enough to need it on a phone.
  initialColumnVisibility?: ColumnVisibilityState;
  pageSize?: number;
  empty?: ReactNode;
  className?: string;
  getRowId?: (row: TData) => string;
};

// Sorting, pagination and column visibility over an already-filtered array.
// Horizontal overflow scrolls inside the table wrapper so the page never
// scrolls sideways.
export function DataTable<TData extends RowData>({
  columns,
  data,
  tableId,
  initialSorting = [],
  initialColumnVisibility,
  pageSize = 25,
  empty,
  className,
  getRowId,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [columnVisibility, setColumnVisibility] = usePersistentState<ColumnVisibilityState>(
    `columns:${tableId}`,
    initialColumnVisibility ?? {},
    parseColumnVisibility,
  );

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: columns as ColumnDef<DataTableFeatures, TData, unknown>[],
    getRowId,
    state: { sorting, pagination, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) =>
      setColumnVisibility(typeof updater === "function" ? updater(columnVisibility) : updater),
    onPaginationChange: setPagination,
    autoResetPageIndex: true,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Outside the empty branch on purpose: a filter that matches nothing is
          exactly when the user may want a hidden column back. */}
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      {data.length === 0 ? (
        <div className="rounded-xl border bg-card">
          {empty ?? (
            <p className="p-6 text-center text-sm text-muted-foreground">Sin resultados.</p>
          )}
        </div>
      ) : (
        <>
          {/* The inner [data-slot=table-container] from ui/table.tsx is what scrolls
          (it is w-full, so it can never overflow this div); this one only clips
          the table's corners. */}
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {!header.isPlaceholder && <table.FlexRender header={header} />}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-top">
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}

// Stored visibility is whatever was in localStorage; keep only boolean entries
// so a renamed or removed column can't wedge the table.
function parseColumnVisibility(stored: unknown): ColumnVisibilityState | null {
  if (typeof stored !== "object" || stored === null || Array.isArray(stored)) return null;
  return Object.fromEntries(
    Object.entries(stored).filter(([, visible]) => typeof visible === "boolean"),
  ) as ColumnVisibilityState;
}
