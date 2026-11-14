-- Structure Lab starter schema
-- Run this in Supabase SQL Editor after creating the project.
-- Column name is "note" (matches the frontend).

create extension if not exists pgcrypto;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  sequence_no integer not null unique,
  title text not null,
  subtitle text,
  stage text not null,
  content jsonb not null default '{}'::jsonb,
  references jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_sections text[] not null default '{}',
  quiz_score numeric(5,2),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_key text not null,
  level integer not null check (level between 0 and 5),
  evidence text,
  assessed_at timestamptz not null default now()
);

-- If you previously created lesson_notes with a "body" column, run this once:
-- alter table public.lesson_notes rename column body to note;

alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.skill_assessments enable row level security;

create policy "Published lessons are readable"
on public.lessons for select
to anon, authenticated
using (published = true);

create policy "Users read their own progress"
on public.lesson_progress for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own progress"
on public.lesson_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users update their own progress"
on public.lesson_progress for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own notes"
on public.lesson_notes for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users read their own skill assessments"
on public.skill_assessments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own skill assessments"
on public.skill_assessments for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users update their own skill assessments"
on public.skill_assessments for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select on public.lessons to anon, authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.lesson_notes to authenticated;
grant select, insert, update on public.skill_assessments to authenticated;
