import { ArrowLeftIcon, CircleHelpIcon, HistoryIcon } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { CorrectRatioChart } from "@/components/CorrectRatioChart";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useExam } from "@/lib/queries/exams";
import { useQuestionIndex, useQuestionStats } from "@/lib/queries/questions";
import { aggregateBy, emptyAggregate } from "@/lib/stats";

export function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const exam = useExam(id);
  const questions = useQuestionIndex();
  const stats = useQuestionStats();

  const questionsByUnit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions.data ?? []) counts.set(q.unit_id, (counts.get(q.unit_id) ?? 0) + 1);
    return counts;
  }, [questions.data]);

  const statsByUnit = useMemo(() => aggregateBy(stats.data, (s) => s.unit_id), [stats.data]);

  const back = (
    <LinkButton variant="ghost" size="sm" className="-ml-2 w-fit" to="/explore/syllabus">
      <ArrowLeftIcon data-icon="inline-start" />
      Temario
    </LinkButton>
  );

  if (exam.isPending) {
    return (
      <>
        <PageHeader eyebrow={back} title={<Skeleton className="h-7 w-48" />} />
        <div className="flex flex-col gap-2 px-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </>
    );
  }

  if (!exam.data) {
    return (
      <>
        <PageHeader eyebrow={back} title="Examen no encontrado" />
        <div className="px-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No existe este examen</EmptyTitle>
              <EmptyDescription>Puede que se haya eliminado.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={back}
        title={exam.data.name}
        description={`${exam.data.units.length} unidades`}
      />
      <ItemGroup className="gap-2 px-4">
        {exam.data.units.map((unit) => {
          const agg = statsByUnit.get(unit.id) ?? emptyAggregate;
          const count = questionsByUnit.get(unit.id) ?? 0;
          return (
            <Item key={unit.id} variant="outline" className="items-start">
              <ItemMedia className="w-6 justify-end self-start pt-0.5 font-mono text-sm text-muted-foreground">
                {unit.number}
              </ItemMedia>
              <ItemContent className="gap-2">
                <ItemTitle className="text-pretty">{unit.name}</ItemTitle>
                <ItemDescription className="flex flex-wrap gap-x-3 gap-y-1">
                  <Link
                    to={`/explore/questions?unit=${unit.id}`}
                    className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                  >
                    <CircleHelpIcon className="size-3.5" />
                    {count} preguntas
                  </Link>
                  <span className="inline-flex items-center gap-1">
                    <HistoryIcon className="size-3.5" />
                    {agg.submissions} respuestas
                    {agg.unanswered > 0 && ` (${agg.unanswered} en blanco)`}
                  </span>
                </ItemDescription>
              </ItemContent>
              <CorrectRatioChart
                correct={agg.correct}
                incorrect={agg.incorrect}
                unanswered={agg.unanswered}
                className="self-center"
              />
            </Item>
          );
        })}
      </ItemGroup>
    </>
  );
}
