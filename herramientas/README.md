# Herramientas — Avila Mora Soluciones

Colección de utilidades que funcionan directamente en el navegador.

## Principios

- Procesamiento local: los archivos seleccionados no se envían a un servidor de AMS.
- Compatible con GitHub Pages: HTML, CSS y JavaScript estáticos.
- Diseño alineado con la identidad visual de Avila Mora Soluciones.
- PWA con manifest + Service Worker para mejorar la carga y permitir caché del shell.
- Responsive para escritorio, tablet y celular.

## Herramientas actuales

15 herramientas: compresión/conversión de imágenes, recorte circular, herramientas PDF, minificador, QR, contraseñas y JSON.

## Importante

El Service Worker puede cachear la aplicación y recursos que ya hayan sido descargados, pero varias librerías dependen de CDN. Por eso algunas funciones no están garantizadas sin conexión en una primera instalación.

No se deben procesar aquí contraseñas reales, tarjetas, documentos extremadamente sensibles u otra información que no quieras manejar en un sitio público de GitHub Pages.