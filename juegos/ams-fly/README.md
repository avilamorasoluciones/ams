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

### Neon + API

La arquitectura es:

`AMS Fly → API HTTPS → Neon PostgreSQL`

La carpeta `neon/` contiene el esquema y un servidor Node/Express listo para desplegar en Coolify. Configura en el servicio `DATABASE_URL`, `NEON_AUTH_JWKS_URL` y `CORS_ORIGIN`. No pongas `DATABASE_URL` en el frontend.

Para conectar la aplicación, configura la URL pública de Neon Auth y la URL HTTPS de la API en `admin-auth.js`. Para habilitar ranking y sincronización del evento, configura también `EVENT_API` en `game.js`. Crea tu cuenta en Neon Auth, confirma el correo y asigna el rol `admin` antes de iniciar sesión. La API autoriza solo sesiones válidas de Neon con ese rol.

## Controles

- Móvil: tocar la pantalla.
- PC: clic, ESPACIO o flecha arriba.
- ESC: pausa.

Las ilustraciones de las aves se generan con CSS/Canvas; no dependen de imágenes externas.
