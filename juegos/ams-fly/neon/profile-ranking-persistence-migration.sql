-- AMS Fly · perfil persistente y ranking basado en el perfil actual
-- Ejecutar sobre el proyecto Neon de AMS Fly.
-- No modifica ni elimina puntuaciones existentes.

alter table public.ams_fly_participants
  add column if not exists terms_accepted_at timestamptz;

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
set search_path=public,neon_auth
as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_existing public.ams_fly_participants%ROWTYPE;
  v_phone text:=nullif(regexp_replace(trim(coalesce(p_phone,'')),'[^0-9+]','','g'),'');
  v_internal boolean:=false;
  v_score integer:=greatest(coalesce(p_score,0),0);
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;

  if char_length(trim(p_name)) not between 2 and 18
     or p_country not in ('CO','VE','EC','US','MX','AR','CL','PE','BR','PA')
     or p_bird_id not in ('condor-co','turpial','tucan-ec','eagle-us','eagle-mx','hornero','chucao-cl','cock-rock','sabia','harpia')
     or (v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$')
     or p_score is null or p_score<0 or p_score>1000000
  then raise exception 'invalid_participant'; end if;

  select exists (
    select 1 from neon_auth."user" u
    where u.id::text=v_auth_user_id
      and (u.role='admin' or lower(coalesce(u.email,'')) like '%@avilamorasoluciones.com')
  ) into v_internal;

  select * into v_existing
  from public.ams_fly_participants
  where auth_user_id=v_auth_user_id
  limit 1;

  if v_existing.id is not null then
    update public.ams_fly_participants
    set player_name=trim(p_name),
        country_code=upper(trim(p_country)),
        bird_id=trim(p_bird_id),
        phone=v_phone,
        score=greatest(v_existing.score,v_score),
        best_score_at=case
          when v_score>coalesce(v_existing.score,0) then now()
          else v_existing.best_score_at
        end,
        prize_eligible=case
          when v_internal then false
          else coalesce(v_existing.prize_eligible,true)
        end,
        updated_at=now()
    where id=v_existing.id
    returning * into v_existing;

    return json_build_object(
      'ok',true,'existing',true,'participant_id',v_existing.id,
      'name',v_existing.player_name,'country',v_existing.country_code,
      'bird_id',v_existing.bird_id,'phone',coalesce(v_existing.phone,''),
      'auth_user_id',v_existing.auth_user_id,'prize_eligible',v_existing.prize_eligible
    );
  end if;

  insert into public.ams_fly_participants(
    auth_user_id,player_name,country_code,bird_id,phone,score,best_score_at,prize_eligible
  )
  values(
    v_auth_user_id,trim(p_name),upper(trim(p_country)),trim(p_bird_id),v_phone,
    v_score,case when v_score>0 then now() else null end,not v_internal
  )
  returning * into v_existing;

  return json_build_object(
    'ok',true,'existing',false,'participant_id',v_existing.id,
    'name',v_existing.player_name,'country',v_existing.country_code,
    'bird_id',v_existing.bird_id,'phone',coalesce(v_existing.phone,''),
    'auth_user_id',v_existing.auth_user_id,'prize_eligible',v_existing.prize_eligible
  );
end;
$$;

revoke all on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) from public;
grant execute on function public.ams_fly_register_participant(varchar(18),varchar(2),varchar(32),varchar(30),integer) to authenticated;

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
  v_last:=nullif(trim(regexp_replace(trim(v_participant.player_name),'^\S+\s*','')),'');

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
end;
$$;

revoke all on function public.ams_fly_get_participant_profile() from public;
grant execute on function public.ams_fly_get_participant_profile() to authenticated;

create or replace function public.ams_fly_public_ranking()
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
set search_path=public
as $$
  select
    p.id,
    p.player_name,
    p.country_code,
    p.bird_id,
    p.score,
    coalesce(p.best_score_at,p.updated_at,p.created_at)
  from public.ams_fly_participants p
  where p.score>0
    and p.prize_eligible=true
  order by p.score desc,
           coalesce(p.best_score_at,p.updated_at,p.created_at) asc,
           p.id asc
  limit 100
$$;

revoke all on function public.ams_fly_public_ranking() from public;
grant usage on schema public to anonymous,authenticated;
grant execute on function public.ams_fly_public_ranking() to anonymous,authenticated;

notify pgrst,'reload schema';
