# Lanzamiento AMS · checklist final

## Mientras sigamos en GitHub Pages
- Mantener funcionales las URLs `avilamorasoluciones.github.io/ams/...`.
- No crear todavía `CNAME` ni forzar redirecciones.
- No subir secretos ni datos reales de clientes al repositorio.
- Usar el dominio propio solo como destino preparado en el contenido.

## Cuando se compre y configure el dominio
1. Configurar `avilamorasoluciones.com` en GitHub Pages.
2. Crear el `CNAME` de GitHub Pages.
3. Verificar HTTPS.
4. Cambiar canonical/sitemap de GitHub Pages al dominio propio.
5. Mantener las rutas del repositorio funcionando y, después de verificar el dominio, evaluar redirecciones.
6. Configurar `equipo@avilamorasoluciones.com`.
7. Conectar Wompi y sus webhooks en un backend seguro.
8. Confirmar con contador la situación de facturación electrónica, IVA y demás obligaciones.
9. Revisar datos legales públicos del titular.
10. Activar el flujo de PQR/comercio electrónico requerido cuando exista venta directa online.

## Pago y suscripciones
- No guardar llaves secretas de Wompi en GitHub Pages.
- El navegador solo recibe identificadores públicos necesarios.
- Las credenciales y webhooks deben vivir en backend/variables de entorno.
- Un pago aprobado debe actualizar la suscripción solo después de la verificación del servidor.

## Correo
AMS publica `equipo@avilamorasoluciones.com`.
Los botones de correo ofrecen Gmail, Outlook y el cliente de correo predeterminado, con asunto y mensaje prellenados.

## Datos personales
- Mantener briefing y respuestas en el entorno autorizado.
- No pedir contraseñas, tarjetas completas, códigos MFA ni secretos.
- Para AyuKcal, mantener autorización e información específica para datos sensibles cuando corresponda.

## Comercio electrónico
Antes de activar un checkout público, revisar:
- identidad e información de contacto del proveedor;
- precio total y condiciones;
- condiciones de pago y recurrencia;
- PQR;
- retracto/reversión cuando corresponda;
- enlace visible a la SIC;
- privacidad y cookies actualizadas.

## Infraestructura
GitHub Pages primero. Evaluar OVHcloud/Coolify cuando existan al menos dos clientes activos simultáneamente o el flujo real de operación lo justifique.

### Datos locales antes del cambio de dominio

Los módulos internos de Gestión AMS almacenan información en el navegador mediante `localStorage`. Ese almacenamiento pertenece al origen; al pasar de GitHub Pages a `avilamorasoluciones.com` no se copia automáticamente. Antes del cambio, exportar los respaldos de Operación, Finanzas y Suscripciones y conservar los archivos JSON para restaurarlos en el dominio nuevo. Los borradores y perfiles de Gestión → Documentos se deben volver a guardar en el nuevo origen.
