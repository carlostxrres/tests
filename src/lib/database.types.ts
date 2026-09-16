// Hand-written to mirror `supabase gen types typescript` output. Regenerate
// with `pnpm db:types` once the project is linked; the shape must stay the same.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      exams: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: { id?: string; name?: string };
        Relationships: [];
      };
      units: {
        Row: { id: string; exam_id: string; name: string; number: number };
        Insert: { id?: string; exam_id: string; name: string; number: number };
        Update: { id?: string; exam_id?: string; name?: string; number?: number };
        Relationships: [
          {
            foreignKeyName: "units_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          unit_id: string;
          statement: string;
          options: string[];
          correct_option: number;
          explanation: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          statement: string;
          options: string[];
          correct_option: number;
          explanation?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          statement?: string;
          options?: string[];
          correct_option?: number;
          explanation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      tests: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          instant_feedback: boolean;
          start: string;
          end: string | null;
          unit_ids: string[];
          question_ids: string[];
        };
        Insert: {
          id?: string;
          user_id?: string;
          name?: string | null;
          instant_feedback?: boolean;
          start?: string;
          end?: string | null;
          unit_ids: string[];
          question_ids: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          instant_feedback?: boolean;
          start?: string;
          end?: string | null;
          unit_ids?: string[];
          question_ids?: string[];
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          test_id: string | null;
          question_id: string;
          choice: number | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          test_id?: string | null;
          question_id: string;
          choice?: number | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_id?: string | null;
          question_id?: string;
          choice?: number | null;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      submissions_view: {
        Row: {
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
          result: string;
        };
        Relationships: [];
      };
      question_stats: {
        Row: {
          question_id: string;
          unit_id: string;
          exam_id: string;
          submissions_count: number;
          answered_count: number;
          correct_count: number;
          last_submission_at: string | null;
          last_result: string | null;
        };
        Relationships: [];
      };
      test_stats: {
        Row: {
          test_id: string;
          total_questions: number;
          submitted_count: number;
          answered_count: number;
          correct_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      finish_test: { Args: { p_test_id: string }; Returns: undefined };
      restart_test: { Args: { p_test_id: string }; Returns: undefined };
      reset_user_data: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
