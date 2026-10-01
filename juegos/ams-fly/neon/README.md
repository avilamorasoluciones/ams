# Neon · AMS Fly

Esta carpeta contiene el esquema de PostgreSQL para el ranking mundial.

## Arquitectura segura

AMS Fly está publicado como frontend estático/PWA. Por eso no debe conectarse directamente a Neon: la cadena de conexión de Neon contiene credenciales y no puede estar en game.js.

La arquitectura prevista es:

AMS Fly (GitHub Pages) → HTTPS API → Neon PostgreSQL

El frontend ya tiene dos puntos de integración:

- GET RANKING_API?limit=50 para consultar el ranking.
- POST RANKING_API con { name, country, birdId, score, message } para publicar.

En game.js existe:

const RANKING_API = "";

Cuando exista el endpoint seguro, se coloca allí su URL pública HTTPS. La URL pública del endpoint sí puede estar en el frontend; las credenciales de Neon no.

## Tabla

Ejecuta schema.sql en el proyecto Neon.

## Respuesta esperada del GET

Puede ser un array de objetos con name, country, birdId, score, message; o un objeto { rows: [...] }.

## POST

El endpoint debe validar y guardar nombre, país, personaje, puntuación y mensaje, y devolver HTTP 200/201 cuando el registro sea correcto.

El juego no confía en la base de datos para el récord local: el récord local continúa funcionando aunque Neon esté caído.
