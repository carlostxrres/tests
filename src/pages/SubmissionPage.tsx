import { ArrowLeftIcon, ClipboardListIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ExamUnitBreadcrumb } from "@/components/ExamUnitBreadcrumb";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { QuestionOptions } from "@/components/QuestionOptions";
import { ResultBadge } from "@/components/ResultBadge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/datetime";
import { useQuestion } from "@/lib/queries/questions";
import { useSubmission } from "@/lib/queries/submissions";

export function SubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const submission = useSubmission(id);
  const question = useQuestion(submission.data?.question_id);

  const back = (
    <LinkButton variant="ghost" size="sm" className="-ml-2 w-fit" to="/explore/submissions">
      <ArrowLeftIcon data-icon="inline-start" />
      Respuestas
    </LinkButton>
  );

  if (submission.isPending || (submission.data && question.isPending)) {
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

  if (!submission.data || !question.data) {
    return (
      <>
        <PageHeader eyebrow={back} title="Respuesta no encontrada" />
        <div className="px-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No existe esta respuesta</EmptyTitle>
              <EmptyDescription>Puede que se haya eliminado.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </>
    );
  }

  const s = submission.data;
  const q = question.data;

  return (
    <>
      <PageHeader
        eyebrow={
          <div className="flex flex-col gap-2">
            {back}
            <ExamUnitBreadcrumb
              examName={s.exam_name}
              unitId={s.unit_id}
              unitNumber={s.unit_number}
              unitName={s.unit_name}
            />
          </div>
        }
        title={<span className="text-xl leading-snug font-medium">{s.statement}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ResultBadge result={s.result} />
            <span>{formatDateTime(s.timestamp)}</span>
            {s.test_id && (
              <Link
                to={`/tests/${s.test_id}`}
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                <ClipboardListIcon className="size-3.5" />
                Ver test
              </Link>
            )}
          </span>
        }
      />
      <div className="flex flex-col gap-6 px-4">
        <QuestionOptions options={q.options} correctOption={q.correct_option} choice={s.choice} />
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Explicación</h2>
          <div className="typeset typeset-docs max-w-[37em]">
            <p>{q.explanation}</p>
          </div>
        </section>
        <LinkButton variant="outline" className="w-fit" to={`/explore/questions/${q.id}`}>
          Ver pregunta y su historial
        </LinkButton>
      </div>
    </>
  );
}
