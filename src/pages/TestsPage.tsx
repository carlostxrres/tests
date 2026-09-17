import { createColumnHelper } from "@tanstack/react-table";
import { ClipboardListIcon, EyeIcon, PlayIcon, PlusIcon, ZapIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { DataTableFeatures } from "@/components/data-table/features";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { TestActionsMenu } from "@/components/TestActionsMenu";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/datetime";
import { type TestWithStats, useTests } from "@/lib/queries/tests";
import { isFinished } from "@/lib/tests";

const columnHelper = createColumnHelper<DataTableFeatures, TestWithStats>();

function FeedbackBadge({ instant }: { instant: boolean }) {
  return instant ? (
    <Badge variant="secondary">
      <ZapIcon />
      Instantáneo
    </Badge>
  ) : (
    <Badge variant="outline">Al final</Badge>
  );
}

const Fraction = ({ value, total }: { value: number; total: number }) => (
  <span className="font-mono text-xs tabular-nums">
    {value}/{total}
  </span>
);

const nameColumn = columnHelper.accessor((t) => t.name ?? "", {
  id: "name",
  meta: { label: "Nombre" },
  // Rows are unidentifiable without it.
  enableHiding: false,
  header: ({ column }) => <DataTableColumnHeader column={column} />,
  cell: ({ row }) => (
    <Link
      to={`/tests/${row.original.id}`}
      className="block min-w-28 max-w-56 truncate underline-offset-4 hover:underline"
    >
      {row.original.name ?? <span className="text-muted-foreground italic">Sin nombre</span>}
    </Link>
  ),
  sortFn: "text",
});

const startColumn = columnHelper.accessor("start", {
  id: "start",
  meta: { label: "Inicio" },
  header: ({ column }) => <DataTableColumnHeader column={column} />,
  cell: ({ getValue }) => (
    <span className="whitespace-nowrap text-xs text-muted-foreground">
      {formatDateTime(getValue())}
    </span>
  ),
  sortFn: "basic",
});

const typeColumn = columnHelper.accessor("instant_feedback", {
  id: "type",
  meta: { label: "Tipo" },
  header: "Tipo",
  enableSorting: false,
  cell: ({ getValue }) => <FeedbackBadge instant={getValue()} />,
});

const answeredColumn = columnHelper.accessor((t) => t.stats.answered_count, {
  id: "answered",
  meta: { label: "Respondidas" },
  header: ({ column }) => <DataTableColumnHeader column={column} />,
  cell: ({ row }) => (
    <Fraction
      value={row.original.stats.answered_count}
      total={row.original.stats.total_questions}
    />
  ),
  sortFn: "basic",
});

const correctColumn = columnHelper.accessor((t) => t.stats.correct_count, {
  id: "correct",
  meta: { label: "Acertadas" },
  header: ({ column }) => <DataTableColumnHeader column={column} />,
  cell: ({ row }) =>
    isFinished(row.original) || row.original.instant_feedback ? (
      <Fraction
        value={row.original.stats.correct_count}
        total={row.original.stats.total_questions}
      />
    ) : (
      <span className="text-xs text-muted-foreground">–</span>
    ),
  sortFn: "basic",
});

const unitsColumn = columnHelper.accessor((t) => t.unit_ids.length, {
  id: "units",
  meta: { label: "Unidades" },
  header: ({ column }) => <DataTableColumnHeader column={column} />,
  cell: ({ getValue }) => <span className="font-mono text-xs tabular-nums">{getValue()}</span>,
  sortFn: "basic",
});

const inProgressColumns = columnHelper.columns([
  nameColumn,
  startColumn,
  typeColumn,
  answeredColumn,
  correctColumn,
  unitsColumn,
  columnHelper.display({
    id: "actions",
    header: "",
    // Unlabelled, so it would show as a blank entry in the column menu.
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <LinkButton size="sm" to={`/tests/${row.original.id}`}>
          <PlayIcon data-icon="inline-start" />
          Continuar
        </LinkButton>
        <TestActionsMenu test={row.original} />
      </div>
    ),
  }),
]);

const finishedColumns = columnHelper.columns([
  nameColumn,
  startColumn,
  columnHelper.accessor("end", {
    id: "end",
    meta: { label: "Fin" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {value ? formatDateTime(value) : "–"}
        </span>
      );
    },
    sortFn: "basic",
  }),
  typeColumn,
  answeredColumn,
  correctColumn,
  unitsColumn,
  columnHelper.display({
    id: "actions",
    header: "",
    // Unlabelled, so it would show as a blank entry in the column menu.
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <LinkButton variant="outline" size="sm" to={`/tests/${row.original.id}?questionIndex=-1`}>
          <EyeIcon data-icon="inline-start" />
          Ver detalle
        </LinkButton>
        <TestActionsMenu test={row.original} />
      </div>
    ),
  }),
]);

export function TestsPage() {
  const tests = useTests();
  const inProgress = useMemo(() => (tests.data ?? []).filter((t) => !isFinished(t)), [tests.data]);
  const finished = useMemo(() => (tests.data ?? []).filter((t) => isFinished(t)), [tests.data]);

  return (
    <>
      <PageHeader
        title="Tests"
        actions={
          <LinkButton size="lg" to="/tests/new">
            <PlusIcon data-icon="inline-start" />
            Nuevo test
          </LinkButton>
        }
      />
      <div className="flex flex-col gap-8 px-4">
        {tests.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold">Tests a medias</h2>
              <DataTable
                tableId="tests-in-progress"
                columns={inProgressColumns}
                data={inProgress}
                getRowId={(t) => t.id}
                initialSorting={[{ id: "start", desc: true }]}
                pageSize={10}
                empty={
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ClipboardListIcon />
                      </EmptyMedia>
                      <EmptyTitle>Ningún test a medias</EmptyTitle>
                      <EmptyDescription>Empieza uno nuevo cuando quieras.</EmptyDescription>
                    </EmptyHeader>
                    <LinkButton variant="outline" size="sm" to="/tests/new">
                      <PlusIcon data-icon="inline-start" />
                      Nuevo test
                    </LinkButton>
                  </Empty>
                }
              />
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold">Tests terminados</h2>
              <DataTable
                tableId="tests-finished"
                columns={finishedColumns}
                data={finished}
                getRowId={(t) => t.id}
                initialSorting={[{ id: "end", desc: true }]}
                pageSize={10}
                empty={
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyTitle>Ningún test terminado</EmptyTitle>
                      <EmptyDescription>Aquí verás tus resultados.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                }
              />
            </section>
          </>
        )}
      </div>
    </>
  );
}
