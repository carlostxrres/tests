import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { supabase } from "@/lib/supabase";
import type { ExamWithUnits } from "@/lib/types";

async function fetchExams(): Promise<ExamWithUnits[]> {
  const { data, error } = await supabase.from("exams").select("*, units(*)").order("name");
  if (error) throw error;
  return data.map((exam) => ({
    ...exam,
    units: [...exam.units].sort((a, b) => a.number - b.number),
  }));
}

// The question bank is static: never refetch it during a session.
export function useExams() {
  return useQuery({ queryKey: queryKeys.exams, queryFn: fetchExams, staleTime: Infinity });
}

export function useExam(id: string | undefined) {
  const query = useExams();
  return { ...query, data: id ? query.data?.find((e) => e.id === id) : undefined };
}
