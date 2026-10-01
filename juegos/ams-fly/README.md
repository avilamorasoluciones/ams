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

## Ranking online

La versión actual **no envía datos a Internet**. El punto de integración para Neon queda deliberadamente separado para una segunda etapa. Para el ranking se recomienda enviar únicamente nombre, país, personaje, puntaje y fecha, con validaciones y límites anti-spam.

## Controles

- Móvil: tocar la pantalla.
- PC: clic, ESPACIO o flecha arriba.
- ESC: pausa.

Las ilustraciones de las aves se generan con CSS/Canvas; no dependen de imágenes externas.
