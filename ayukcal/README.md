# AyuKcal

Sistema de ayuno y nutrición para controlar ingesta de alimentos, agua, actividad, ayuno y peso.

## Arquitectura actual

- GitHub Pages: frontend estático.
- Supabase Free: autenticación y sincronización de datos por usuario.
- Open Food Facts: consulta gratuita de productos por código de barras.
- Tesseract.js: OCR local en el navegador para ayudar a leer etiquetas nutricionales.
- Sin IA de pago: AyuKcal no usa OpenAI ni ninguna API de IA de pago.
- Sin Edge Functions: el frontend no depende de funciones server-side.

## Funciones gratuitas de AyuKcal

- Registro y sincronización de comidas, agua, actividad, ayuno y peso.
- Perfil y cálculo de metas.
- Favoritos y alimentos frecuentes.
- Repetir comidas.
- Recetas caseras.
- Búsqueda por código de barras mediante Open Food Facts.
- Escaneo OCR local de etiquetas con revisión manual antes de guardar.
- Exportación e importación de respaldo.
- Interfaz responsive y ajuste de tamaño.

> El OCR es una ayuda, no una fuente definitiva: siempre revisa los valores detectados en la etiqueta antes de guardar un alimento.

## Configuración de Supabase

Consulta SUPABASE_SETUP.md.

La clave publishable/anon puede estar en el frontend cuando RLS está correctamente configurado. La clave secret/service_role nunca debe publicarse.