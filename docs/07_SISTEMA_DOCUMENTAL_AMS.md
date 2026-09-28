# Sistema documental AMS

El sistema documental vive dentro de **Gestión AMS** en:

- `/gestion/documentos/`

La entrada normal es `/gestion/` y existe un único acceso interno. Los módulos de Gestión no deben volver a pedir un segundo usuario o contraseña.

## Qué hace

El Centro Documental no usa un formulario único para todo. Cada tipo de documento tiene su propio formulario y su propia estructura de PDF.

El generador puede reutilizar:
- datos del prestador;
- correo y teléfono de AMS;
- datos de un cliente ya registrado en Operación o Suscripciones;
- dominio, URL, hosting y proyecto;
- una plantilla del servicio;
- valores y condiciones del caso concreto.

El mismo documento puede editarse antes de generar el PDF. Los datos variables no deben quedar congelados en una plantilla genérica.

## Documentos

1. Contrato de prestación de servicios.
2. Cotización / propuesta comercial.
3. Cuenta de cobro.
4. Comprobante / recibo de pago.
5. Ficha de cliente.
6. Cierre mensual de AMS.
7. Acta de entrega y aceptación.
8. Ficha de datos del prestador.

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

El sistema aprovecha las claves locales de Operación, Suscripciones y Finanzas cuando corresponde, por lo que todos esos módulos deben abrirse desde la misma instalación/origen de AMS.

## Firma y revisión

Contrato y acta incluyen espacios para firma. El documento generado es una plantilla administrativa/comercial y debe revisarse antes de firmar o entregar, especialmente cuando existan condiciones particulares sobre propiedad intelectual, datos personales, permanencia, penalidades, licencias, servicios de terceros o terminación.

## Facturación

La cuenta de cobro y los demás documentos comerciales no deben presentarse como factura electrónica si existe obligación legal de facturar. El generador no crea CUFE ni reemplaza un sistema de facturación electrónica habilitado.

## Evolución

Cuando AMS necesite operación multiusuario, multidispositivo o datos centralizados, migrar el mismo flujo a backend + autenticación real + base de datos, conservando las plantillas y la generación de PDF.