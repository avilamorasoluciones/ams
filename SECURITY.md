# Seguridad de Avila Mora Soluciones

Este repositorio contiene código público destinado principalmente a GitHub Pages.

## Nunca subir
- contraseñas;
- API keys;
- tokens;
- claves privadas;
- credenciales de hosting;
- datos bancarios;
- datos personales de clientes que no deban ser públicos.

## Herramientas internas
Las herramientas internas publicadas en GitHub Pages no deben considerarse un sistema de seguridad real. El noindex y la protección JavaScript solo reducen exposición casual; no sustituyen autenticación de servidor.

Cuando Avila Mora Soluciones maneje información sensible o necesite acceso multiusuario/multidispositivo, migrar la operación a backend/base de datos con autenticación real.

## Datos personales
- Las rutas internas de Gestión se marcan como noindex y también se excluyen en robots.txt, pero esto **no constituye autenticación ni seguridad**.
- No guardar datos personales de clientes en el repositorio público.
- El briefing se gestiona en Microsoft Forms; conservar sus respuestas en el entorno autorizado y restringir el acceso.
- Mantener actualizada la Política de Privacidad cuando cambie el tipo de información que se recopila.
- Reportar incidentes de seguridad y limitar el acceso a la información afectada.

## Buenas prácticas
- Mantener 2FA en cuentas críticas.
- No compartir credenciales.
- Rotar secretos si existe exposición.
- Revisar permisos de terceros.
- Probar restauraciones de backups.
