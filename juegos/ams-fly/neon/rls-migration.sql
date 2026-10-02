-- AMS Fly · Neon Data API / RLS migration
-- Identidad de piloto: el celular es único y se mantiene privado.
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

grant select on public.ams_fly_scores
  to anonymous, authenticated;

grant select on public.ams_fly_event_config
  to anonymous, authenticated;

grant update on public.ams_fly_event_config
  to authenticated;

grant update on public.ams_fly_participants
  to authenticated;

-- La tabla no acepta INSERT directo desde Data API.
-- El registro público pasa únicamente por ams_fly_register_participant().
revoke insert on public.ams_fly_participants
  from anonymous, authenticated;

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

create policy "ams_fly_participants_admin_update"
  on public.ams_fly_participants
  for update
  to authenticated
  using ((select public.ams_fly_is_admin()))
  with check ((select public.ams_fly_is_admin()));

-- Public registration/update helper. It is intentionally limited to the
-- AMS Fly participant fields and does not expose the participant table.
create or replace function public.ams_fly_register_participant(
  p_name varchar(18), p_country varchar(2), p_bird_id varchar(32), p_phone varchar(30), p_score integer)
returns json language plpgsql security definer set search_path=public as $$
declare v_existing public.ams_fly_participants%ROWTYPE; v_phone text:=regexp_replace(trim(coalesce(p_phone,'')),'[^0-9+]','','g'); v_existing_by_phone public.ams_fly_participants%ROWTYPE;
begin
  if char_length(trim(p_name)) not between 2 and 18 or p_country not in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
     or p_bird_id not in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
     or v_phone !~ '^\+[1-9][0-9]{7,14}$' or p_score is null or p_score<0 or p_score>1000000 then raise exception 'invalid_participant'; end if;
  select * into v_existing_by_phone from public.ams_fly_participants where phone=v_phone limit 1;
  if v_existing_by_phone.id is not null and lower(trim(v_existing_by_phone.player_name))<>lower(trim(p_name)) then raise exception 'phone_name_mismatch'; end if;
  if v_existing_by_phone.id is not null then
    if p_score>coalesce(v_existing_by_phone.score,0) then
      update public.ams_fly_participants set country_code=upper(trim(p_country)),bird_id=trim(p_bird_id),score=p_score,best_score_at=now(),prize_eligible=not (v_phone in ('+573043344962','+573043343619')),updated_at=now()
      where id=v_existing_by_phone.id returning * into v_existing;
    else
      update public.ams_fly_participants set country_code=upper(trim(p_country)),bird_id=trim(p_bird_id),prize_eligible=not (v_phone in ('+573043344962','+573043343619')),updated_at=now()
      where id=v_existing_by_phone.id returning * into v_existing;
    end if;
    return json_build_object('ok',true,'existing',true,'participant_id',v_existing.id,'name',v_existing.player_name,'country',v_existing.country_code,'bird_id',v_existing.bird_id,'phone_verified',v_existing.phone_verified);
  end if;
  insert into public.ams_fly_participants(player_name,country_code,bird_id,phone,score,best_score_at,prize_eligible)
  values(trim(p_name),upper(trim(p_country)),trim(p_bird_id),v_phone,p_score,now(),not (v_phone in ('+573043344962','+573043343619'))) returning * into v_existing;
  return json_build_object('ok',true,'existing',false,'participant_id',v_existing.id,'name',v_existing.player_name,'country',v_existing.country_code,'bird_id',v_existing.bird_id,'phone_verified',v_existing.phone_verified);
end; $$;

revoke all on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) from public;
grant execute on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) to anonymous, authenticated;

create or replace function public.ams_fly_submit_score(
  p_participant_id uuid,p_name varchar(18),p_country varchar(2),p_bird_id varchar(32),p_score integer,p_message varchar(90),p_duration_ms bigint default null)
returns json language plpgsql security definer set search_path=public as $$
declare v_event public.ams_fly_event_config%ROWTYPE; v_participant public.ams_fly_participants%ROWTYPE; v_now timestamptz:=now(); v_last timestamptz;
begin
  select * into v_event from public.ams_fly_event_config where id=1;
  if v_event.id is null or not v_event.active or v_event.event_start_at is null or v_event.event_end_at is null or v_now<v_event.event_start_at or v_now>v_event.event_end_at then raise exception 'event_closed'; end if;
  if p_participant_id is null or char_length(trim(p_name)) not between 2 and 18 or p_country not in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
     or p_bird_id not in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
     or p_message is null or char_length(trim(p_message)) not between 3 and 90 or p_score is null or p_score<1 or p_score>10000 then raise exception 'invalid_score'; end if;
  if p_duration_ms is not null and (p_duration_ms<500 or p_duration_ms>86400000) then raise exception 'invalid_duration'; end if;
  if p_duration_ms is not null and p_score > floor(p_duration_ms/900.0)+3 then raise exception 'score_not_plausible'; end if;
  select * into v_participant from public.ams_fly_participants where id=p_participant_id limit 1;
  if v_participant.id is null then raise exception 'participant_not_found'; end if;
  if lower(trim(v_participant.player_name))<>lower(trim(p_name)) or v_participant.country_code<>upper(trim(p_country)) or v_participant.bird_id<>trim(p_bird_id) then raise exception 'participant_mismatch'; end if;
  select max(created_at) into v_last from public.ams_fly_scores where participant_id=p_participant_id;
  if v_last is not null and v_last>v_now-interval '3 seconds' then raise exception 'score_rate_limited'; end if;
  insert into public.ams_fly_scores(participant_id,player_name,country_code,bird_id,score,message,created_at)
  values(p_participant_id,trim(p_name),upper(trim(p_country)),trim(p_bird_id),p_score,trim(p_message),v_now);
  if p_score>coalesce(v_participant.score,0) then update public.ams_fly_participants set score=p_score,best_score_at=v_now,updated_at=v_now where id=p_participant_id;
  else update public.ams_fly_participants set updated_at=v_now where id=p_participant_id; end if;
  return json_build_object('ok',true,'participant_id',p_participant_id,'score',p_score,'provisional',not coalesce(v_participant.phone_verified,false));
end; $$;

revoke all on function public.ams_fly_submit_score(uuid,varchar(18),varchar(2),varchar(32),integer,varchar(90),bigint) from public;
grant execute on function public.ams_fly_submit_score(uuid,varchar(18),varchar(2),varchar(32),integer,varchar(90),bigint) to anonymous, authenticated;
revoke insert on public.ams_fly_scores from anonymous, authenticated;


-- Identidad de piloto entre dispositivos.
alter table public.ams_fly_participants
  add column if not exists phone_verified boolean not null default false;

create unique index if not exists ams_fly_participants_phone_uidx
  on public.ams_fly_participants (phone);

alter table public.ams_fly_scores
  add column if not exists participant_id uuid references public.ams_fly_participants(id);

create index if not exists ams_fly_scores_participant_idx
  on public.ams_fly_scores (participant_id);


-- event_start_at/event_end_at controlan la vigencia real del evento.
-- prize_eligible permite excluir al equipo organizador sin ocultarlo del ranking.
-- best_score_at registra cuándo se alcanzó el mejor puntaje.
-- El trigger ams_fly_score_event_guard bloquea nuevas puntuaciones fuera de la vigencia.
