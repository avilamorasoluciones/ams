-- AMS Fly · Neon Data API / RLS migration
-- Identidad de piloto: una cuenta Neon = un piloto.
-- No se requiere backend propio ni verificación SMS.
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
revoke insert, update, delete on public.ams_fly_scores
  from authenticated;

grant select on public.ams_fly_event_config
  to anonymous, authenticated;

grant update on public.ams_fly_event_config
  to authenticated;
revoke insert, delete on public.ams_fly_event_config
  from authenticated;

grant update on public.ams_fly_participants
  to authenticated;
revoke insert, delete on public.ams_fly_participants
  from authenticated;

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
create policy "ams_fly_participants_admin_read"
  on public.ams_fly_participants
  for select
  to authenticated
  using ((select public.ams_fly_is_admin()));

drop policy if exists "ams_fly_participants_admin_update" on public.ams_fly_participants;
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
returns json language plpgsql security definer set search_path=public,neon_auth as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_existing public.ams_fly_participants%ROWTYPE;
  v_phone text:=nullif(regexp_replace(trim(coalesce(p_phone,'')),'[^0-9+]','','g'),'');
  v_internal boolean:=false;
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;
  if char_length(trim(p_name)) not between 2 and 18
     or p_country not in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
     or p_bird_id not in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
     or (v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$')
     or p_score is null or p_score<0 or p_score>1000000 then raise exception 'invalid_participant'; end if;

  select exists (
    select 1 from neon_auth."user" u
    where u.id::text=v_auth_user_id
      and (u.role='admin' or lower(coalesce(u.email,'')) like '%@avilamorasoluciones.com')
  ) into v_internal;

  select * into v_existing from public.ams_fly_participants
  where auth_user_id=v_auth_user_id limit 1;

  if v_existing.id is not null then
    if p_score>coalesce(v_existing.score,0) then
      update public.ams_fly_participants
      set player_name=trim(p_name),country_code=upper(trim(p_country)),bird_id=trim(p_bird_id),
          phone=coalesce(v_phone,v_existing.phone),score=p_score,best_score_at=now(),
          prize_eligible=case when v_internal then false else coalesce(v_existing.prize_eligible,true) end,
          updated_at=now()
      where id=v_existing.id returning * into v_existing;
    else
      update public.ams_fly_participants
      set player_name=trim(p_name),country_code=upper(trim(p_country)),bird_id=trim(p_bird_id),
          phone=coalesce(v_phone,v_existing.phone),
          prize_eligible=case when v_internal then false else coalesce(v_existing.prize_eligible,true) end,
          updated_at=now()
      where id=v_existing.id returning * into v_existing;
    end if;
    return json_build_object('ok',true,'existing',true,'participant_id',v_existing.id,'name',v_existing.player_name,'country',v_existing.country_code,'bird_id',v_existing.bird_id,'auth_user_id',v_existing.auth_user_id,'prize_eligible',v_existing.prize_eligible);
  end if;

  insert into public.ams_fly_participants(auth_user_id,player_name,country_code,bird_id,phone,score,best_score_at,prize_eligible)
  values(v_auth_user_id,trim(p_name),upper(trim(p_country)),trim(p_bird_id),v_phone,p_score,case when p_score>0 then now() else null end,not v_internal)
  returning * into v_existing;

  return json_build_object('ok',true,'existing',false,'participant_id',v_existing.id,'name',v_existing.player_name,'country',v_existing.country_code,'bird_id',v_existing.bird_id,'auth_user_id',v_existing.auth_user_id,'prize_eligible',v_existing.prize_eligible);
end; $$;

revoke all on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) from public;
grant execute on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) to authenticated;

create or replace function public.ams_fly_submit_score(
  p_participant_id uuid,p_name varchar(18),p_country varchar(2),p_bird_id varchar(32),p_score integer,p_message varchar(90),p_duration_ms bigint default null)
returns json language plpgsql security definer set search_path=public,neon_auth as $$
declare
  v_event public.ams_fly_event_config%ROWTYPE;
  v_participant public.ams_fly_participants%ROWTYPE;
  v_now timestamptz:=now();
  v_last timestamptz;
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;
  select * into v_event from public.ams_fly_event_config where id=1;
  if v_event.id is null or not v_event.active or v_event.event_start_at is null or v_event.event_end_at is null or v_now<v_event.event_start_at or v_now>v_event.event_end_at then raise exception 'event_closed'; end if;
  if p_participant_id is null or char_length(trim(p_name)) not between 2 and 18 or p_country not in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
     or p_bird_id not in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
     or p_message is null or char_length(trim(p_message)) not between 3 and 90 or p_score is null or p_score<1 or p_score>10000 then raise exception 'invalid_score'; end if;
  if p_duration_ms is not null and (p_duration_ms<500 or p_duration_ms>86400000) then raise exception 'invalid_duration'; end if;
  if p_duration_ms is not null and p_score>floor(p_duration_ms/900.0)+3 then raise exception 'score_not_plausible'; end if;
  select * into v_participant from public.ams_fly_participants where id=p_participant_id limit 1;
  if v_participant.id is null then raise exception 'participant_not_found'; end if;
  if v_participant.auth_user_id is distinct from v_auth_user_id then raise exception 'participant_owner_mismatch'; end if;
  if lower(trim(v_participant.player_name))<>lower(trim(p_name)) or v_participant.country_code<>upper(trim(p_country)) or v_participant.bird_id<>trim(p_bird_id) then raise exception 'participant_mismatch'; end if;
  select max(created_at) into v_last from public.ams_fly_scores where participant_id=p_participant_id;
  if v_last is not null and v_last>v_now-interval '3 seconds' then raise exception 'score_rate_limited'; end if;
  insert into public.ams_fly_scores(participant_id,player_name,country_code,bird_id,score,message,created_at)
  values(p_participant_id,trim(p_name),upper(trim(p_country)),trim(p_bird_id),p_score,trim(p_message),v_now);
  if p_score>coalesce(v_participant.score,0) then
    update public.ams_fly_participants set score=p_score,best_score_at=v_now,updated_at=v_now where id=p_participant_id;
  else
    update public.ams_fly_participants set updated_at=v_now where id=p_participant_id;
  end if;
  return json_build_object('ok',true,'participant_id',p_participant_id,'score',p_score,'provisional',false);
end; $$;

revoke all on function public.ams_fly_submit_score(uuid,varchar(18),varchar(2),varchar(32),integer,varchar(90),bigint) from public;
grant execute on function public.ams_fly_submit_score(uuid,varchar(18),varchar(2),varchar(32),integer,varchar(90),bigint) to authenticated;
revoke insert on public.ams_fly_scores from anonymous, authenticated;


-- Identidad única de piloto entre dispositivos.
alter table public.ams_fly_participants
  add column if not exists auth_user_id text;

alter table public.ams_fly_participants
  alter column phone drop not null;

create unique index if not exists ams_fly_participants_auth_user_uidx
  on public.ams_fly_participants (auth_user_id)
  where auth_user_id is not null;

alter table public.ams_fly_participants drop constraint if exists ams_fly_participants_player_name_country_code_key;

alter table public.ams_fly_scores
  add column if not exists participant_id uuid references public.ams_fly_participants(id);

create index if not exists ams_fly_scores_participant_idx
  on public.ams_fly_scores (participant_id);


-- event_start_at/event_end_at controlan la vigencia real del evento.
-- prize_eligible permite excluir al equipo organizador sin ocultarlo del ranking.
-- best_score_at registra cuándo se alcanzó el mejor puntaje.
-- El trigger ams_fly_score_event_guard bloquea nuevas puntuaciones fuera de la vigencia.


-- Persist event terms acceptance against the authenticated Neon account.
alter table public.ams_fly_participants
  add column if not exists terms_accepted_at timestamptz;

create or replace function public.ams_fly_accept_terms()
returns json
language plpgsql
security definer
set search_path=public,neon_auth
as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_participant_id uuid;
  v_accepted_at timestamptz:=now();
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;

  update public.ams_fly_participants
  set terms_accepted_at=v_accepted_at,updated_at=v_accepted_at
  where auth_user_id=v_auth_user_id
  returning id into v_participant_id;

  if v_participant_id is null then raise exception 'participant_not_found'; end if;

  return json_build_object(
    'ok',true,
    'participant_id',v_participant_id,
    'terms_accepted_at',v_accepted_at
  );
end; $$;

revoke all on function public.ams_fly_accept_terms() from public;
grant execute on function public.ams_fly_accept_terms() to authenticated;


create or replace function public.ams_fly_get_terms_status()
returns json
language plpgsql
security definer
set search_path=public,neon_auth
as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_accepted_at timestamptz;
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;

  select terms_accepted_at into v_accepted_at
  from public.ams_fly_participants
  where auth_user_id=v_auth_user_id
  limit 1;

  return json_build_object(
    'accepted',v_accepted_at is not null,
    'accepted_at',v_accepted_at
  );
end; $$;

revoke all on function public.ams_fly_get_terms_status() from public;
grant execute on function public.ams_fly_get_terms_status() to authenticated;


-- Recover the authenticated pilot profile after local browser data is cleared.
create or replace function public.ams_fly_get_participant_profile()
returns json
language plpgsql
security definer
set search_path=public,neon_auth
as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_participant public.ams_fly_participants%ROWTYPE;
  v_first text;
  v_last text;
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;

  select * into v_participant
  from public.ams_fly_participants
  where auth_user_id=v_auth_user_id
  limit 1;

  if v_participant.id is null then
    return json_build_object('found',false);
  end if;

  v_first:=split_part(trim(v_participant.player_name),' ',1);
  v_last:=nullif(trim(regexp_replace(trim(v_participant.player_name),'^\\S+\\s*','')),'');

  return json_build_object(
    'found',true,
    'participant_id',v_participant.id,
    'name',v_participant.player_name,
    'first_name',v_first,
    'last_name',coalesce(v_last,''),
    'country',v_participant.country_code,
    'bird_id',v_participant.bird_id,
    'phone',coalesce(v_participant.phone,''),
    'dial',case
      when v_participant.phone like '+57%' then '57'
      when v_participant.phone like '+58%' then '58'
      when v_participant.phone like '+593%' then '593'
      when v_participant.phone like '+1%' then '1'
      when v_participant.phone like '+52%' then '52'
      when v_participant.phone like '+54%' then '54'
      when v_participant.phone like '+56%' then '56'
      when v_participant.phone like '+51%' then '51'
      when v_participant.phone like '+55%' then '55'
      when v_participant.phone like '+507%' then '507'
      else '57'
    end,
    'prize_eligible',coalesce(v_participant.prize_eligible,true),
    'terms_accepted',v_participant.terms_accepted_at is not null,
    'terms_accepted_at',v_participant.terms_accepted_at
  );
end; $$;

revoke all on function public.ams_fly_get_participant_profile() from public;
grant execute on function public.ams_fly_get_participant_profile() to authenticated;


-- Public ranking projection: expose only the fields already shown publicly,
-- and avoid granting public reads to the private participant profiles table.
create or replace function public.ams_fly_public_ranking(p_limit integer default 100)
returns table (
  participant_id uuid,
  player_name varchar,
  country_code varchar,
  bird_id varchar,
  score integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with best_scores as (
    select distinct on (s.participant_id)
      s.participant_id, s.player_name, s.country_code, s.score, s.created_at
    from public.ams_fly_scores s
    where s.participant_id is not null
    order by s.participant_id, s.score desc, s.created_at asc, s.id asc
  ),
  latest_birds as (
    select distinct on (s.participant_id)
      s.participant_id, s.bird_id
    from public.ams_fly_scores s
    where s.participant_id is not null
    order by s.participant_id, s.created_at desc, s.id desc
  )
  select b.participant_id, b.player_name, b.country_code, l.bird_id, b.score, b.created_at
  from best_scores b
  join latest_birds l using (participant_id)
  order by b.score desc, b.created_at asc, b.participant_id asc
  limit greatest(1, least(coalesce(p_limit, 100), 100))
$$;

revoke all on function public.ams_fly_public_ranking(integer) from public;
grant execute on function public.ams_fly_public_ranking(integer) to anonymous, authenticated;

-- Make the new RPC signature visible to the Data API immediately.
notify pgrst, 'reload schema';
