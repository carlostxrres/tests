import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Loads sample-tables/{exams,units,questions}.json into Supabase with the
// service role key (bypasses RLS). Upserts by id, so it's safe to re-run
// whenever the question bank changes.

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ExamJson = { id: string; name: string };
type UnitJson = { id: string; exam: string; name: string; number: number };
type QuestionJson = {
  id: string;
  unit: string;
  statement: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

function readJson<T>(file: string): T {
  const filePath = path.resolve(import.meta.dirname, "../sample-tables", file);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

async function upsertInChunks<T extends object>(table: string, rows: T[], chunkSize = 200) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: "id" });
    if (error) {
      throw new Error(`${table} upsert failed: ${error.message}`);
    }
  }
  console.log(`${table}: ${rows.length} rows upserted`);
}

const exams = readJson<ExamJson[]>("exams.json");
const units = readJson<UnitJson[]>("units.json");
const questions = readJson<QuestionJson[]>("questions.json");

await upsertInChunks("exams", exams);
await upsertInChunks(
  "units",
  units.map((u) => ({ id: u.id, exam_id: u.exam, name: u.name, number: u.number })),
);
await upsertInChunks(
  "questions",
  questions.map((q) => ({
    id: q.id,
    unit_id: q.unit,
    statement: q.statement,
    options: q.options,
    correct_option: q.correctOption,
    explanation: q.explanation,
  })),
);
