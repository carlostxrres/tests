import { createColumnHelper } from "@tanstack/react-table";
import { CircleHelpIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { DataTableFeatures } from "@/components/data-table/features";
import { ResultBadge } from "@/components/ResultBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { UnitCombobox } from "@/components/UnitCombobox";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/datetime";
import { normalize, type QuestionRow, useQuestionRows } from "@/lib/question-rows";
import { useUrlFilters } from "@/lib/search-params";
import { formatRatio } from "@/lib/stats";

type Status = "" | "none" | "correct" | "incorrect" | "unanswered";

const statusOptions = [
  { value: "", label: "Todas" },
  { value: "none", label: "Sin intentos" },
  { value: "correct", label: "Última correcta" },
  { value: "incorrect", label: "Última incorrecta" },
  { value: "unanswered", label: "Última sin responder" },
] as const satisfies readonly { value: Status; label: string }[];

const columnHelper = createColumnHelper<DataTableFeatures, QuestionRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("statement", {
    id: "statement",
    header: "Pregunta",
    enableSorting: false,
    cell: ({ row, getValue }) => (
      <Link
        to={`/explore/questions/${row.original.id}`}
        className="line-clamp-3 min-w-64 max-w-md text-pretty underline-offset-4 hover:underline"
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("unitNumber", {
    id: "unit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unidad" />,
    cell: ({ row }) => (
      <span className="block max-w-40 truncate text-xs" title={row.original.unitName}>
        <span className="font-mono text-muted-foreground">{row.original.unitNumber}.</span>{" "}
        {row.original.unitName}
      </span>
    ),
    sortFn: "basic",
  }),
  columnHelper.accessor("examName", {
    id: "exam",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Examen" />,
    cell: ({ getValue }) => (
      <span className="block max-w-32 truncate text-xs text-muted-foreground">{getValue()}</span>
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("ratio", {
    id: "ratio",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aciertos" />,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
        {formatRatio(row.original.ratio)}
        {row.original.lastResult && <ResultBadge result={row.original.lastResult} iconOnly />}
      </span>
    ),
    sortFn: "basic",
    sortUndefined: "last",
  }),
  columnHelper.accessor("submissions", {
    id: "submissions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Respuestas" />,
    cell: ({ getValue }) => <span className="font-mono text-xs tabular-nums">{getValue()}</span>,
    sortFn: "basic",
  }),
  columnHelper.accessor("lastSubmissionAt", {
    id: "last",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Última" />,
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {value ? formatDateTime(value) : "–"}
        </span>
      );
    },
    sortFn: "basic",
    sortUndefined: "last",
  }),
]);

export function QuestionsPage() {
  const { rows, exams, isPending } = useQuestionRows();
  const { get, patch } = useUrlFilters();
  const q = get("q");
  const unit = get("unit");
  const status = get("status") as Status;

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = normalize(q.trim());
    return rows.filter((row) => {
      if (unit && row.unitId !== unit) return false;
      if (status === "none" && row.submissions > 0) return false;
      if (status && status !== "none" && row.lastResult !== status) return false;
      if (needle) {
        const haystack = normalize(`${row.examName} ${row.unitName} ${row.statement}`);
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, q, unit, status]);

  const hasFilters = Boolean(q || unit || status);

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="sm:flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Buscar por examen, unidad o enunciado"
            value={q}
            onChange={(e) => patch({ q: e.target.value })}
          />
          {q && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Limpiar"
                size="icon-xs"
                onClick={() => patch({ q: null })}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <div className="flex gap-2">
          <UnitCombobox
            exams={exams}
            value={unit}
            onValueChange={(next) => patch({ unit: next })}
            className="min-w-0 flex-1"
          />
          <StatusSelect
            aria-label="Estado"
            value={status}
            onValueChange={(next) => patch({ status: next })}
            options={statusOptions}
            placeholder="Estado"
            className="w-40"
          />
        </div>
      </div>
      {rows && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {rows.length} preguntas
        </p>
      )}
      {isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "unit", desc: false }]}
          empty={
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleHelpIcon />
                </EmptyMedia>
                <EmptyTitle>Sin preguntas</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "Ninguna pregunta coincide con los filtros."
                    : "No hay preguntas cargadas."}
                </EmptyDescription>
              </EmptyHeader>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patch({ q: null, unit: null, status: null })}
                >
                  Quitar filtros
                </Button>
              )}
            </Empty>
          }
        />
      )}
    </div>
  );
}
