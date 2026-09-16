import { BookOpenIcon, ChevronRightIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useExams } from "@/lib/queries/exams";
import { useQuestionIndex } from "@/lib/queries/questions";

export function SyllabusPage() {
  const exams = useExams();
  const questions = useQuestionIndex();

  const questionsByUnit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions.data ?? []) counts.set(q.unit_id, (counts.get(q.unit_id) ?? 0) + 1);
    return counts;
  }, [questions.data]);

  return (
    <>
      <PageHeader title="Temario" description="Exámenes y sus unidades." />
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
                <CardAction>
                  <LinkButton variant="outline" size="sm" to={`/syllabus/${exam.id}`}>
                    Detalle
                    <ChevronRightIcon data-icon="inline-end" />
                  </LinkButton>
                </CardAction>
              </CardHeader>
              <Accordion className="px-6 pb-2" defaultValue={["units"]}>
                <AccordionItem value="units">
                  <AccordionTrigger>Unidades</AccordionTrigger>
                  <AccordionContent>
                    <ItemGroup className="gap-1">
                      {exam.units.map((unit) => (
                        <Item
                          key={unit.id}
                          size="xs"
                          render={<Link to={`/questions?unit=${unit.id}`} />}
                        >
                          <ItemMedia className="w-6 justify-end font-mono text-xs text-muted-foreground">
                            {unit.number}
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="font-normal">{unit.name}</ItemTitle>
                          </ItemContent>
                          <Badge variant="secondary">{questionsByUnit.get(unit.id) ?? 0}</Badge>
                        </Item>
                      ))}
                    </ItemGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })}
      </div>
    </>
  );
}
