import { BookOpenIcon, CircleHelpIcon, HistoryIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CorrectRatioChart } from "@/components/CorrectRatioChart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useExams } from "@/lib/queries/exams";
import { useQuestionIndex, useQuestionStats } from "@/lib/queries/questions";
import { aggregateBy, emptyAggregate } from "@/lib/stats";

export function SyllabusPage() {
  const exams = useExams();
  const questions = useQuestionIndex();
  const stats = useQuestionStats();

  const questionsByUnit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions.data ?? []) counts.set(q.unit_id, (counts.get(q.unit_id) ?? 0) + 1);
    return counts;
  }, [questions.data]);

  const statsByUnit = useMemo(() => aggregateBy(stats.data, (s) => s.unit_id), [stats.data]);

  return (
    <div className="flex flex-col gap-4 px-4">
      {exams.isPending && (
        <>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </>
      )}
      {exams.data?.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>Sin exámenes</EmptyTitle>
            <EmptyDescription>Todavía no hay ningún examen cargado.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {exams.data?.map((exam) => {
        const total = exam.units.reduce((sum, u) => sum + (questionsByUnit.get(u.id) ?? 0), 0);
        return (
          <Card key={exam.id}>
            <CardHeader>
              <CardTitle className="font-heading text-lg">{exam.name}</CardTitle>
              <CardDescription>
                {exam.units.length} unidades · {total} preguntas
              </CardDescription>
            </CardHeader>
            <Accordion className="px-6 pb-2" defaultValue={["units"]}>
              <AccordionItem value="units">
                <AccordionTrigger>Unidades</AccordionTrigger>
                <AccordionContent>
                  <ItemGroup className="gap-2">
                    {exam.units.map((unit) => {
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
                              <Link
                                to={`/explore/submissions?unit=${unit.id}`}
                                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                              >
                                <HistoryIcon className="size-3.5" />
                                {agg.submissions} respuestas
                                {agg.unanswered > 0 && ` (${agg.unanswered} en blanco)`}
                              </Link>
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        );
      })}
    </div>
  );
}
