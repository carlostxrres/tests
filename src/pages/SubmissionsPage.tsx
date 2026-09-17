import { createColumnHelper } from "@tanstack/react-table";
import { EyeIcon, HistoryIcon, MoreHorizontalIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { DataTableFeatures } from "@/components/data-table/features";
import { ResultBadge } from "@/components/ResultBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { UnitCombobox } from "@/components/UnitCombobox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useExams } from "@/lib/queries/exams";
import { useSubmissions } from "@/lib/queries/submissions";
import { normalize } from "@/lib/question-rows";
import { useUrlFilters } from "@/lib/search-params";
import type { Result, SubmissionView } from "@/lib/types";

const resultOptions = [
  { value: "", label: "Todas" },
  { value: "correct", label: "Correctas" },
  { value: "incorrect", label: "Incorrectas" },
  { value: "unanswered", label: "Sin responder" },
] as const satisfies readonly { value: Result | ""; label: string }[];

const columnHelper = createColumnHelper<DataTableFeatures, SubmissionView>();

const columns = columnHelper.columns([
  columnHelper.accessor("timestamp", {
    id: "timestamp",
    meta: { label: "Fecha" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(getValue())}
      </span>
    ),
    sortFn: "basic",
  }),
  columnHelper.accessor("result", {
    id: "result",
    meta: { label: "Resultado" },
    header: "Resultado",
    enableSorting: false,
    cell: ({ getValue }) => <ResultBadge result={getValue()} />,
  }),
  columnHelper.accessor("statement", {
    id: "statement",
    header: "Pregunta",
    // Rows are unidentifiable without it.
    enableHiding: false,
    enableSorting: false,
    cell: ({ row, getValue }) => (
      <Link
        to={`/explore/questions/${row.original.question_id}`}
        className="line-clamp-3 min-w-64 max-w-md text-pretty underline-offset-4 hover:underline"
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("exam_name", {
    id: "exam",
    meta: { label: "Examen" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue()}</span>,
    sortFn: "text",
  }),
  columnHelper.accessor("unit_number", {
    id: "unit",
    meta: { label: "Unidad" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ row }) => (
      <span className="block max-w-40 truncate text-xs" title={row.original.unit_name}>
        <span className="font-mono text-muted-foreground">{row.original.unit_number}.</span>{" "}
        {row.original.unit_name}
      </span>
    ),
    sortFn: "basic",
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    // Unlabelled, so it would show as a blank entry in the column menu.
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link to={`/explore/submissions/${row.original.id}`} />}>
              <EyeIcon />
              Ver respuesta
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link to={`/explore/questions/${row.original.question_id}`} />}
            >
              <SearchIcon />
              Ver pregunta
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  }),
]);

export function SubmissionsPage() {
  const exams = useExams();
  const { get, patch } = useUrlFilters();
  const q = get("q");
  const result = get("result") as Result | "";
  const from = get("from");
  const to = get("to");
  const question = get("question");
  const unit = get("unit");

  const submissions = useSubmissions({ result, from, to, question, unit });

  const filtered = useMemo(() => {
    const rows = submissions.data ?? [];
    const needle = normalize(q.trim());
    if (!needle) return rows;
    return rows.filter((row) =>
      normalize(`${row.exam_name} ${row.unit_name} ${row.statement}`).includes(needle),
    );
  }, [submissions.data, q]);

  const hasFilters = Boolean(q || result || from || to || question || unit);

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
            exams={exams.data}
            value={unit}
            onValueChange={(next) => patch({ unit: next })}
            className="min-w-0 flex-1"
          />
          <StatusSelect
            aria-label="Resultado"
            value={result}
            onValueChange={(next) => patch({ result: next })}
            options={resultOptions}
            placeholder="Resultado"
            className="w-36"
          />
        </div>
      </div>
      <DateRangePicker
        from={from}
        to={to}
        onChange={(range) => patch({ from: range.from, to: range.to })}
      />
      {question && (
        <Button
          variant="secondary"
          size="sm"
          className="w-fit"
          onClick={() => patch({ question: null })}
        >
          Filtrando por una pregunta
          <XIcon data-icon="inline-end" />
        </Button>
      )}
      {submissions.data && (
        <p className="text-sm text-muted-foreground">{filtered.length} respuestas</p>
      )}
      {submissions.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          tableId="submissions"
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "timestamp", desc: true }]}
          empty={
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>Sin respuestas</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "Ninguna respuesta coincide con los filtros."
                    : "Cuando hagas un test, tus respuestas aparecerán aquí."}
                </EmptyDescription>
              </EmptyHeader>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patch({
                      q: null,
                      result: null,
                      from: null,
                      to: null,
                      question: null,
                      unit: null,
                    })
                  }
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
