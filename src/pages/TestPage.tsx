import { ArrowLeftIcon, CheckCircleIcon, LayersIcon, TrophyIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CorrectRatioChart } from "@/components/CorrectRatioChart";
import { LinkButton } from "@/components/LinkButton";
import { TestActionsMenu } from "@/components/TestActionsMenu";
import { TestQuestionCard } from "@/components/TestQuestionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/datetime";
import { useExams } from "@/lib/queries/exams";
import { useQuestionsByIds } from "@/lib/queries/questions";
import { useAnswerQuestion, useTestSubmissions } from "@/lib/queries/submissions";
import { type TestWithStats, useFinishTest, useTest } from "@/lib/queries/tests";
import { isFinished, revealsResults } from "@/lib/tests";
import { notify, notifyError } from "@/lib/toast";
import { resultOf, type SubmissionView } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUMMARY_INDEX = -1;

export function TestPage() {
  const { id } = useParams<{ id: string }>();
  const test = useTest(id);

  if (test.isPending) {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!test.data) {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-3xl items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Test no encontrado</EmptyTitle>
            <EmptyDescription>Puede que se haya eliminado.</EmptyDescription>
          </EmptyHeader>
          <LinkButton variant="outline" to="/tests">
            <ArrowLeftIcon data-icon="inline-start" />
            Volver a tests
          </LinkButton>
        </Empty>
      </div>
    );
  }

  return <TestRunner test={test.data} />;
}

function TestRunner({ test }: { test: TestWithStats }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const questions = useQuestionsByIds(test.question_ids);
  const submissions = useTestSubmissions(test.id);
  const exams = useExams();
  const answer = useAnswerQuestion();
  const finish = useFinishTest();

  const finished = isFinished(test);
  const reveal = revealsResults(test);
  const total = test.question_ids.length;

  const submissionByQuestion = useMemo(
    () => new Map((submissions.data ?? []).map((s) => [s.question_id, s])),
    [submissions.data],
  );

  // ---- questionIndex <-> scroll position -----------------------------------
  const scrollerRef = useRef<HTMLDivElement>(null);
  const observedIndexRef = useRef<number | null>(null);
  const paramIndex = Number(searchParams.get("questionIndex") ?? (finished ? SUMMARY_INDEX : 0));

  const setIndexParam = useCallback(
    (index: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("questionIndex", String(index));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Whichever section covers most of the viewport becomes the current index.
  // `finished` is a dependency on purpose: the summary section appears when the
  // test ends and must be observed too.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !questions.data) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-question-index]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const index = Number((best.target as HTMLElement).dataset.questionIndex);
        if (observedIndexRef.current !== index) {
          observedIndexRef.current = index;
          setIndexParam(index);
        }
      },
      { root, threshold: [0.5] },
    );
    for (const s of sections) observer.observe(s);
    return () => observer.disconnect();
  }, [questions.data, finished, setIndexParam]);

  // Navigating via the URL (grid squares, "Ver detalle") scrolls to the section.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the summary section mounts
  useEffect(() => {
    if (!questions.data || observedIndexRef.current === paramIndex) return;
    const target = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-question-index="${paramIndex}"]`,
    );
    if (target) {
      const firstScroll = observedIndexRef.current === null;
      observedIndexRef.current = paramIndex;
      target.scrollIntoView({ block: "start", behavior: firstScroll ? "instant" : "smooth" });
    }
  }, [paramIndex, questions.data, finished]);

  // Scroll the active square into view inside the grid strip.
  const gridRef = useRef<HTMLElement>(null);
  useEffect(() => {
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-square="${paramIndex}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [paramIndex]);

  // ---- actions ---------------------------------------------------------------
  function handleAnswer(questionId: string, choice: number) {
    const existing = submissionByQuestion.get(questionId);
    if (existing?.choice === choice) return;
    answer.mutate(
      { testId: test.id, questionId, choice, submissionId: existing?.id },
      { onError: (error) => notifyError(error, "No se ha guardado la respuesta") },
    );
  }

  async function handleFinish() {
    try {
      await finish.mutateAsync(test.id);
      notify("Test terminado");
      navigate(`/tests/${test.id}?questionIndex=${SUMMARY_INDEX}`, { replace: true });
    } catch (error) {
      notifyError(error, "No se ha podido terminar el test");
    }
  }

  // ---- derived counters ------------------------------------------------------
  const answered = test.stats.answered_count;
  const correct = test.stats.correct_count;
  const unanswered = test.stats.submitted_count - answered;

  const unitsByExam = useMemo(() => {
    const wanted = new Set(test.unit_ids);
    return (exams.data ?? [])
      .map((exam) => ({ exam, units: exam.units.filter((u) => wanted.has(u.id)) }))
      .filter((g) => g.units.length > 0);
  }, [exams.data, test.unit_ids]);

  const isLoading = questions.isPending || submissions.isPending;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* ---- fixed header ---------------------------------------------------- */}
      <header
        className="z-30 shrink-0 border-b bg-background/95 px-4 pb-2 backdrop-blur"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        {/* The border spans the viewport; the contents keep the 3xl column. */}
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          <div className="flex items-center gap-2">
            <LinkButton variant="ghost" size="icon-sm" aria-label="Salir" to="/tests">
              <ArrowLeftIcon />
            </LinkButton>
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 className="truncate font-heading text-base font-semibold">
                {test.name ?? "Test"}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {formatDateTime(test.start)}
                {test.end && ` → ${formatDateTime(test.end)}`}
              </p>
            </div>
            <Drawer>
              <DrawerTrigger render={<Button variant="outline" size="sm" />}>
                <LayersIcon data-icon="inline-start" />
                Unidades
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Unidades del test</DrawerTitle>
                  <DrawerDescription>
                    {test.unit_ids.length} unidades · {total} preguntas
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
                  {unitsByExam.map(({ exam, units }) => (
                    <div key={exam.id} className="flex flex-col gap-2">
                      <h3 className="font-heading text-sm font-semibold">{exam.name}</h3>
                      <ItemGroup className="gap-1">
                        {units.map((unit) => (
                          <Item key={unit.id} size="xs" variant="muted">
                            <ItemMedia className="w-6 justify-end font-mono text-xs text-muted-foreground">
                              {unit.number}
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle className="font-normal">{unit.name}</ItemTitle>
                            </ItemContent>
                          </Item>
                        ))}
                      </ItemGroup>
                    </div>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
            <TestActionsMenu test={test} inRunner />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="font-mono tabular-nums">
              {answered}/{total} respondidas
            </Badge>
            {reveal && (
              <Badge
                variant="outline"
                className="border-success/30 font-mono text-success tabular-nums"
              >
                {correct}/{total} acertadas
              </Badge>
            )}
            {finished && unanswered > 0 && (
              <Badge variant="outline" className="font-mono tabular-nums">
                {unanswered} en blanco
              </Badge>
            )}
            {answer.isPending && <Spinner className="ml-auto size-3.5" />}
          </div>

          {/* Question grid: one square per question, linked to its section. */}
          <nav
            ref={gridRef}
            className="grid max-h-24 grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1 overflow-y-auto py-1"
            aria-label="Preguntas"
          >
            {test.question_ids.map((questionId, index) => {
              const s = submissionByQuestion.get(questionId);
              const q = questions.data?.[index];
              const result = s && reveal && q ? resultOf(s.choice, q.correct_option) : null;
              const active = index === paramIndex;
              return (
                <Link
                  key={questionId}
                  to={`?questionIndex=${index}`}
                  replace
                  data-square={index}
                  aria-label={`Ir a la pregunta ${index + 1}`}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex h-6 items-center justify-center rounded-md border font-mono text-[11px] tabular-nums transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
                    !s && "bg-background text-muted-foreground",
                    s && !result && "border-primary/40 bg-accent text-accent-foreground",
                    result === "correct" && "border-success/40 bg-success/15 text-success",
                    result === "incorrect" &&
                      "border-destructive/40 bg-destructive/10 text-destructive",
                    result === "unanswered" && "bg-muted text-muted-foreground",
                    active && "-translate-y-0.5 scale-110 border-foreground shadow-sm",
                  )}
                >
                  {index + 1}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ---- snap-scrolling questions ---------------------------------------- */}
      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
      >
        {isLoading || !questions.data ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <>
            {finished && (
              <SummaryScreen
                total={total}
                correct={correct}
                incorrect={answered - correct}
                unanswered={unanswered}
                submissions={submissions.data ?? []}
              />
            )}
            {questions.data.map((question, index) => {
              const s = submissionByQuestion.get(question.id);
              const editable = !finished && !(test.instant_feedback && s !== undefined);
              return (
                <TestQuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  total={total}
                  submission={s}
                  reveal={reveal}
                  editable={editable}
                  pending={answer.isPending && answer.variables?.questionId === question.id}
                  onAnswer={(choice) => handleAnswer(question.id, choice)}
                />
              );
            })}
            {!finished && (
              <section
                data-question-index={total}
                className="mx-auto flex min-h-full w-full max-w-3xl snap-start flex-col items-center justify-center gap-6 px-4 py-8 text-center"
              >
                <CheckCircleIcon className="size-12 text-primary" />
                <div className="flex flex-col gap-1">
                  <h2 className="font-heading text-xl font-semibold">¿Terminar el test?</h2>
                  <p className="text-sm text-muted-foreground text-balance">
                    Has respondido {answered} de {total} preguntas.
                    {answered < total && " Las que queden en blanco contarán como no respondidas."}
                  </p>
                </div>
                <Button size="lg" onClick={handleFinish} disabled={finish.isPending}>
                  {finish.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <CheckCircleIcon data-icon="inline-start" />
                  )}
                  Terminar
                </Button>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryScreen({
  total,
  correct,
  incorrect,
  unanswered,
  submissions,
}: {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  submissions: SubmissionView[];
}) {
  const last = submissions.reduce<string | null>(
    (max, s) => (max === null || s.timestamp > max ? s.timestamp : max),
    null,
  );
  return (
    <section
      data-question-index={SUMMARY_INDEX}
      className="mx-auto flex min-h-full w-full max-w-3xl snap-start flex-col items-center justify-center gap-6 px-4 py-8 text-center"
    >
      <TrophyIcon className="size-12 text-primary" />
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold">Test terminado</h2>
        <p className="text-sm text-muted-foreground">
          {correct} de {total} acertadas
          {unanswered > 0 && ` · ${unanswered} en blanco`}
          {last && ` · ${formatDateTime(last)}`}
        </p>
      </div>
      <CorrectRatioChart
        correct={correct}
        incorrect={incorrect}
        unanswered={unanswered}
        size={120}
      />
      <p className="text-xs text-muted-foreground">
        Desliza hacia abajo para revisar cada pregunta.
      </p>
    </section>
  );
}
