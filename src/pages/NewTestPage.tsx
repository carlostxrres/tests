import { useForm, useStore } from "@tanstack/react-form";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PlayIcon, ZapIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useExams } from "@/lib/queries/exams";
import { useQuestionIndex } from "@/lib/queries/questions";
import { useCreateTest } from "@/lib/queries/tests";
import { MIN_TEST_QUESTIONS, pickRandomQuestions } from "@/lib/tests";
import { notifyError } from "@/lib/toast";
import type { ExamWithUnits } from "@/lib/types";
import { cn } from "@/lib/utils";

type FormValues = {
  examIds: string[];
  unitIds: string[];
  count: number;
  instantFeedback: boolean;
  name: string;
};

const steps = [
  { key: "exams", title: "Exámenes", description: "Elige al menos un examen." },
  { key: "units", title: "Unidades", description: "Elige las unidades que quieres practicar." },
  { key: "count", title: "Preguntas", description: "Cuántas preguntas tendrá el test." },
  { key: "options", title: "Opciones", description: "Corrección y nombre." },
] as const;

// Fields validated before leaving each step.
const stepFields: (keyof FormValues)[][] = [["examIds"], ["unitIds"], ["count"], ["name"]];

const DEFAULT_COUNT = 20;

// Reads the prefill that "Duplicar" puts in the URL.
function readPrefill(params: URLSearchParams, exams: ExamWithUnits[] | undefined) {
  const unitIds = params.getAll("unit");
  const examIds = exams
    ? exams.filter((e) => e.units.some((u) => unitIds.includes(u.id))).map((e) => e.id)
    : [];
  const count = Number(params.get("count"));
  return {
    examIds,
    unitIds,
    count: Number.isFinite(count) && count > 0 ? count : DEFAULT_COUNT,
    instantFeedback: params.get("instant") === "1",
    name: params.get("name") ?? "",
  } satisfies FormValues;
}

export function NewTestPage() {
  const exams = useExams();
  const questions = useQuestionIndex();

  if (exams.isPending || questions.isPending) {
    return (
      <>
        <PageHeader title="Nuevo test" />
        <div className="flex flex-col gap-2 px-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </>
    );
  }

  return (
    <NewTestWizard exams={exams.data ?? []} questionsByUnit={countByUnit(questions.data ?? [])} />
  );
}

function countByUnit(questions: { unit_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const q of questions) counts.set(q.unit_id, (counts.get(q.unit_id) ?? 0) + 1);
  return counts;
}

function NewTestWizard({
  exams,
  questionsByUnit,
}: {
  exams: ExamWithUnits[];
  questionsByUnit: Map<string, number>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questions = useQuestionIndex();
  const createTest = useCreateTest();
  const [step, setStep] = useState(0);
  const [prefill] = useState(() => readPrefill(searchParams, exams));

  const form = useForm({
    defaultValues: prefill,
    onSubmit: async ({ value }) => {
      const candidates = (questions.data ?? []).filter((q) => value.unitIds.includes(q.unit_id));
      const questionIds = pickRandomQuestions(candidates, value.count);
      try {
        const test = await createTest.mutateAsync({
          name: value.name.trim() || null,
          instantFeedback: value.instantFeedback,
          unitIds: value.unitIds,
          questionIds,
        });
        navigate(`/tests/${test.id}`, { replace: true });
      } catch (error) {
        notifyError(error, "No se ha podido crear el test");
      }
    },
  });

  const examIds = useStore(form.store, (s) => s.values.examIds);
  const unitIds = useStore(form.store, (s) => s.values.unitIds);
  const count = useStore(form.store, (s) => s.values.count);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  const selectedExams = useMemo(
    () => exams.filter((e) => examIds.includes(e.id)),
    [exams, examIds],
  );
  const available = useMemo(
    () => unitIds.reduce((sum, id) => sum + (questionsByUnit.get(id) ?? 0), 0),
    [unitIds, questionsByUnit],
  );
  const maxCount = Math.max(available, MIN_TEST_QUESTIONS);

  async function next() {
    const errors = await Promise.all(
      stepFields[step].map((field) => form.validateField(field, "submit")),
    );
    if (errors.some((e) => e.length > 0)) return;
    if (step === 1) {
      // Clamp the count to what the chosen units can offer.
      form.setFieldValue(
        "count",
        Math.min(Math.max(form.getFieldValue("count"), MIN_TEST_QUESTIONS), maxCount),
      );
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function toggleIn(list: string[], id: string, checked: boolean) {
    return checked ? [...new Set([...list, id])] : list.filter((x) => x !== id);
  }

  const isLast = step === steps.length - 1;

  return (
    <>
      <PageHeader
        eyebrow={
          <LinkButton variant="ghost" size="sm" className="-ml-2 w-fit" to="/tests">
            <ArrowLeftIcon data-icon="inline-start" />
            Tests
          </LinkButton>
        }
        title="Nuevo test"
        description={
          <span>
            Paso {step + 1} de {steps.length} · {steps[step].title}
          </span>
        }
      />
      <div className="flex flex-col gap-6 px-4">
        <Progress value={((step + 1) / steps.length) * 100} aria-label="Progreso del formulario" />

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) form.handleSubmit();
            else next();
          }}
        >
          {step === 0 && (
            <form.Field
              name="examIds"
              validators={{
                onSubmit: ({ value }) =>
                  value.length === 0 ? "Elige al menos un examen." : undefined,
              }}
            >
              {(field) => (
                <FieldSet>
                  <FieldLegend>{steps[0].description}</FieldLegend>
                  <ItemGroup className="gap-2">
                    {exams.map((exam) => {
                      const checked = field.state.value.includes(exam.id);
                      const total = exam.units.reduce(
                        (s, u) => s + (questionsByUnit.get(u.id) ?? 0),
                        0,
                      );
                      return (
                        <Item
                          key={exam.id}
                          variant="outline"
                          // biome-ignore lint/a11y/noLabelWithoutControl: the Checkbox is rendered inside via ItemMedia
                          render={<label />}
                          className={cn(
                            "cursor-pointer",
                            checked && "border-primary/40 bg-accent/40",
                          )}
                        >
                          <ItemMedia>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) => {
                                field.handleChange(toggleIn(field.state.value, exam.id, next));
                                // Dropping an exam also drops its units.
                                if (!next) {
                                  const ids = new Set(exam.units.map((u) => u.id));
                                  form.setFieldValue("unitIds", (prev) =>
                                    prev.filter((id) => !ids.has(id)),
                                  );
                                }
                              }}
                            />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{exam.name}</ItemTitle>
                            <ItemDescription>
                              {exam.units.length} unidades · {total} preguntas
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      );
                    })}
                  </ItemGroup>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                  )}
                </FieldSet>
              )}
            </form.Field>
          )}

          {step === 1 && (
            <form.Field
              name="unitIds"
              validators={{
                onSubmit: ({ value }) =>
                  value.length === 0 ? "Elige al menos una unidad." : undefined,
              }}
            >
              {(field) => (
                <FieldGroup>
                  {selectedExams.map((exam) => {
                    const ids = exam.units.map((u) => u.id);
                    const allSelected = ids.every((id) => field.state.value.includes(id));
                    return (
                      <FieldSet key={exam.id}>
                        <div className="flex items-center justify-between gap-2">
                          <FieldLegend variant="label">{exam.name}</FieldLegend>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              field.handleChange(
                                allSelected
                                  ? field.state.value.filter((id) => !ids.includes(id))
                                  : [...new Set([...field.state.value, ...ids])],
                              )
                            }
                          >
                            {allSelected ? "Quitar todas" : "Todas"}
                          </Button>
                        </div>
                        <ItemGroup className="gap-1.5">
                          {exam.units.map((unit) => {
                            const checked = field.state.value.includes(unit.id);
                            return (
                              <Item
                                key={unit.id}
                                variant="outline"
                                size="sm"
                                // biome-ignore lint/a11y/noLabelWithoutControl: the Checkbox is rendered inside via ItemMedia
                                render={<label />}
                                className={cn(
                                  "cursor-pointer",
                                  checked && "border-primary/40 bg-accent/40",
                                )}
                              >
                                <ItemMedia>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(next) =>
                                      field.handleChange(toggleIn(field.state.value, unit.id, next))
                                    }
                                  />
                                </ItemMedia>
                                <ItemContent>
                                  <ItemTitle className="font-normal">
                                    <span className="font-mono text-muted-foreground">
                                      {unit.number}.
                                    </span>{" "}
                                    {unit.name}
                                  </ItemTitle>
                                </ItemContent>
                                <ItemActions>
                                  <Badge variant="secondary">
                                    {questionsByUnit.get(unit.id) ?? 0}
                                  </Badge>
                                </ItemActions>
                              </Item>
                            );
                          })}
                        </ItemGroup>
                      </FieldSet>
                    );
                  })}
                  <FieldDescription>
                    {unitIds.length} unidades · {available} preguntas disponibles
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                  )}
                </FieldGroup>
              )}
            </form.Field>
          )}

          {step === 2 && (
            <form.Field
              name="count"
              validators={{
                onSubmit: ({ value }) =>
                  available < MIN_TEST_QUESTIONS
                    ? `Las unidades elegidas solo tienen ${available} preguntas; hacen falta al menos ${MIN_TEST_QUESTIONS}.`
                    : value < MIN_TEST_QUESTIONS || value > available
                      ? `Entre ${MIN_TEST_QUESTIONS} y ${available} preguntas.`
                      : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="count">Número máximo de preguntas</FieldLabel>
                  <div className="flex items-center gap-4 py-2">
                    <Slider
                      id="count"
                      min={MIN_TEST_QUESTIONS}
                      max={maxCount}
                      step={1}
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(Array.isArray(value) ? value[0] : value)
                      }
                      aria-label="Número de preguntas"
                      className="flex-1"
                    />
                    <output className="w-12 text-right font-mono text-lg tabular-nums">
                      {count}
                    </output>
                  </div>
                  <FieldDescription>
                    Entre {MIN_TEST_QUESTIONS} y {available} preguntas, elegidas al azar entre las{" "}
                    {unitIds.length} unidades seleccionadas.
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>
          )}

          {step === 3 && (
            <FieldGroup>
              <form.Field name="instantFeedback">
                {(field) => (
                  <Field orientation="horizontal">
                    <div className="flex flex-1 flex-col gap-1">
                      <FieldLabel htmlFor="instant" className="flex items-center gap-1.5">
                        <ZapIcon className="size-4" />
                        Corrección instantánea
                      </FieldLabel>
                      <FieldDescription>
                        Ver si has acertado al responder cada pregunta. Si no, los resultados se
                        muestran al terminar el test.
                      </FieldDescription>
                    </div>
                    <Switch
                      id="instant"
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field
                name="name"
                validators={{
                  onSubmit: ({ value }) =>
                    value.length > 80 ? "Máximo 80 caracteres." : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                    <FieldLabel htmlFor="name">Nombre (opcional)</FieldLabel>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Ej. Repaso unidades 1-3"
                      maxLength={80}
                      aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                    )}
                  </Field>
                )}
              </form.Field>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {count} preguntas de {unitIds.length} unidades (
                {selectedExams.map((e) => e.name).join(", ")}).
              </div>
            </FieldGroup>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={step === 0 || isSubmitting}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Atrás
            </Button>
            {isLast ? (
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
                Empezar test
              </Button>
            ) : (
              <Button type="submit" size="lg">
                {step === 2 ? <CheckIcon data-icon="inline-start" /> : null}
                Siguiente
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
