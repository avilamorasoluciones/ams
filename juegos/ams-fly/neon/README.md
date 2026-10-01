# AMS Fly · API + Neon

Esta carpeta contiene el backend opcional para convertir el ranking y la gestión de eventos en un servicio real.

## Arquitectura

`AMS Fly (GitHub Pages) → HTTPS API → Neon PostgreSQL`

El navegador **nunca** recibe `DATABASE_URL`.

## 1. Neon

Ejecuta `schema.sql` en tu proyecto Neon.

Crea estas tablas:

- `ams_fly_scores`: ranking público.
- `ams_fly_event_config`: configuración del evento activo.
- `ams_fly_participants`: datos privados de participantes, incluido WhatsApp.

## 2. Servidor

Esta carpeta incluye:

- `server.js`
- `package.json`
- `.env.example`

En un servidor Node/Coolify configura las variables:

- `DATABASE_URL`: cadena privada de Neon.
- `ADMIN_TOKEN`: secreto largo y aleatorio para administración.
- `CORS_ORIGIN`: dominio del frontend, por ejemplo `https://avilamorasoluciones.com`.
- `PORT`: normalmente lo proporciona Coolify.

Después:

```bash
npm install
npm start
```

## Endpoints

### Públicos

- `GET /health`
- `GET /event`
- `GET /ranking?limit=50`
- `POST /ranking`
- `POST /participants`

### Administrativos

Requieren:

`Authorization: Bearer TU_ADMIN_TOKEN`

- `PUT /event`
- `GET /participants`

## 3. Conectar el juego

En `game.js`:

```js
const EVENT_API = "https://api.tu-dominio.com";
```

Al definirlo, AMS Fly utiliza automáticamente:

- `EVENT_API/event`
- `EVENT_API/ranking`
- `EVENT_API/participants`

El frontend conserva un respaldo local si el servidor no está disponible.

## Seguridad

- `DATABASE_URL` solo existe en el servidor.
- El token administrativo solo se guarda temporalmente en `sessionStorage`.
- WhatsApp está separado de la tabla pública del ranking.
- Los campos reciben límites de longitud y listas permitidas de países/aves.
- No se acepta `created_at` desde el navegador.
- El ranking público nunca devuelve teléfonos.

### Importante sobre concursos

El servidor valida el formato de la puntuación, pero un juego ejecutado en el navegador no puede demostrar por sí solo que un puntaje sea legítimo. Para un premio real conviene tratar el ranking como registro de participación y revisar manualmente el récord ganador o implementar posteriormente un sistema anti-cheat más fuerte.
