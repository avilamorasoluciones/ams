# AyuKcal — evolución con Supabase

La aplicación sigue alojada en GitHub Pages. Supabase aporta autenticación y almacenamiento cloud.

## Configuración única
1. Crea/abre tu proyecto en Supabase.
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Project Settings → API → copia:
   - Project URL
   - Publishable key (o anon key en proyectos antiguos)
4. Pégalos en `supabase/config.js`.
5. Supabase Auth → URL Configuration:
   - Site URL: la URL de GitHub Pages de AyuKcal.
   - Redirect URLs: la misma URL.
6. Authentication → Sign In / Providers → Email: habilitado.
7. En la configuración del proveedor Email, desactiva **Confirm Email** si quieres el acceso directo de AyuKcal sin verificación por correo. Supabase confirma automáticamente el email cuando esta opción está desactivada.
8. Publica los cambios de GitHub Pages.

> **Nota sobre el acceso:** Supabase Auth admite contraseña con email o teléfono; no ofrece usuario+contraseña puro. Por eso AyuKcal usa el correo como identificador de cuenta, pero con **Confirm Email desactivado** la persona no tiene que verificar ningún correo para entrar.

## Migración del JSON actual
Después de iniciar sesión, AyuKcal detecta el respaldo local `ayukcal_v8`. Si existe, muestra la opción de subirlo a la cuenta. El respaldo no se borra del navegador hasta confirmar la migración.

## Seguridad
La clave pública/publishable puede estar en el frontend. La clave service_role/secret NO debe estar nunca en GitHub.

## Modelo
La primera migración cloud conserva el estado completo de AyuKcal en un registro JSONB por usuario. Esto permite migrar sin romper la aplicación actual y deja lista la base para una normalización posterior.
