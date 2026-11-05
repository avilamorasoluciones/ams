# Wompi y pagos · Avila Mora Soluciones

## Estado actual
- AMS utiliza una cuenta Wompi activa registrada a nombre de una persona natural.
- El sitio público incluye un enlace de pago alojado por Wompi. El cliente completa el pago en la plataforma de Wompi.
- Este enlace permite recibir pagos puntuales; no significa que exista un checkout propio integrado al catálogo, una API conectada al sitio ni una automatización de suscripciones.
- La cuenta se utiliza para cobrar servicios de Avila Mora Soluciones. La marca comercial no se presenta como una sociedad independiente.
- El plan, las franquicias admitidas, los países, las tarifas, los plazos de desembolso y las retenciones deben comprobarse en el panel y las condiciones vigentes de Wompi. No prometer aceptación universal de todas las tarjetas o países.

## Modalidad de operación
1. AMS acuerda el servicio, valor, moneda y condiciones con el cliente.
2. Se comparte el enlace de pago de Wompi publicado en el sitio o un enlace específico cuando corresponda.
3. El cliente realiza el pago en el entorno alojado por Wompi.
4. AMS verifica el resultado en Wompi y registra el pago en Gestión → Finanzas.
5. Se conserva la referencia y el soporte de la transacción.

No registrar como pagado un pedido únicamente porque el cliente haya enviado una captura. Confirmar el estado en el panel o soporte de Wompi.

## Integración técnica pendiente
El repositorio no contiene una integración de backend propia para crear transacciones, recibir webhooks o confirmar automáticamente pagos. Si se implementa más adelante:
- las credenciales privadas deben vivir en backend/variables de entorno;
- no guardar llaves secretas en GitHub Pages;
- verificar la firma/autenticidad de cada evento recibido;
- procesar estados de forma idempotente;
- actualizar suscripciones solo después de validar el pago en servidor;
- registrar errores y permitir conciliación manual.

## Pagos internacionales
El propósito de Wompi para AMS incluye facilitar cobros con tarjetas Visa, Mastercard y otras franquicias que estén habilitadas en el plan y para el país del comprador. La aceptación depende de las reglas de Wompi, del emisor de la tarjeta y de controles antifraude; no debe anunciarse como garantía de que cualquier tarjeta o país será aceptado. Los cobros y desembolsos de AMS se gestionan en COP salvo que el producto contratado indique expresamente otra cosa. El banco emisor puede aplicar conversión de moneda o cargos propios.

## Conciliación interna
Por cada pago guardar en Gestión:
- fecha de pago y fecha de desembolso cuando estén disponibles;
- cliente y servicio/período;
- importe y moneda cobrados;
- comisión, retenciones y valor neto desembolsado, según el soporte de Wompi;
- referencia e identificador de transacción;
- estado final;
- movimiento correspondiente en Caja AMS.

Distinguir el valor cobrado al cliente, la comisión de Wompi, las retenciones y el valor neto recibido. Los movimientos entre cuentas propias, aportes y retiros no deben registrarse como ventas por el solo hecho de aparecer en una cuenta.

No almacenar números completos de tarjeta, CVV, PIN, claves ni credenciales bancarias. Wompi debe procesar los datos de tarjeta en su propio entorno.

## Fuentes y verificación
- Ayuda oficial de creación de cuenta: https://wompi.com/es/co/ayuda/como-crear-cuenta
- Tarifas y condiciones: consultar el plan vigente directamente en Wompi antes de cotizar o cambiar precios.

La página pública puede iniciar el pago mediante el enlace alojado por Wompi. La lógica sensible y cualquier automatización futura deben ejecutarse en un backend seguro.
