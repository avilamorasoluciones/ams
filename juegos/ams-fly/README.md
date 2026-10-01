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

El panel de gestión se abre desde el icono ⚙ del encabezado. La administración real utiliza un token de servidor; no se guarda ninguna contraseña administrativa dentro del código público.

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

La carpeta `neon/` contiene el esquema y un servidor Node/Express listo para desplegar en un servicio como Coolify. Las credenciales de Neon permanecen exclusivamente en variables de entorno del servidor.

La integración todavía necesita que se despliegue la API y se configure su URL pública en `EVENT_API`; no se debe poner `DATABASE_URL` en el frontend.

## Controles

- Móvil: tocar la pantalla.
- PC: clic, ESPACIO o flecha arriba.
- ESC: pausa.

Las ilustraciones de las aves se generan con CSS/Canvas; no dependen de imágenes externas.
