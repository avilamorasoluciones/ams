-- AyuKcal / Supabase
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.ayukcal_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.ayukcal_user_data enable row level security;

drop policy if exists "AyuKcal users can read own data" on public.ayukcal_user_data;
create policy "AyuKcal users can read own data"
on public.ayukcal_user_data for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "AyuKcal users can insert own data" on public.ayukcal_user_data;
create policy "AyuKcal users can insert own data"
on public.ayukcal_user_data for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "AyuKcal users can update own data" on public.ayukcal_user_data;
create policy "AyuKcal users can update own data"
on public.ayukcal_user_data for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "AyuKcal users can delete own data" on public.ayukcal_user_data;
create policy "AyuKcal users can delete own data"
on public.ayukcal_user_data for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists ayukcal_user_data_updated_at_idx
on public.ayukcal_user_data(updated_at);

-- Optional helper trigger: keep updated_at current.
create or replace function public.ayukcal_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ayukcal_user_data_touch on public.ayukcal_user_data;
create trigger ayukcal_user_data_touch
before update on public.ayukcal_user_data
for each row execute function public.ayukcal_touch_updated_at();
