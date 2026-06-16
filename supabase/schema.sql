-- Agile Productivity — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query → Run).
-- Safe to re-run.

-- Timestamps are epoch milliseconds (bigint) to match the client's Date.now().

create table if not exists public.epics (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  color       text not null,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean not null default false
);

create table if not exists public.sprints (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  goal        text,
  start_date  text,
  end_date    text,
  status      text not null,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean not null default false
);

create table if not exists public.stories (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  epic_id     uuid,
  sprint_id   uuid,
  status      text not null,
  priority    text not null,
  points      integer,
  sort_order  bigint not null,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean not null default false
);

create table if not exists public.tasks (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  story_id    uuid not null,
  title       text not null,
  done        boolean not null default false,
  sort_order  bigint not null,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean not null default false
);

-- Indexes to make incremental pulls fast.
create index if not exists epics_user_updated   on public.epics   (user_id, updated_at);
create index if not exists sprints_user_updated on public.sprints (user_id, updated_at);
create index if not exists stories_user_updated on public.stories (user_id, updated_at);
create index if not exists tasks_user_updated   on public.tasks   (user_id, updated_at);

-- Row-level security: each user can only see and change their own rows.
do $$
declare t text;
begin
  foreach t in array array['epics','sprints','stories','tasks'] loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format(
      'create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);

    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format(
      'create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);

    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format(
      'create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);

    execute format('drop policy if exists "own_delete" on public.%I;', t);
    execute format(
      'create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- Enable realtime streaming for these tables (ignore "already member" errors).
do $$
declare t text;
begin
  foreach t in array array['epics','sprints','stories','tasks'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
