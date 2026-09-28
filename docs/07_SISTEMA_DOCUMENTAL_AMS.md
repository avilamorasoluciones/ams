# Sistema documental AMS

El repositorio incluye un sistema local para preparar documentos administrativos y comerciales desde:

- `/suscripciones/documentos/`

## Documentos disponibles

1. Contrato de prestación de servicios
2. Cotización / propuesta comercial
3. Cuenta de cobro
4. Comprobante / recibo de pago
5. Ficha de cliente
6. Cierre mensual de AMS
7. Acta de entrega y aceptación
8. Ficha de datos del prestador

## Flujo

Elegir documento → llenar campos → seleccionar un cliente existente (si aplica) → guardar perfiles → revisar vista previa → exportar PDF o compartir.

## Datos y respaldo

Los datos del generador se guardan en `localStorage` del navegador del dispositivo. No es una base de datos multiusuario ni un sistema contable. Conviene mantener respaldos separados y no guardar contraseñas, secretos, tarjetas ni otra información que no sea necesaria.

El cierre mensual puede leer los movimientos registrados por `/finanzas/` mediante la clave local `ams_cash_v1`.

## Firmas

Contrato y acta incluyen espacios para firma de ambas partes. La plantilla debe revisarse y ajustarse al caso concreto antes de firmarla, especialmente cuando haya propiedad intelectual, tratamiento especial de datos, cláusulas de permanencia, penalidades, licencias o servicios de terceros.

## Facturación

La cuenta de cobro y los demás documentos comerciales no deben presentarse como factura electrónica cuando exista obligación legal de facturar. Este sistema no genera CUFE ni pretende sustituir un sistema de facturación electrónica habilitado.

## Evolución futura

Cuando AMS pase de uso local a operación con varios usuarios o clientes, este módulo puede migrarse a backend + autenticación + almacenamiento centralizado, conservando las mismas plantillas y PDF.
