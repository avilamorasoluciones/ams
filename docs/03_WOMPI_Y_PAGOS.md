# Wompi y pagos · AMS

## Estado

Wompi todavía no está conectado. Esta etapa se hace después de tener el dominio y el correo listos.

## Datos a tener a mano

- Titular: Diego Andrés Avila Ríos [CONFIRMAR EN EL ALTA]
- Tipo: Persona natural, si Wompi valida esa modalidad.
- RUT actualizado.
- Documento de identidad.
- Cuenta de desembolso aceptada por Wompi.
- Correo de acceso.
- Teléfono.
- Descripción de la actividad.
- Datos comerciales que solicite Wompi.

Wompi debe ser la fuente final para los requisitos del alta. Las páginas de Wompi pueden variar por producto y modalidad.

Fuente de alta: https://wompi.com/es/co/ayuda/como-crear-cuenta

## Arquitectura

Cliente
→ checkout Wompi
→ pago
→ backend AMS
→ webhook verificado
→ registro de pago
→ actualización de suscripción
→ documento/registro interno

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
- registrar fecha e importe;
- actualizar la fecha de próxima renovación solo después de confirmar el resultado.

## Conciliación

Por cada pago guardar internamente:
- fecha;
- cliente;
- importe;
- moneda;
- referencia;
- estado;
- identificador de Wompi;
- servicio/período;
- documento relacionado.

No guardar datos completos de tarjeta.

## Contabilidad

El panel de Caja AMS es control de gestión. El contador debe definir cómo se reconocen los ingresos, costos, impuestos y documentos fiscales.

La tarifa pública vigente de Wompi debe verificarse en la página oficial antes de contratar porque puede cambiar.
