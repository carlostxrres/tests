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

async function fetchQuestion(id: string): Promise<QuestionDetail> {
  const { data, error } = await supabase
    .from("questions")
    .select("*, unit:units(*, exam:exams(*))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as QuestionDetail;
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
