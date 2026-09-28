# Facturación y documentos · AMS

## Regla

Gestión → Documentos genera documentos comerciales y administrativos a partir de formularios especializados por tipo de documento y servicio. No es un sistema de facturación electrónica DIAN.

Cuando AMS esté obligada a facturar electrónicamente, debe utilizar un sistema habilitado y cumplir los requisitos aplicables.

## Antes de vender formalmente

Confirmar con contador:
- estado del RUT;
- responsabilidades tributarias;
- obligación de facturar;
- IVA, si corresponde;
- régimen tributario;
- numeración/requisitos del sistema de facturación;
- tratamiento de servicios a clientes del exterior;
- tratamiento de pagos en moneda extranjera.

La DIAN señala como requisitos previos para facturación electrónica, entre otros, RUT actualizado, acceso al correo registrado en RUT, firma/instrumento electrónico y un software de facturación electrónica. Fuente: https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/que-requieres-para-factura-electronicamente/

## Documento de cobro

Un documento interno debe identificar claramente:
- prestador;
- cliente;
- fecha;
- concepto;
- valor;
- moneda;
- condiciones;
- período;
- medio de pago;
- impuestos cuando correspondan.

No inventar:
- CUFE;
- QR DIAN;
- numeración fiscal;
- resolución;
- calidad tributaria.

## Clientes internacionales

La moneda y forma de pago se deben registrar según lo realmente pactado y recibido. Para el tratamiento tributario/cambiario concreto, consultar al contador.

## Propuestas

La propuesta aceptada debe dejar claros:
- alcance;
- entregables;
- precio;
- forma de pago;
- fechas;
- mantenimiento;
- dominios/hosting;
- cambios fuera de alcance;
- cancelación;
- soporte.

## Archivo

Conservar:
- briefing;
- propuesta aceptada;
- evidencias de aceptación;
- pagos;
- documentos;
- soportes;
- entregables;
- comunicaciones relevantes.


## Generador documental

Ruta: `/gestion/documentos/`

Cada documento tiene campos propios. El generador puede autocompletar clientes desde Operación/Suscripciones, reutilizar datos del prestador y aplicar plantillas base por servicio. El PDF final se construye con los datos introducidos para ese cliente y ese caso.
