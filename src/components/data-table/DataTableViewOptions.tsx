import type { ReactTable, RowData } from "@tanstack/react-table";
import { Settings2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "./features";

type Props<TData extends RowData> = {
  table: ReactTable<DataTableFeatures, TData>;
};

// Lets the user pick which columns are shown. Columns opt out with
// `enableHiding: false`; the rest need a `meta.label`, because most headers
// render JSX rather than plain text.
export function DataTableViewOptions<TData extends RowData>({ table }: Props<TData>) {
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide());
  if (hideable.length === 0) return null;

  const visibleCount = hideable.filter((column) => column.getIsVisible()).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2Icon data-icon="inline-start" />
        Columnas
      </DropdownMenuTrigger>
      {/* The popup is pinned to the trigger's width by default, which clips
          labels like "Respondidas". */}
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        {/* DropdownMenuLabel is Base UI's MenuGroupLabel and throws outside a
            group, so it has to live inside DropdownMenuGroup. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
          {hideable.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              // Don't let the user hide the last one and end up with a blank table.
              disabled={column.getIsVisible() && visibleCount === 1}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {column.columnDef.meta?.label ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
