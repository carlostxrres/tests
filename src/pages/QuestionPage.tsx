import { ArrowLeftIcon, HistoryIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CorrectRatioChart } from "@/components/CorrectRatioChart";
import { ExamUnitBreadcrumb } from "@/components/ExamUnitBreadcrumb";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { QuestionOptions } from "@/components/QuestionOptions";
import { ResultBadge, resultLabels } from "@/components/ResultBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/datetime";
import { useQuestion } from "@/lib/queries/questions";
import { useSubmissions } from "@/lib/queries/submissions";
import { cn } from "@/lib/utils";

export function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const question = useQuestion(id);
  const submissions = useSubmissions({ question: id });

  const back = (
    <LinkButton variant="ghost" size="sm" className="-ml-2 w-fit" to="/explore/questions">
      <ArrowLeftIcon data-icon="inline-start" />
      Preguntas
    </LinkButton>
  );

  if (question.isPending) {
    return (
      <>
        <PageHeader eyebrow={back} title={<Skeleton className="h-7 w-64" />} />
        <div className="flex flex-col gap-2 px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </>
    );
  }

  if (!question.data) {
    return (
      <>
        <PageHeader eyebrow={back} title="Pregunta no encontrada" />
        <div className="px-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No existe esta pregunta</EmptyTitle>
              <EmptyDescription>Puede que se haya eliminado.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </>
    );
  }

  const q = question.data;
  const history = [...(submissions.data ?? [])].reverse(); // chronological
  const correct = history.filter((s) => s.result === "correct").length;
  const incorrect = history.filter((s) => s.result === "incorrect").length;
  const unanswered = history.filter((s) => s.result === "unanswered").length;

  return (
    <>
      <PageHeader
        eyebrow={
          <div className="flex flex-col gap-2">
            {back}
            <ExamUnitBreadcrumb
              examName={q.unit.exam.name}
              unitId={q.unit.id}
              unitNumber={q.unit.number}
              unitName={q.unit.name}
            />
          </div>
        }
        title={<span className="text-xl leading-snug font-medium">{q.statement}</span>}
      />
      <div className="flex flex-col gap-6 px-4">
        <QuestionOptions options={q.options} correctOption={q.correct_option} />

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Explicación</h2>
          <div className="typeset typeset-docs max-w-[37em]">
            <p>{q.explanation}</p>
          </div>
        </section>

        <Separator />

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="size-4" />
              Tus respuestas
            </CardTitle>
            <CardDescription>
              {history.length === 0 ? (
                "Todavía no has respondido esta pregunta."
              ) : (
                <Link
                  to={`/explore/submissions?question=${q.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {history.length} {history.length === 1 ? "respuesta" : "respuestas"}
                  {unanswered > 0 && ` (${unanswered} en blanco)`}
                </Link>
              )}
            </CardDescription>
          </CardHeader>
          {history.length > 0 && (
            <CardContent className="flex items-center gap-4">
              <CorrectRatioChart
                correct={correct}
                incorrect={incorrect}
                unanswered={unanswered}
                size={64}
              />
              {/* One chip per attempt, oldest → newest, so streaks are visible. */}
              <ol className="flex flex-wrap gap-1.5" aria-label="Historial de resultados">
                {history.map((s) => (
                  <li key={s.id} className={cn("contents")}>
                    <Link
                      to={`/explore/submissions/${s.id}`}
                      title={`${resultLabels[s.result]} · ${formatDateTime(s.timestamp)}`}
                    >
                      <ResultBadge result={s.result} iconOnly />
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
