# AMS Fly · Neon

AMS Fly publica su frontend estático desde GitHub Pages. La aplicación usa Neon Auth para las cuentas y Neon Data API con Row Level Security para ranking, evento y participantes.

## Configuración

- neon-config.js contiene la URL de Auth y la URL de Data API; ambas son públicas.
- No guardar DATABASE_URL, contraseñas, API keys ni tokens en el frontend o en GitHub.
- Ejecutar schema.sql y luego rls-migration.sql en el branch conectado a la aplicación.
- La migración incluye el acceso de lectura del ranking, RPC de registro y puntaje, funciones de aceptación de términos y autorización de administración.
- El acceso a participantes y los cambios de evento requieren un usuario autenticado cuyo rol sea admin y cuyo correo esté verificado.
- server.js y package.json corresponden al servidor Express anterior y no son necesarios para GitHub Pages.

## Crear la cuenta administradora

1. Crear una cuenta en Neon Auth y verificar su correo.
2. En Neon SQL Editor, reemplazar el correo de ejemplo por el correo exacto:

   UPDATE neon_auth."user" SET role = 'admin' WHERE lower(email) = lower('tu-correo@dominio.com') AND "emailVerified" = true;

3. Abrir AMS Fly y usar el icono de engranaje para iniciar sesión.
4. La pantalla llama ams_fly_is_admin() y las políticas RLS vuelven a comprobar el permiso en cada operación protegida.

Si la consulta afecta cero filas, revisa que el correo exista y esté verificado antes de asignar el rol. El juego público sigue disponible sin cuenta; la autenticación se necesita para registrar la participación y los puntajes del evento.

## Pruebas seguras

../diagnostico.html comprueba la configuración pública, la creación del cliente, la lectura del ranking, las RPC y la carga de archivos sin crear usuarios ni alterar participantes o puntajes.
