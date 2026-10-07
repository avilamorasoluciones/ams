-- AMS Fly · ranking ligado al perfil actual del piloto.
-- El puntaje sigue siendo el mejor puntaje guardado en ams_fly_participants.
-- Nombre, país y ave se leen SIEMPRE del perfil actual.
-- Así, cambiar nombre/país/ave se refleja en el ranking sin necesitar
-- superar nuevamente el récord.

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
set search_path = public
as $$
  select
    p.id as participant_id,
    p.player_name,
    p.country_code,
    p.bird_id,
    p.score,
    coalesce(p.best_score_at, p.updated_at, p.created_at) as created_at
  from public.ams_fly_participants p
  where p.score > 0
    and p.prize_eligible = true
  order by p.score desc,
           coalesce(p.best_score_at, p.updated_at, p.created_at) asc,
           p.id asc
  limit 100
$$;

drop function if exists public.ams_fly_public_ranking(integer);
revoke all on function public.ams_fly_public_ranking() from public;
grant usage on schema public to anonymous, authenticated;
grant execute on function public.ams_fly_public_ranking() to anonymous, authenticated;

notify pgrst, 'reload schema';
