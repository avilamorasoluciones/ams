# AMS Fly · Neon

AMS Fly está pensado para funcionar como **frontend estático en GitHub Pages**, usando Neon como backend gestionado:

`GitHub Pages → Neon Auth + Neon Data API → PostgreSQL`

No se necesita Coolify ni un servidor Node para el flujo normal del juego.

## Estado actual

En Neon `production` ya existen:

- `ams_fly_scores`
- `ams_fly_event_config`
- `ams_fly_participants`
- Neon Auth / Better Auth
- Usuario administrador configurado

## Archivos

- `schema.sql` — estructura inicial de las tablas.
- `rls-migration.sql` — políticas RLS y funciones necesarias para exponer las tablas de forma segura mediante Neon Data API.
- `server.js` — backend Express anterior; queda como referencia/alternativa y **no forma parte de la arquitectura GitHub Pages actual**.
- `package.json` — dependencias del backend anterior.

## Configuración de GitHub Pages

`juegos/ams-fly/neon-config.js` contiene únicamente URLs públicas:

- Neon Auth URL.
- Neon Data API URL.

Nunca colocar en ese archivo:

- `DATABASE_URL`
- contraseñas
- API keys
- tokens privados

El SDK oficial `@neondatabase/neon-js` se carga en el navegador y gestiona Auth + Data API. Neon documenta este flujo para aplicaciones browser/SPA y el uso de `allowAnonymous` para consultas públicas protegidas con RLS.

## Neon Data API

En Neon Console:

1. Branch: `production`.
2. Habilitar **Data API**.
3. Copiar la URL que termina en `/neondb/rest/v1`.
4. Pegar esa URL en `juegos/ams-fly/neon-config.js` como `dataApiUrl`.

La URL de Auth ya está configurada en ese archivo.

## RLS

Ejecutar **una sola vez** `rls-migration.sql` en SQL Editor de Neon `production`.

La intención es:

- Ranking: lectura pública.
- Puntuaciones: inserción pública validada por la base.
- Configuración del evento: lectura pública.
- Configuración del evento: modificación solo para administrador.
- Participantes: registro público mediante función controlada.
- Participantes: lectura únicamente para administrador.

El Data API usa JWT + RLS para aplicar estas reglas desde el navegador.

## Seguridad del ranking

El navegador todavía envía la puntuación, por lo que un usuario técnicamente puede manipular el cliente. Las restricciones SQL evitan datos fuera de rango y valores inválidos, pero **no convierten un juego JavaScript en un sistema anti-cheat**.

Si el premio depende de una puntuación, el récord ganador debe poder revisarse manualmente. Una fase posterior puede implementar validación/anti-cheat más fuerte.

## Flujo de administración

La gestión usa Neon Auth:

1. Usuario inicia sesión.
2. Neon Auth devuelve la sesión/JWT.
3. Neon Data API recibe el JWT.
4. RLS comprueba la autorización.
5. Solo el usuario con correo verificado y rol `admin` puede leer participantes o modificar el evento.

No existe un token administrativo escrito en el frontend.
