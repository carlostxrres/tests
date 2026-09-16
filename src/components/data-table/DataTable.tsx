import { type ColumnDef, type RowData, type SortingState, useTable } from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./DataTablePagination";
import { type DataTableFeatures, dataTableFeatures } from "./features";

type DataTableProps<TData extends RowData> = {
  // `any` mirrors columnHelper.columns(): each column carries its own value type.
  // biome-ignore lint/suspicious/noExplicitAny: matches TanStack's own signature
  columns: ReadonlyArray<ColumnDef<DataTableFeatures, TData, any>>;
  data: TData[];
  initialSorting?: SortingState;
  pageSize?: number;
  empty?: ReactNode;
  className?: string;
  getRowId?: (row: TData) => string;
};

// Sorting + pagination over an already-filtered array. Horizontal overflow
// scrolls inside the table wrapper so the page never scrolls sideways.
export function DataTable<TData extends RowData>({
  columns,
  data,
  initialSorting = [],
  pageSize = 25,
  empty,
  className,
  getRowId,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: columns as ColumnDef<DataTableFeatures, TData, unknown>[],
    getRowId,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: true,
  });

  const rows = table.getRowModel().rows;

  if (data.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card", className)}>
        {empty ?? <p className="p-6 text-center text-sm text-muted-foreground">Sin resultados.</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-x-auto rounded-xl border bg-card">
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
                {row.getAllCells().map((cell) => (
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
    </div>
  );
}
