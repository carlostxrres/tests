import type { CellData, Column, RowData } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataTableFeatures } from "./features";

type Props<TData extends RowData, TValue extends CellData> = {
  column: Column<DataTableFeatures, TData, TValue>;
  // Defaults to the column's `meta.label`, which the column menu reads too, so
  // the label only has to be written once.
  title?: string;
  className?: string;
};

export function DataTableColumnHeader<TData extends RowData, TValue extends CellData>({
  column,
  title,
  className,
}: Props<TData, TValue>) {
  const label = title ?? column.columnDef.meta?.label ?? column.id;
  if (!column.getCanSort()) {
    return <span className={cn("text-xs font-medium", className)}>{label}</span>;
  }
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 text-xs data-[sorted=true]:text-foreground", className)}
      data-sorted={sorted !== false}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUpIcon data-icon="inline-end" />
      ) : sorted === "desc" ? (
        <ArrowDownIcon data-icon="inline-end" />
      ) : (
        <ChevronsUpDownIcon data-icon="inline-end" className="opacity-50" />
      )}
    </Button>
  );
}
