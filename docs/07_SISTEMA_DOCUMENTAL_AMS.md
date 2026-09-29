# Sistema documental Avila Mora Soluciones

El sistema documental vive dentro de **Gestión Avila Mora Soluciones** en:

- `/gestion/documentos/`

La entrada normal es `/gestion/` y existe un único acceso interno.

## Qué hace

El Centro Documental no usa un formulario único para todo. Cada tipo de documento tiene su propio formulario y su propia estructura de PDF.

El generador puede reutilizar:
- datos del responsable;
- correo y teléfono de Avila Mora Soluciones;
- datos del cliente maestro registrado en Gestión;
- dominio, URL, hosting y proyecto;
- una plantilla del servicio;
- valores y condiciones del caso concreto.

El mismo documento puede editarse antes de generar el PDF.

## Documentos realmente usados en Avila Mora Soluciones

1. Propuesta comercial / cotización.
2. Acta de entrega.
3. Comprobante de pago.
4. Ficha de cliente / proyecto interna.

No se incorporan módulos adicionales al sistema documental mientras no sean necesarios para la operación real.

## Plantillas de servicio

El generador incluye plantillas base para:
- Landing / web sencilla.
- Web empresarial.
- Tienda virtual + pedidos por WhatsApp.
- Aplicación web.
- Sistema a medida.
- Hosting / mantenimiento.
- Servicio personalizado.

La plantilla solamente propone alcance, entregables y tiempos de referencia. Los datos del cliente, servicio, precio, calendario, alcance final y condiciones se revisan en cada documento.

## Flujo

Gestión → Documentos → elegir tipo → seleccionar cliente → seleccionar servicio → completar los campos propios del documento → revisar PDF → generar/compartir → guardar el documento final.

## Datos

Los documentos y borradores se guardan localmente en el navegador de este dispositivo mediante `localStorage`. Esto permite operar sin backend, pero no sincroniza automáticamente entre computadores o celulares.

Los documentos consultan el cliente maestro y los datos de proyecto disponibles en Gestión.

## Firma y revisión

El acta incluye espacios para firma. El documento generado es una herramienta comercial/operativa y debe revisarse antes de entregar, especialmente cuando existan condiciones particulares sobre alcance, datos personales, propiedad de materiales o servicios de terceros.

## Alcance actual

El sistema documental existe para preparar PDFs profesionales y mantener orden en la relación con cada cliente. No pretende sustituir otras herramientas administrativas que Avila Mora Soluciones todavía no necesita.

## Evolución

Cuando Avila Mora Soluciones necesite operación multiusuario, multidispositivo o datos centralizados, migrar el mismo flujo a backend + autenticación real + base de datos, conservando las plantillas y la generación de PDF.
