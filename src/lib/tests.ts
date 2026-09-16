import type { Test } from "@/lib/types";

// Fisher-Yates shuffle over a copy.
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Picks up to `count` questions without repetition. `weight` lets a future
// "review mode" favour failed or never-seen questions; default is uniform.
export function pickRandomQuestions<T extends { id: string }>(
  candidates: readonly T[],
  count: number,
  weight: (candidate: T) => number = () => 1,
): string[] {
  const pool = candidates.map((c) => ({ id: c.id, weight: Math.max(0, weight(c)) }));
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let index = pool.length - 1;
    if (total > 0) {
      let r = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        r -= pool[i].weight;
        if (r <= 0) {
          index = i;
          break;
        }
      }
    }
    picked.push(pool[index].id);
    pool.splice(index, 1);
  }
  return picked;
}

export const MIN_TEST_QUESTIONS = 5;

// Query params consumed by /tests/new so "Duplicar" can prefill the wizard.
export function buildDuplicateParams(test: Test): URLSearchParams {
  const params = new URLSearchParams();
  for (const unitId of test.unit_ids) params.append("unit", unitId);
  params.set("count", String(test.question_ids.length));
  params.set("instant", test.instant_feedback ? "1" : "0");
  if (test.name) params.set("name", test.name);
  return params;
}

export function isFinished(test: Pick<Test, "end">): boolean {
  return test.end !== null;
}

// Whether results (correct option, explanation) can be revealed for this test.
export function revealsResults(test: Pick<Test, "end" | "instant_feedback">): boolean {
  return test.end !== null || test.instant_feedback;
}
