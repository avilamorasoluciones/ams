# Wompi y pagos · Avila Mora Soluciones

## Estado
Wompi todavía no está conectado. La integración se hará después de tener el dominio y el correo listos.

## Datos a tener a mano
- Titular de la cuenta [CONFIRMAR EN EL ALTA].
- Documento de identidad solicitado por Wompi.
- Cuenta de desembolso aceptada por Wompi.
- Correo de acceso.
- Teléfono.
- Descripción de la actividad.
- Datos que solicite Wompi para la modalidad elegida.

Wompi debe ser la fuente final para los requisitos del alta porque pueden variar según producto y modalidad.

Fuente de alta:
https://wompi.com/es/co/ayuda/como-crear-cuenta

## Arquitectura
Cliente
→ checkout Wompi
→ pago
→ backend Avila Mora Soluciones
→ webhook verificado
→ registro de pago
→ actualización de suscripción

GitHub Pages NO debe guardar secretos de Wompi.

## Estados mínimos
- iniciado
- aprobado
- rechazado
- cancelado
- pendiente
- reembolsado [cuando aplique]

## Para pagos recurrentes
Antes de publicarlo:
- confirmar que el producto/modalidad de Wompi permite el flujo requerido;
- obtener la autorización del cliente;
- almacenar solo identificadores necesarios;
- procesar eventos por backend;
- verificar la autenticidad de los eventos;
- registrar fecha, importe, moneda y referencia;
- actualizar la próxima renovación solo después de confirmar el resultado.

## Conciliación interna
Por cada pago guardar:
- fecha;
- cliente;
- importe;
- moneda;
- referencia;
- estado;
- identificador de Wompi;
- servicio/período;
- movimiento correspondiente en Gestión.

No guardar datos completos de tarjeta.

## Regla
La página pública solo debe mostrar la información necesaria para iniciar el pago. La lógica sensible vive en backend.
