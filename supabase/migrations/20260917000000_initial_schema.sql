-- =============================================================================
-- Schema: exams / units / questions (global, read-only) + tests / submissions
-- (per user). Submissions are immutable records: they are never deleted except
-- through reset_user_data(), and only editable while their test is open and
-- has deferred feedback.
-- =============================================================================

-- ---------------------------------------------------------------- tables ----

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  name text not null,
  number integer not null
);
create index units_exam_id_idx on public.units (exam_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  statement text not null,
  options text[] not null,
  correct_option smallint not null,
  explanation text not null default '',
  constraint questions_correct_option_in_range
    check (correct_option >= 0 and correct_option < cardinality(options))
);
create index questions_unit_id_idx on public.questions (unit_id);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text,
  instant_feedback boolean not null default false,
  "start" timestamptz not null default now(),
  "end" timestamptz,
  -- Both arrays keep the order chosen at creation time; question_ids is the
  -- order in which questions are presented.
  unit_ids uuid[] not null,
  question_ids uuid[] not null,
  constraint tests_end_after_start check ("end" is null or "end" >= "start"),
  constraint tests_has_questions check (cardinality(question_ids) > 0)
);
create index tests_user_id_idx on public.tests (user_id);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Nullable: "Reempezar" and deleting a test unlink submissions instead of
  -- deleting them.
  test_id uuid references public.tests (id) on delete set null,
  question_id uuid not null references public.questions (id) on delete cascade,
  -- null = the user did not answer before the test was finished.
  choice smallint,
  "timestamp" timestamptz not null default now(),
  -- One submission per question per test (nulls are distinct, so unlinked
  -- submissions don't collide).
  constraint submissions_test_question_unique unique (test_id, question_id)
);
create index submissions_user_question_idx on public.submissions (user_id, question_id);
create index submissions_test_id_idx on public.submissions (test_id);
create index submissions_user_timestamp_idx on public.submissions (user_id, "timestamp");

-- ------------------------------------------------------------------- RLS ----

alter table public.exams enable row level security;
alter table public.units enable row level security;
alter table public.questions enable row level security;
alter table public.tests enable row level security;
alter table public.submissions enable row level security;

create policy "exams are readable by authenticated users"
  on public.exams for select to authenticated using (true);
create policy "units are readable by authenticated users"
  on public.units for select to authenticated using (true);
create policy "questions are readable by authenticated users"
  on public.questions for select to authenticated using (true);

create policy "users manage their own tests"
  on public.tests for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users read their own submissions"
  on public.submissions for select to authenticated
  using (user_id = auth.uid());

-- A submission can only be inserted for an open test of the same user, and for
-- a question that belongs to that test.
create policy "users answer questions of their open tests"
  on public.submissions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tests t
      where t.id = submissions.test_id
        and t.user_id = auth.uid()
        and t."end" is null
        and submissions.question_id = any (t.question_ids)
    )
  );

-- Answers can be changed only while the test is open and feedback is deferred.
create policy "users change answers of open deferred-feedback tests"
  on public.submissions for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.tests t
      where t.id = submissions.test_id
        and t.user_id = auth.uid()
        and t."end" is null
        and not t.instant_feedback
    )
  )
  with check (user_id = auth.uid());

-- Column-level grant: even when the update policy passes, only `choice` and
-- `timestamp` can change (never test_id / question_id / user_id).
revoke update on public.submissions from authenticated;
grant update (choice, "timestamp") on public.submissions to authenticated;

-- No delete policy on submissions on purpose: see reset_user_data().

-- ----------------------------------------------------------------- views ----

-- Submission with everything the UI needs to display it, plus the result.
create view public.submissions_view
  with (security_invoker = true) as
select
  s.id,
  s.user_id,
  s.test_id,
  s.question_id,
  s.choice,
  s."timestamp",
  q.statement,
  q.correct_option,
  u.id as unit_id,
  u.number as unit_number,
  u.name as unit_name,
  e.id as exam_id,
  e.name as exam_name,
  case
    when s.choice is null then 'unanswered'
    when s.choice = q.correct_option then 'correct'
    else 'incorrect'
  end as result
from public.submissions s
join public.questions q on q.id = s.question_id
join public.units u on u.id = q.unit_id
join public.exams e on e.id = u.exam_id;

-- Per-question aggregates for the current user (RLS on submissions applies).
create view public.question_stats
  with (security_invoker = true) as
select
  q.id as question_id,
  q.unit_id,
  u.exam_id,
  count(s.id)::integer as submissions_count,
  (count(s.id) filter (where s.choice is not null))::integer as answered_count,
  (count(s.id) filter (where s.choice = q.correct_option))::integer as correct_count,
  max(s."timestamp") as last_submission_at,
  (array_agg(
    case
      when s.choice is null then 'unanswered'
      when s.choice = q.correct_option then 'correct'
      else 'incorrect'
    end
    order by s."timestamp" desc
  ) filter (where s.id is not null))[1] as last_result
from public.questions q
join public.units u on u.id = q.unit_id
left join public.submissions s on s.question_id = q.id
group by q.id, q.unit_id, u.exam_id;

-- Per-test progress counters.
create view public.test_stats
  with (security_invoker = true) as
select
  t.id as test_id,
  cardinality(t.question_ids)::integer as total_questions,
  count(s.id)::integer as submitted_count,
  (count(s.id) filter (where s.choice is not null))::integer as answered_count,
  (count(s.id) filter (where s.choice = q.correct_option))::integer as correct_count
from public.tests t
left join public.submissions s on s.test_id = t.id
left join public.questions q on q.id = s.question_id
group by t.id;

-- ------------------------------------------------------------------ RPCs ----

-- Finish a test: every question without a submission gets a null-choice one,
-- then the end timestamp is set. Idempotent for already-finished tests.
create function public.finish_test(p_test_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_test public.tests%rowtype;
begin
  select * into v_test from public.tests
  where id = p_test_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Test not found';
  end if;
  if v_test."end" is not null then
    return;
  end if;

  insert into public.submissions (user_id, test_id, question_id, choice)
  select v_test.user_id, v_test.id, qid, null
  from unnest(v_test.question_ids) as qid
  where not exists (
    select 1 from public.submissions s
    where s.test_id = v_test.id and s.question_id = qid
  );

  update public.tests set "end" = now() where id = v_test.id;
end;
$$;

-- Restart a test: unlink its submissions (they stay as records) and reopen it.
create function public.restart_test(p_test_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.tests where id = p_test_id and user_id = auth.uid()) then
    raise exception 'Test not found';
  end if;
  update public.submissions set test_id = null where test_id = p_test_id;
  update public.tests set "end" = null, "start" = now() where id = p_test_id;
end;
$$;

-- Danger zone: delete every test and submission of the current user. This is
-- the only way submissions get deleted.
create function public.reset_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.submissions where user_id = auth.uid();
  delete from public.tests where user_id = auth.uid();
end;
$$;

revoke execute on function public.finish_test(uuid) from public, anon;
revoke execute on function public.restart_test(uuid) from public, anon;
revoke execute on function public.reset_user_data() from public, anon;
grant execute on function public.finish_test(uuid) to authenticated;
grant execute on function public.restart_test(uuid) to authenticated;
grant execute on function public.reset_user_data() to authenticated;
