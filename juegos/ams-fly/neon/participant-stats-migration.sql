-- AMS Fly · progreso persistente por cuenta
-- Devuelve únicamente el progreso del piloto autenticado:
-- récord (participants.score) y cantidad de partidas publicadas (scores).
-- No expone perfiles ni permite consultar el progreso de otras cuentas.

create or replace function public.ams_fly_get_participant_stats()
returns json
language plpgsql
stable
security definer
set search_path=public,neon_auth
as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_participant public.ams_fly_participants%ROWTYPE;
  v_games bigint:=0;
begin
  if v_auth_user_id is null then
    raise exception 'auth_required';
  end if;

  select * into v_participant
  from public.ams_fly_participants
  where auth_user_id=v_auth_user_id
  limit 1;

  if v_participant.id is null then
    return json_build_object(
      'found',false,
      'best_score',0,
      'games',0
    );
  end if;

  select count(*) into v_games
  from public.ams_fly_scores
  where participant_id=v_participant.id;

  return json_build_object(
    'found',true,
    'participant_id',v_participant.id,
    'best_score',greatest(coalesce(v_participant.score,0),0),
    'games',greatest(v_games,0),
    'updated_at',v_participant.updated_at
  );
end;
$$;

revoke all on function public.ams_fly_get_participant_stats() from public;
grant execute on function public.ams_fly_get_participant_stats() to anonymous,authenticated;

notify pgrst,'reload schema';
