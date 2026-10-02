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


-- Configuración única del evento activo.
create table if not exists ams_fly_event_config (
  id integer primary key check (id = 1),
  active boolean not null default false,
  badge varchar(80) not null default '🏆 EVENTO ESPECIAL 2026',
  title varchar(120) not null default 'AMS Fly',
  description varchar(500) not null default '',
  cta varchar(80) not null default 'VER DETALLES DEL EVENTO',
  prize_title varchar(160) not null default '',
  prize_description varchar(1000) not null default '',
  condition_title varchar(160) not null default '',
  condition_description text not null default '',
  wa_template varchar(500) not null default '',
  event_start_at timestamptz,
  event_end_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into ams_fly_event_config (id)
values (1)
on conflict (id) do nothing;

-- Datos privados de participantes. Nunca se exponen en el ranking público.
create table if not exists ams_fly_participants (
  id uuid primary key default gen_random_uuid(),
  player_name varchar(18) not null,
  country_code varchar(2) not null,
  bird_id varchar(32) not null,
  auth_user_id text,
  phone varchar(30),
  phone_verified boolean not null default false,
  prize_eligible boolean not null default true,
  best_score_at timestamptz,
  score integer not null default 0 check (score >= 0 and score <= 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(phone)
);

create index if not exists ams_fly_participants_score_idx
  on ams_fly_participants (score desc, updated_at asc);


-- Vincula cada puntuación con el piloto cuando esté registrado.
alter table if exists ams_fly_scores
  add column if not exists participant_id uuid references ams_fly_participants(id);

create index if not exists ams_fly_scores_participant_idx
  on ams_fly_scores (participant_id);


-- Una cuenta Neon puede tener un solo piloto en AMS Fly.
create unique index if not exists ams_fly_participants_auth_user_uidx
  on ams_fly_participants (auth_user_id)
  where auth_user_id is not null;
