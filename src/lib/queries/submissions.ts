import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activityKeys, queryKeys } from "@/lib/queries/keys";
import { supabase } from "@/lib/supabase";
import type { Result, SubmissionView } from "@/lib/types";

export type SubmissionFilters = {
  result?: Result | "";
  from?: string; // ISO date (yyyy-mm-dd)
  to?: string; // ISO date (yyyy-mm-dd), inclusive
  question?: string;
};

async function fetchSubmissions(filters: SubmissionFilters): Promise<SubmissionView[]> {
  let query = supabase
    .from("submissions_view")
    .select("*")
    .order("timestamp", { ascending: false });
  if (filters.result) query = query.eq("result", filters.result);
  if (filters.question) query = query.eq("question_id", filters.question);
  if (filters.from) query = query.gte("timestamp", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("timestamp", `${filters.to}T23:59:59.999`);
  const { data, error } = await query;
  if (error) throw error;
  return data as SubmissionView[];
}

export function useSubmissions(filters: SubmissionFilters) {
  return useQuery({
    queryKey: queryKeys.submissionsList(filters),
    queryFn: () => fetchSubmissions(filters),
  });
}

async function fetchSubmission(id: string): Promise<SubmissionView> {
  const { data, error } = await supabase.from("submissions_view").select("*").eq("id", id).single();
  if (error) throw error;
  return data as SubmissionView;
}

export function useSubmission(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.submission(id ?? ""),
    queryFn: () => fetchSubmission(id as string),
    enabled: Boolean(id),
  });
}

async function fetchTestSubmissions(testId: string): Promise<SubmissionView[]> {
  const { data, error } = await supabase.from("submissions_view").select("*").eq("test_id", testId);
  if (error) throw error;
  return data as SubmissionView[];
}

export function useTestSubmissions(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.testSubmissions(testId ?? ""),
    queryFn: () => fetchTestSubmissions(testId as string),
    enabled: Boolean(testId),
  });
}

export function useInvalidateActivity() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(activityKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

type AnswerInput = {
  testId: string;
  questionId: string;
  choice: number;
  // Existing submission id when the answer is being changed.
  submissionId?: string;
};

// Inserts a submission, or updates `choice` on an existing one. RLS decides
// whether an update is allowed (open test with deferred feedback); a rejected
// update comes back as zero rows, which we surface as an error. The test's
// submission list is updated optimistically so the tapped option checks
// immediately.
export function useAnswerQuestion() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateActivity();
  return useMutation({
    onMutate: async ({ testId, questionId, choice, submissionId }: AnswerInput) => {
      const key = queryKeys.testSubmissions(testId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SubmissionView[]>(key);
      const timestamp = new Date().toISOString();
      queryClient.setQueryData<SubmissionView[]>(key, (old = []) =>
        submissionId
          ? old.map((s) => (s.id === submissionId ? { ...s, choice, timestamp } : s))
          : [
              ...old,
              // Only the fields the runner reads; the refetch fills in the rest.
              {
                id: `optimistic-${questionId}`,
                test_id: testId,
                question_id: questionId,
                choice,
                timestamp,
              } as SubmissionView,
            ],
      );
      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    mutationFn: async ({ testId, questionId, choice, submissionId }: AnswerInput) => {
      if (submissionId) {
        const { data, error } = await supabase
          .from("submissions")
          .update({ choice, timestamp: new Date().toISOString() })
          .eq("id", submissionId)
          .select("id");
        if (error) throw error;
        if (data.length === 0) throw new Error("Esta respuesta ya no se puede cambiar.");
        return;
      }
      const { error } = await supabase
        .from("submissions")
        .insert({ test_id: testId, question_id: questionId, choice });
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}
