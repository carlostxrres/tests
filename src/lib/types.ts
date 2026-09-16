import type { Tables, Views } from "@/lib/database.types";

export type Exam = Tables<"exams">;
export type Unit = Tables<"units">;
export type Question = Tables<"questions">;
export type Test = Tables<"tests">;
export type Submission = Tables<"submissions">;

export type SubmissionView = Omit<Views<"submissions_view">, "result"> & { result: Result };
export type QuestionStats = Omit<Views<"question_stats">, "last_result"> & {
  last_result: Result | null;
};
export type TestStats = Views<"test_stats">;

export type Result = "correct" | "incorrect" | "unanswered";

export type ExamWithUnits = Exam & { units: Unit[] };

export function resultOf(choice: number | null, correctOption: number): Result {
  if (choice === null) return "unanswered";
  return choice === correctOption ? "correct" : "incorrect";
}
