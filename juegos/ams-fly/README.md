# AMS Fly

Juego arcade independiente de Avila Mora Soluciones.

## Estructura

- `index.html`: interfaz y pantallas.
- `styles.css`: identidad visual responsive AMS.
- `game.js`: juego, personajes, dificultad, puntuación y LocalStorage.
- `manifest.webmanifest`: instalación PWA.
- `sw.js`: caché offline después de la primera carga.
- `icon.svg`: icono propio del juego.

## Datos guardados localmente

- Perfil: nombre, país y personaje.
- Récord personal.
- Partidas jugadas.
- Índice del dato colombiano mostrado entre partidas.
- Preferencia de sonido.

## Eventos y gestión

AMS Fly incluye una capa de gestión de eventos preparada para dos modos:

1. **Local:** permite probar la configuración del evento y los participantes en el propio dispositivo.
2. **Servidor:** si se configura `EVENT_API` en `game.js`, la aplicación sincroniza el evento y los participantes privados con la API incluida en `neon/`.

El panel de gestión se abre desde el icono ⚙ del encabezado y pide iniciar sesión con Neon Auth. La API verifica el JWT de Neon y exige que la cuenta tenga el rol `admin` y el correo confirmado. No se guarda ninguna contraseña ni token compartido en el código público.

### Datos del evento

- Evento activo/inactivo.
- Badge.
- Título y descripción.
- CTA.
- Premio.
- Condiciones.
- Plantilla de WhatsApp.
- Participantes privados y puntajes.
- Exportación local CSV.

### Neon + Data API (producción)

La versión actual usa directamente **Neon Auth + Neon Data API** desde el frontend estático de GitHub Pages. No se necesita el servidor Express legado para el flujo público.

- neon-config.js: contiene únicamente las URL públicas de Neon Auth y Data API.
- neon-client.js: crea el cliente Neon con acceso anónimo para las consultas públicas.
- neon/schema.sql: tablas de ranking, evento y participantes.
- neon/rls-migration.sql: RLS, políticas y permisos de los roles anonymous/authenticated.
- El ranking público lee ams_fly_scores.
- Publicar una puntuación inserta en ams_fly_scores.
- El registro del participante usa la función ams_fly_register_participant.
- La gestión exige sesión Neon Auth, correo confirmado y role = admin.

**Paso único después de crear las tablas:** ejecuta neon/rls-migration.sql completo en el SQL Editor del branch production. La migración es idempotente y debe ejecutarse también si ya habías ejecutado una versión anterior, porque incluye los GRANT necesarios para el Data API.

El servidor neon/server.js queda como referencia/legado y no es necesario para GitHub Pages.
## Controles

- Móvil: tocar la pantalla.
- PC: clic, ESPACIO o flecha arriba.
- ESC: pausa.

Las ilustraciones de las aves se generan con CSS/Canvas; no dependen de imágenes externas.
