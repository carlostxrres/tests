import type { Tables } from "@/lib/database.types";

export type Exam = Tables<"exams">;
export type Unit = Tables<"units">;
export type Question = Tables<"questions">;
export type Test = Tables<"tests">;
export type Submission = Tables<"submissions">;

export type Result = "correct" | "incorrect" | "unanswered";

// View rows are declared by hand: `supabase gen types` marks every view column
// as nullable, but these views only join non-null columns (see the migration).
export type SubmissionView = {
  id: string;
  user_id: string;
  test_id: string | null;
  question_id: string;
  choice: number | null;
  timestamp: string;
  statement: string;
  correct_option: number;
  unit_id: string;
  unit_number: number;
  unit_name: string;
  exam_id: string;
  exam_name: string;
  result: Result;
};

export type QuestionStats = {
  question_id: string;
  unit_id: string;
  exam_id: string;
  submissions_count: number;
  answered_count: number;
  correct_count: number;
  last_submission_at: string | null;
  last_result: Result | null;
};

export type TestStats = {
  test_id: string;
  total_questions: number;
  submitted_count: number;
  answered_count: number;
  correct_count: number;
};

export type ExamWithUnits = Exam & { units: Unit[] };

export function resultOf(choice: number | null, correctOption: number): Result {
  if (choice === null) return "unanswered";
  return choice === correctOption ? "correct" : "incorrect";
}
