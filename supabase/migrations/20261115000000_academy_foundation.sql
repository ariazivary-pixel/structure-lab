-- Additive Structure Lab academy schema. Review existing policies before execution.
create table if not exists public.academy_lessons (
  id text primary key,
  sequence_no integer not null unique,
  title text not null,
  stage text not null,
  summary text not null default '',
  content jsonb not null default '{}'::jsonb,
  references jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.academy_lessons(id) on delete cascade,
  completed_sections text[] not null default '{}',
  quiz_score numeric(5,2),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
alter table public.academy_lessons enable row level security;
alter table public.academy_progress enable row level security;
create policy "Published academy lessons are readable" on public.academy_lessons for select to anon, authenticated using (published = true);
create policy "Users read their own academy progress" on public.academy_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create their own academy progress" on public.academy_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their own academy progress" on public.academy_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select on public.academy_lessons to anon, authenticated;
grant select, insert, update on public.academy_progress to authenticated;
