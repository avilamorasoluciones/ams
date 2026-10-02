-- AMS Fly · Neon Data API / RLS migration
-- Ejecutar UNA vez en production después del schema.sql.
-- No contiene secretos.

create or replace function public.ams_fly_is_admin()
returns boolean
language sql
security definer
set search_path = public, neon_auth
as $$
  select exists (
    select 1
    from neon_auth."user" u
    where u.id::text = auth.user_id()
      and u.role = 'admin'
      and u."emailVerified" = true
  );
$$;

revoke all on function public.ams_fly_is_admin() from public;
grant execute on function public.ams_fly_is_admin() to authenticated;
grant usage on schema public to anonymous, authenticated;

grant select, insert on public.ams_fly_scores
  to anonymous, authenticated;

grant select on public.ams_fly_event_config
  to anonymous, authenticated;

grant update on public.ams_fly_event_config
  to authenticated;

grant insert on public.ams_fly_participants
  to anonymous, authenticated;

grant select on public.ams_fly_participants
  to authenticated;


alter table public.ams_fly_scores enable row level security;
alter table public.ams_fly_participants enable row level security;
alter table public.ams_fly_event_config enable row level security;

drop policy if exists "ams_fly_scores_public_read" on public.ams_fly_scores;
drop policy if exists "ams_fly_scores_public_insert" on public.ams_fly_scores;
create policy "ams_fly_scores_public_read"
  on public.ams_fly_scores
  for select
  to anonymous, authenticated
  using (true);

create policy "ams_fly_scores_public_insert"
  on public.ams_fly_scores
  for insert
  to anonymous, authenticated
  with check (
    char_length(player_name) between 2 and 18
    and country_code in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
    and bird_id in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
    and char_length(message) between 2 and 90
    and score between 0 and 1000000
  );

drop policy if exists "ams_fly_event_public_read" on public.ams_fly_event_config;
drop policy if exists "ams_fly_event_admin_update" on public.ams_fly_event_config;
create policy "ams_fly_event_public_read"
  on public.ams_fly_event_config
  for select
  to anonymous, authenticated
  using (id = 1);

create policy "ams_fly_event_admin_update"
  on public.ams_fly_event_config
  for update
  to authenticated
  using ((select public.ams_fly_is_admin()))
  with check ((select public.ams_fly_is_admin()));

drop policy if exists "ams_fly_participants_public_insert" on public.ams_fly_participants;
drop policy if exists "ams_fly_participants_admin_read" on public.ams_fly_participants;
create policy "ams_fly_participants_public_insert"
  on public.ams_fly_participants
  for insert
  to anonymous, authenticated
  with check (
    char_length(player_name) between 2 and 18
    and country_code in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
    and bird_id in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
    and char_length(phone) between 7 and 30
    and score between 0 and 1000000
  );

create policy "ams_fly_participants_admin_read"
  on public.ams_fly_participants
  for select
  to authenticated
  using ((select public.ams_fly_is_admin()));

-- Public registration/update helper. It is intentionally limited to the
-- AMS Fly participant fields and does not expose the participant table.
create or replace function public.ams_fly_register_participant(
  p_name varchar(18),
  p_country varchar(2),
  p_bird_id varchar(32),
  p_phone varchar(30),
  p_score integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(trim(p_name)) not between 2 and 18
     or p_country not in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
     or p_bird_id not in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
     or char_length(trim(p_phone)) not between 7 and 30
     or p_score is null
     or p_score < 0
     or p_score > 1000000 then
    raise exception 'invalid_participant';
  end if;

  insert into public.ams_fly_participants(player_name,country_code,bird_id,phone,score)
  values (trim(p_name),upper(trim(p_country)),trim(p_bird_id),trim(p_phone),p_score)
  on conflict (player_name,country_code)
  do update set
    bird_id = excluded.bird_id,
    phone = excluded.phone,
    score = greatest(public.ams_fly_participants.score, excluded.score),
    updated_at = now();

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) from public;
grant execute on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) to anonymous, authenticated;
