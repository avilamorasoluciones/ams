# Sistema documental AMS

El sistema documental vive dentro de **Gestión AMS** en:

- `/gestion/documentos/`

La entrada normal es `/gestion/` y existe un único acceso interno.

## Qué hace

El Centro Documental no usa un formulario único para todo. Cada tipo de documento tiene su propio formulario y su propia estructura de PDF.

El generador puede reutilizar:
- datos del prestador;
- correo y teléfono de AMS;
- datos del cliente maestro registrado en Gestión;
- dominio, URL, hosting y proyecto;
- una plantilla del servicio;
- valores y condiciones del caso concreto.

El mismo documento puede editarse antes de generar el PDF. Los datos variables no deben quedar congelados en una plantilla genérica.

## Documentos realmente usados en AMS

1. Propuesta comercial / cotización.
2. Acta de entrega.
3. Comprobante de pago.
4. Ficha de cliente / proyecto interna.

AMS no necesita por ahora un módulo fiscal, de facturación electrónica ni un contrato de prestación de servicios dentro de este sistema. Esos documentos no forman parte del flujo cotidiano de este emprendimiento.

## Plantillas de servicio

El generador incluye plantillas base para:
- Landing / web sencilla.
- Web empresarial.
- E-commerce.
- Aplicación web.
- Sistema a medida.
- Hosting / mantenimiento.
- Servicio personalizado.

La plantilla solamente propone alcance, entregables y tiempos de referencia. Los datos del cliente, servicio, precio, calendario, alcance final y condiciones se deben revisar en cada documento.

## Flujo

Gestión → Documentos → elegir tipo → seleccionar cliente → seleccionar servicio → completar los campos propios del documento → revisar PDF → generar/compartir → guardar el documento final.

## Datos

Los documentos y borradores se guardan localmente en el navegador de este dispositivo mediante `localStorage`. Eso permite operar sin backend, pero no sincroniza automáticamente entre computadores o celulares.

Los documentos consultan el cliente maestro y los datos de proyecto disponibles en Gestión. Todo sigue siendo local al origen del navegador; mientras no exista backend, no hay sincronización automática entre dispositivos.

## Firma y revisión

El acta incluye espacios para firma. El documento generado es una plantilla administrativa/comercial y debe revisarse antes de entregar, especialmente cuando existan condiciones particulares sobre alcance, datos personales, propiedad de materiales o servicios de terceros.

## Alcance actual

El sistema documental no pretende reemplazar un sistema fiscal o contable. Es una herramienta interna para preparar PDFs profesionales y mantener orden en la relación con cada cliente.

## Evolución

Cuando AMS necesite operación multiusuario, multidispositivo o datos centralizados, migrar el mismo flujo a backend + autenticación real + base de datos, conservando las plantillas y la generación de PDF.