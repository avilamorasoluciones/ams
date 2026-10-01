-- AMS Fly · Neon PostgreSQL
-- La tabla está pensada para un endpoint seguro. Nunca expongas DATABASE_URL al navegador.

create table if not exists ams_fly_scores (
  id uuid primary key default gen_random_uuid(),
  player_name varchar(18) not null,
  country_code varchar(2) not null,
  bird_id varchar(32) not null,
  score integer not null check (score >= 0 and score <= 1000000),
  message varchar(90) not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ams_fly_scores_score_idx
  on ams_fly_scores (score desc, created_at asc);

create index if not exists ams_fly_scores_created_idx
  on ams_fly_scores (created_at desc);

-- Ranking:
-- select id, player_name as name, country_code as country,
--        bird_id as "birdId", score, message, created_at
-- from ams_fly_scores
-- order by score desc, created_at asc
-- limit 50;

-- Recomendación para el endpoint:
-- 1. Validar longitud y caracteres del nombre/mensaje.
-- 2. Validar country_code y bird_id contra una lista permitida.
-- 3. Limitar frecuencia por IP/session antes del INSERT.
-- 4. No permitir que el cliente envíe created_at.
-- 5. Nunca aceptar una puntuación negativa.
-- 6. El endpoint debe ser quien tenga DATABASE_URL.
