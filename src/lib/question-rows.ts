import { useMemo } from "react";
import { useExams } from "@/lib/queries/exams";
import { useQuestionIndex, useQuestionStats } from "@/lib/queries/questions";
import type { Result } from "@/lib/types";

export type QuestionRow = {
  id: string;
  statement: string;
  examId: string;
  examName: string;
  unitId: string;
  unitNumber: number;
  unitName: string;
  submissions: number;
  answered: number;
  correct: number;
  unanswered: number;
  ratio: number | null;
  lastSubmissionAt: string | null;
  lastResult: Result | null;
};

// Joins the question index with exams/units and the user's stats into flat
// rows for the questions table.
export function useQuestionRows() {
  const exams = useExams();
  const questions = useQuestionIndex();
  const stats = useQuestionStats();

  const rows = useMemo<QuestionRow[] | undefined>(() => {
    if (!exams.data || !questions.data || !stats.data) return undefined;
    const units = new Map(
      exams.data.flatMap((exam) => exam.units.map((unit) => [unit.id, { exam, unit }] as const)),
    );
    const statsById = new Map(stats.data.map((s) => [s.question_id, s]));
    return questions.data.flatMap((q) => {
      const ref = units.get(q.unit_id);
      if (!ref) return [];
      const s = statsById.get(q.id);
      const answered = s?.answered_count ?? 0;
      const correct = s?.correct_count ?? 0;
      const submissions = s?.submissions_count ?? 0;
      return [
        {
          id: q.id,
          statement: q.statement,
          examId: ref.exam.id,
          examName: ref.exam.name,
          unitId: ref.unit.id,
          unitNumber: ref.unit.number,
          unitName: ref.unit.name,
          submissions,
          answered,
          correct,
          unanswered: submissions - answered,
          ratio: answered > 0 ? correct / answered : null,
          lastSubmissionAt: s?.last_submission_at ?? null,
          lastResult: s?.last_result ?? null,
        },
      ];
    });
  }, [exams.data, questions.data, stats.data]);

  return {
    rows,
    exams: exams.data,
    isPending: exams.isPending || questions.isPending || stats.isPending,
    error: exams.error ?? questions.error ?? stats.error,
  };
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
