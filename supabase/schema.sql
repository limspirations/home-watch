-- Run once in the selected Supabase project's SQL editor.
-- A user's private board is readable/writable only with that user's JWT.
begin;
create table if not exists public.home_watch_boards (
 user_id uuid primary key references auth.users(id) on delete cascade,
 items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 1000),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.home_watch_boards enable row level security;
revoke all on public.home_watch_boards from anon;
revoke all on public.home_watch_boards from authenticated;
grant select,insert,update on public.home_watch_boards to authenticated;
drop policy if exists home_watch_owner_read on public.home_watch_boards;
create policy home_watch_owner_read on public.home_watch_boards for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists home_watch_owner_insert on public.home_watch_boards;
create policy home_watch_owner_insert on public.home_watch_boards for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists home_watch_owner_update on public.home_watch_boards;
create policy home_watch_owner_update on public.home_watch_boards for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
