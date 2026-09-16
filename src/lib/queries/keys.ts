// Central place for query keys so mutations can invalidate consistently.
export const queryKeys = {
  exams: ["exams"] as const,
  questionIndex: ["questions", "index"] as const,
  question: (id: string) => ["questions", "detail", id] as const,
  questionStats: ["question_stats"] as const,
  tests: ["tests"] as const,
  test: (id: string) => ["tests", "detail", id] as const,
  testStats: ["test_stats"] as const,
  submissions: ["submissions"] as const,
  submissionsList: (filters: unknown) => ["submissions", "list", filters] as const,
  submission: (id: string) => ["submissions", "detail", id] as const,
  testSubmissions: (testId: string) => ["submissions", "test", testId] as const,
};

// Everything derived from the user's activity.
export const activityKeys = [
  queryKeys.questionStats,
  queryKeys.tests,
  queryKeys.testStats,
  queryKeys.submissions,
];
