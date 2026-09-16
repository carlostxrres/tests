import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { supabase } from "@/lib/supabase";
import type { Exam, Question, QuestionStats, Unit } from "@/lib/types";

export type QuestionIndexRow = Pick<Question, "id" | "unit_id" | "statement">;

// Lightweight list of every question (no options/explanation): ~600 rows.
async function fetchQuestionIndex(): Promise<QuestionIndexRow[]> {
  const { data, error } = await supabase.from("questions").select("id, unit_id, statement");
  if (error) throw error;
  return data;
}

export function useQuestionIndex() {
  return useQuery({
    queryKey: queryKeys.questionIndex,
    queryFn: fetchQuestionIndex,
    staleTime: Infinity,
  });
}

export type QuestionDetail = Question & { unit: Unit & { exam: Exam } };

async function fetchQuestion(id: string): Promise<QuestionDetail | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("*, unit:units(*, exam:exams(*))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as QuestionDetail | null;
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.question(id ?? ""),
    queryFn: () => fetchQuestion(id as string),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

async function fetchQuestionStats(): Promise<QuestionStats[]> {
  const { data, error } = await supabase.from("question_stats").select("*");
  if (error) throw error;
  return data as QuestionStats[];
}

// Per-question aggregates of the current user's submissions.
export function useQuestionStats() {
  return useQuery({ queryKey: queryKeys.questionStats, queryFn: fetchQuestionStats });
}

async function fetchQuestionsByIds(ids: string[]): Promise<QuestionDetail[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*, unit:units(*, exam:exams(*))")
    .in("id", ids);
  if (error) throw error;
  const byId = new Map(data.map((q) => [q.id, q as QuestionDetail]));
  // Keep the test's own order.
  return ids.flatMap((id) => byId.get(id) ?? []);
}

// Full questions of a test, in the test's order.
export function useQuestionsByIds(ids: string[] | undefined) {
  return useQuery({
    queryKey: [...queryKeys.questionIndex, "by-ids", ids ?? []],
    queryFn: () => fetchQuestionsByIds(ids as string[]),
    enabled: Boolean(ids && ids.length > 0),
    staleTime: Infinity,
  });
}
