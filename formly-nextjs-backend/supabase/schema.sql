-- Formly / Interactive Form Builder
-- Run this whole script in Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  color text not null default '#7156e8' check (color ~ '^#[0-9a-fA-F]{6}$'),
  welcome text not null default '',
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  source text not null default 'Public link' check (source in ('Public link','Website widget')),
  created_at timestamptz not null default now()
);

create index if not exists forms_owner_updated_idx on public.forms(owner_id, updated_at desc);
create index if not exists submissions_form_created_idx on public.submissions(form_id, created_at desc);

alter table public.forms enable row level security;
alter table public.submissions enable row level security;

-- API scaffold currently uses a server-only service-role key and does not expose direct
-- table access from the browser. These deny-by-default policies protect anon/auth clients.
-- Add owner-scoped policies when authentication is implemented; never add public read
-- access to submissions. The service role bypasses RLS, so secure API routes themselves.
drop policy if exists "forms owner access" on public.forms;
create policy "forms owner access" on public.forms
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "submissions owner read" on public.submissions;
create policy "submissions owner read" on public.submissions
  for select to authenticated
  using (exists (
    select 1 from public.forms f
    where f.id = submissions.form_id and f.owner_id = (select auth.uid())
  ));

-- Optional seed forms are intentionally omitted: create real forms through the API.
