import type { ReactTable, RowData } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { DataTableFeatures } from "./features";

export function DataTablePagination<TData extends RowData>({
  table,
}: {
  table: ReactTable<DataTableFeatures, TData>;
}) {
  const { pageIndex, pageSize } = table.state.pagination;
  const total = table.getRowCount();
  if (total <= pageSize) return null;
  const first = pageIndex * pageSize + 1;
  const last = Math.min(total, (pageIndex + 1) * pageSize);
  return (
    <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground tabular-nums">
      <span>
        {first}–{last} de {total}
      </span>
      <ButtonGroup>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página anterior"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página siguiente"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <ChevronRightIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
}
