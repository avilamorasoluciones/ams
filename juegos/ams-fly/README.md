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

1. Habilita Neon Auth y Data API en el branch que usa el juego.
2. Ejecuta `neon/schema.sql` y después `neon/rls-migration.sql` en Neon SQL Editor.
3. Crea una cuenta de jugador desde la sección **Cuenta** y verifica el correo si Neon lo solicita.

La migración se puede volver a ejecutar para reparar o actualizar políticas. `neon/server.js` es un servidor Express legado; el flujo publicado en GitHub Pages usa Neon directamente.

## Seguridad de puntajes

La base valida la cuenta del piloto, la vigencia del evento, los valores y la frecuencia de publicación. Como la partida se ejecuta en el navegador, el puntaje sigue necesitando revisión manual si entrega un premio real.

## Archivos legales

- terminos.html
- privacidad.html
