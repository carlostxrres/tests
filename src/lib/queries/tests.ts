import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { useInvalidateActivity } from "@/lib/queries/submissions";
import { supabase } from "@/lib/supabase";
import type { Test, TestStats } from "@/lib/types";

export type TestWithStats = Test & { stats: TestStats };

const emptyStats = (test: Test): TestStats => ({
  test_id: test.id,
  total_questions: test.question_ids.length,
  submitted_count: 0,
  answered_count: 0,
  correct_count: 0,
});

// tests + test_stats are fetched separately and merged: PostgREST can't embed
// an aggregate view reliably.
async function fetchTests(): Promise<TestWithStats[]> {
  const [tests, stats] = await Promise.all([
    supabase.from("tests").select("*").order("start", { ascending: false }),
    supabase.from("test_stats").select("*"),
  ]);
  if (tests.error) throw tests.error;
  if (stats.error) throw stats.error;
  const statsById = new Map(stats.data.map((s) => [s.test_id, s as TestStats]));
  return tests.data.map((test) => ({ ...test, stats: statsById.get(test.id) ?? emptyStats(test) }));
}

export function useTests() {
  return useQuery({ queryKey: queryKeys.tests, queryFn: fetchTests });
}

async function fetchTest(id: string): Promise<TestWithStats> {
  const [test, stats] = await Promise.all([
    supabase.from("tests").select("*").eq("id", id).single(),
    supabase.from("test_stats").select("*").eq("test_id", id).maybeSingle(),
  ]);
  if (test.error) throw test.error;
  if (stats.error) throw stats.error;
  return { ...test.data, stats: (stats.data as TestStats | null) ?? emptyStats(test.data) };
}

export function useTest(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.test(id ?? ""),
    queryFn: () => fetchTest(id as string),
    enabled: Boolean(id),
  });
}

export type NewTestInput = {
  name: string | null;
  instantFeedback: boolean;
  unitIds: string[];
  questionIds: string[];
};

export function useCreateTest() {
  const invalidate = useInvalidateActivity();
  return useMutation({
    mutationFn: async (input: NewTestInput): Promise<Test> => {
      const { data, error } = await supabase
        .from("tests")
        .insert({
          name: input.name,
          instant_feedback: input.instantFeedback,
          unit_ids: input.unitIds,
          question_ids: input.questionIds,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: () => invalidate(),
  });
}

export function useFinishTest() {
  const invalidate = useInvalidateActivity();
  return useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase.rpc("finish_test", { p_test_id: testId });
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

export function useRestartTest() {
  const invalidate = useInvalidateActivity();
  return useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase.rpc("restart_test", { p_test_id: testId });
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

export function useDeleteTest() {
  const invalidate = useInvalidateActivity();
  return useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase.from("tests").delete().eq("id", testId);
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

export function useResetUserData() {
  const invalidate = useInvalidateActivity();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("reset_user_data");
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}
