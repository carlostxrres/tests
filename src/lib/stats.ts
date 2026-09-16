import type { QuestionStats } from "@/lib/types";

export type Aggregate = {
  submissions: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  lastSubmissionAt: string | null;
};

export const emptyAggregate: Aggregate = {
  submissions: 0,
  answered: 0,
  correct: 0,
  incorrect: 0,
  unanswered: 0,
  lastSubmissionAt: null,
};

function add(target: Aggregate, s: QuestionStats): Aggregate {
  const answered = target.answered + s.answered_count;
  const correct = target.correct + s.correct_count;
  const submissions = target.submissions + s.submissions_count;
  const lastSubmissionAt =
    s.last_submission_at &&
    (!target.lastSubmissionAt || s.last_submission_at > target.lastSubmissionAt)
      ? s.last_submission_at
      : target.lastSubmissionAt;
  return {
    submissions,
    answered,
    correct,
    incorrect: answered - correct,
    unanswered: submissions - answered,
    lastSubmissionAt,
  };
}

// Groups question_stats rows by an arbitrary key (unit_id, exam_id…).
export function aggregateBy(
  stats: readonly QuestionStats[] | undefined,
  keyOf: (s: QuestionStats) => string,
): Map<string, Aggregate> {
  const map = new Map<string, Aggregate>();
  for (const s of stats ?? []) {
    const key = keyOf(s);
    map.set(key, add(map.get(key) ?? emptyAggregate, s));
  }
  return map;
}

export function ratioOf(a: Pick<Aggregate, "answered" | "correct">): number | null {
  return a.answered > 0 ? a.correct / a.answered : null;
}

export function formatRatio(ratio: number | null): string {
  return ratio === null ? "–" : `${Math.round(ratio * 100)}%`;
}
