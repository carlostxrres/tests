import { CheckIcon } from "lucide-react";
import { ExamUnitBreadcrumb } from "@/components/ExamUnitBreadcrumb";
import { ResultBadge } from "@/components/ResultBadge";
import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/datetime";
import type { QuestionDetail } from "@/lib/queries/questions";
import { resultOf, type SubmissionView } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  question: QuestionDetail;
  index: number;
  total: number;
  submission: SubmissionView | undefined;
  // Whether the correct option and explanation are shown once answered.
  reveal: boolean;
  // Whether the user can (still) pick or change an option.
  editable: boolean;
  pending: boolean;
  onAnswer: (choice: number) => void;
};

// One full-height, snap-aligned question in the test runner. A single-item
// Questionnaire renders the options; choices are fully controlled so a change
// goes straight to Supabase.
export function TestQuestionCard({
  question,
  index,
  total,
  submission,
  reveal,
  editable,
  pending,
  onAnswer,
}: Props) {
  const choice = submission?.choice ?? null;
  const answered = submission !== undefined;
  const showResult = reveal && answered;
  const result = showResult ? resultOf(choice, question.correct_option) : null;

  return (
    <section
      id={`question-${index}`}
      data-question-index={index}
      className="flex min-h-full snap-start flex-col gap-4 px-4 pt-4 pb-8"
      aria-label={`Pregunta ${index + 1} de ${total}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">
          Pregunta {index + 1} de {total}
        </span>
        <span className="flex items-center gap-2">
          {pending && <Spinner className="size-3.5" />}
          {answered && submission && (
            <time dateTime={submission.timestamp}>{formatDateTime(submission.timestamp)}</time>
          )}
          {result && <ResultBadge result={result} />}
        </span>
      </div>

      <Questionnaire
        items={[
          {
            name: question.id,
            choices: question.options.map((_, i) => ({ value: String(i) })),
          },
        ]}
        onSubmit={(e) => e.preventDefault()}
        className="gap-3"
      >
        <QuestionnaireItem name={question.id}>
          <QuestionnaireTitle className="text-lg leading-snug font-medium">
            {question.statement}
          </QuestionnaireTitle>
          <QuestionnaireChoices>
            {question.options.map((option, i) => {
              const isCorrect = showResult && i === question.correct_option;
              const isWrongChoice = showResult && choice === i && i !== question.correct_option;
              return (
                <QuestionnaireChoice
                  key={option}
                  value={String(i)}
                  checked={choice === i}
                  onChange={() => onAnswer(i)}
                  disabled={!editable}
                  className={cn(
                    "min-h-12 text-base leading-snug data-disabled:opacity-100",
                    isCorrect && "border-success/50 bg-success/10 data-checked:border-success/60",
                    isWrongChoice &&
                      "border-destructive/50 bg-destructive/10 data-checked:border-destructive/60",
                  )}
                >
                  {option}
                  {isCorrect && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                      <CheckIcon className="size-3.5" />
                      Respuesta correcta
                    </span>
                  )}
                </QuestionnaireChoice>
              );
            })}
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>

      {showResult && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <h3 className="font-heading text-sm font-semibold text-muted-foreground">Explicación</h3>
          <div className="typeset typeset-docs max-w-[37em]">
            <p>{question.explanation}</p>
          </div>
          <Separator />
          <ExamUnitBreadcrumb
            examName={question.unit.exam.name}
            unitId={question.unit.id}
            unitNumber={question.unit.number}
            unitName={question.unit.name}
          />
        </div>
      )}
    </section>
  );
}
