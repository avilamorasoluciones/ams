# AMS Fly

Juego arcade público de Avila Mora Soluciones, publicado como archivos estáticos desde GitHub Pages y conectado a Neon para eventos y ranking.

## Cómo se juega

- El juego puede iniciarse y jugarse sin crear una cuenta.
- Los récords personales y las partidas se guardan en el navegador.
- Para competir y publicar un puntaje durante un evento activo, el piloto debe iniciar sesión, completar sus datos y aceptar las condiciones del evento.
- Móvil: tocar la pantalla. PC: clic, barra espaciadora o flecha arriba. ESC pausa.

## Navegación

- Jugar: seleccionar ave, iniciar vuelo, pausar, continuar y volver al menú.
- Evento: muestra las condiciones cuando hay un evento activo y avisa cuando no hay uno abierto.
- Ranking: consulta el ranking público en Neon.
- Cuenta: login y datos del piloto para participar.

## Neon

El frontend usa URLs públicas de Neon Auth y Neon Data API. Nunca se debe publicar DATABASE_URL, contraseñas, claves privadas ni tokens en GitHub.

Archivos principales:

- neon-config.js: URLs públicas del proyecto.
- neon-client.js: cliente Neon Auth + Data API.
- neon/schema.sql: tablas del ranking, del evento y de participantes.
- neon/rls-migration.sql: funciones, permisos y Row Level Security.

### Preparación de Neon

1. Habilita Neon Auth y Data API en el branch que usa el juego y confirma que `public` está entre los esquemas expuestos por Data API.
2. Ejecuta `neon/schema.sql` y después `neon/rls-migration.sql` en Neon SQL Editor. Para reparar solo el ranking, ejecuta `neon/ranking-rpc-migration.sql`; define explícitamente `public.ams_fly_public_ranking()` sin parámetros y recarga la caché de esquema de PostgREST. Si Neon aún no reconoce la RPC, el juego usa como alternativa las columnas públicas de `ams_fly_scores`.
3. Comprueba en el SQL Editor, en el mismo branch y base de datos configurados en `neon-config.js`, que existe la firma usada por el cliente:

   ```sql
   select n.nspname as schema_name, p.proname as function_name,
          pg_get_function_identity_arguments(p.oid) as arguments,
          p.pronargs as argument_count
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'ams_fly_public_ranking';
   ```

   El resultado esperado es `public | ams_fly_public_ranking |  | 0`. El navegador invoca la función sin parámetros en el esquema expuesto `public`.
4. Crea una cuenta de jugador desde la sección **Cuenta** y verifica el correo si Neon lo solicita.

La migración se puede volver a ejecutar para reparar o actualizar políticas. `neon/server.js` es un servidor Express legado; el flujo publicado en GitHub Pages usa Neon directamente.

## Seguridad de puntajes

La base valida la cuenta del piloto, la vigencia del evento, los valores y la frecuencia de publicación. El RPC `ams_fly_public_ranking` devuelve solo los datos ya públicos del ranking; los perfiles privados de participantes no se consultan desde el navegador. Como la partida se ejecuta en el navegador, el puntaje sigue necesitando revisión manual si entrega un premio real.

Si aparece `could not find the function ... in the schema cache`, verifica primero el branch/base conectados y el esquema `public` expuesto en Neon; después ejecuta `neon/ranking-rpc-migration.sql` y confirma la firma con la consulta anterior. El SQL solo crea/reemplaza la función pública limitada y otorga ejecución a los roles de Data API; no publica perfiles ni cambia los datos de participantes.

## Archivos legales

- terminos.html
- privacidad.html
