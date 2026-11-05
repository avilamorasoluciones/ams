# Lanzamiento AMS · checklist final

## Estado actual del sitio y dominio
- El sitio público está publicado en `https://avilamorasoluciones.com/` mediante GitHub Pages.
- El dominio, DNS, CNAME y HTTPS ya están configurados.
- La URL heredada `avilamorasoluciones.github.io/ams/...` se conserva para compatibilidad.
- No subir secretos ni datos privados de clientes al repositorio.

## Pendientes reales
1. Confirmar que el buzón `equipo@avilamorasoluciones.com` está creado y recibe/envía correctamente; la dirección está publicada, pero eso no confirma el estado del servicio de correo.
2. Mantener actualizados los datos de identificación y contacto del titular en los documentos y avisos que correspondan.
3. Revisar privacidad, términos y canales de atención frente a la operación real.
4. Mantener la cuenta Wompi activa y revisar periódicamente sus condiciones y cuenta de desembolso.
5. Implementar un backend seguro con webhooks solo si se requiere automatizar la confirmación de pagos o las suscripciones.
6. Activar funciones adicionales de comercio electrónico solo cuando realmente vayan a utilizarse.

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
