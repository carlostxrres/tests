-- explanation used '' to mean "no explanation", which the type system can't
-- distinguish from an actual (empty) value. Make it nullable and backfill.

alter table public.questions alter column explanation drop not null;
alter table public.questions alter column explanation drop default;

update public.questions set explanation = null where explanation = '';
