# Lanzamiento AMS · checklist final

## Mientras sigamos en GitHub Pages
- Mantener funcionales las URLs `avilamorasoluciones.github.io/ams/...`.
- No crear todavía `CNAME` ni forzar redirecciones.
- No subir secretos ni datos reales de clientes al repositorio.
- Mantener el dominio propio como destino preparado en el contenido.

## Cuando se compre y configure el dominio
1. Configurar `avilamorasoluciones.com` en GitHub Pages.
2. Crear el `CNAME` de GitHub Pages.
3. Verificar HTTPS.
4. Cambiar canonical/sitemap de GitHub Pages al dominio propio.
5. Mantener las rutas del repositorio funcionando y evaluar redirecciones solo después de verificar el dominio.
6. Configurar `equipo@avilamorasoluciones.com`.
7. Conectar Wompi y sus webhooks en un backend seguro.
8. Revisar los datos públicos del titular y de contacto.
9. Comprobar privacidad, términos y canales de atención con la operación real.
10. Activar funciones adicionales de comercio electrónico solo cuando realmente vayan a utilizarse.

## Pago y suscripciones
- No guardar llaves secretas de Wompi en GitHub Pages.
- El navegador solo recibe identificadores públicos necesarios.
- Las credenciales y webhooks deben vivir en backend/variables de entorno.
- Un pago aprobado debe actualizar la suscripción solo después de la verificación del servidor.
- Registrar en Gestión fecha, importe, moneda, cliente y referencia interna.

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
- precio y condiciones;
- medios de pago;
- condiciones de recurrencia cuando existan;
- atención a solicitudes y reclamos;
- privacidad y cookies actualizadas;
- derechos del consumidor que resulten aplicables.

No activar un checkout real únicamente porque exista un diseño de demostración.

## Infraestructura
GitHub Pages primero. Evaluar OVHcloud/Coolify cuando existan al menos dos clientes activos simultáneamente o el flujo real de operación lo justifique.

### Datos locales antes del cambio de dominio
Los módulos internos de Gestión AMS almacenan información en el navegador mediante `localStorage`. Ese almacenamiento pertenece al origen; al pasar de GitHub Pages a `avilamorasoluciones.com` no se copia automáticamente. Antes del cambio, usar **Respaldo completo** de Gestión y conservar los archivos JSON para restaurarlos en el dominio nuevo.
