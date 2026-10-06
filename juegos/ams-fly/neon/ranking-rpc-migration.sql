-- AMS Fly · repair the public ranking RPC in the Data API's exposed schema.
-- Run against the same database/branch configured in neon-config.js after schema.sql.
-- This does not create an alias in another schema or expose participant profiles.

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
grant usage on schema public to anonymous, authenticated;
grant execute on function public.ams_fly_public_ranking(integer) to anonymous, authenticated;

notify pgrst, 'reload schema';
