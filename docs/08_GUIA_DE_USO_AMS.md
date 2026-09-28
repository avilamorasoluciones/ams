# Guía de uso de AMS

## 1. Entrada principal

Web pública:
- `https://avilamorasoluciones.github.io/ams/`
- futuro dominio: `https://avilamorasoluciones.com/`

Gestión interna:
- `/gestion/`

**Gestión es la única entrada para las herramientas internas.**

## 2. Acceso a Gestión

1. Abrir `/gestion/`.
2. Iniciar sesión.
3. Desde el menú entrar a Calculadora, Clientes/Suscripciones, Documentos, Finanzas u Operación.
4. No volver a introducir credenciales al cambiar de módulo.
5. Cerrar sesión desde la barra superior de Gestión.

La contraseña no debe copiarse a documentación pública ni almacenarse en texto plano. La protección actual del frontend es una barrera de uso interno, no autenticación de servidor.

## 3. Clientes y Suscripciones

Ruta dentro de Gestión:
`/gestion/suscripciones/`

Uso:
- Crear el cliente una sola vez.
- Guardar empresa, contacto, correo, teléfono, dominio, URL, infraestructura, precio, moneda, periodicidad, inicio y días de gracia.
- Revisar estados y próximos pagos.
- Exportar un respaldo JSON.
- Restaurar un respaldo cuando sea necesario.

Los datos quedan en el navegador del dispositivo.

## 4. Documentos

Ruta dentro de Gestión:
`/gestion/documentos/`

Cada documento tiene un formulario específico y el PDF se adapta al cliente y al servicio.

Documentos disponibles:
- **Propuesta comercial / cotización:** servicio, alcance, entregables, tiempos, conceptos, valores, vigencia y condiciones.
- **Acta de entrega:** entregables realizados, pendientes, observaciones, correcciones y aceptación.
- **Comprobante de pago:** fecha, valor, método, referencia, periodo y concepto.
- **Ficha de cliente / proyecto:** expediente interno para consultar y reutilizar datos.

El generador permite seleccionar el cliente existente, seleccionar una plantilla de servicio y completar solo lo particular del caso. Los datos conocidos del prestador también se reutilizan.

Por ahora AMS no necesita módulos de facturación, cuentas de cobro ni contratos de prestación de servicios para su operación cotidiana.

## 5. Calculadora

Ruta dentro de Gestión:
`/gestion/calculadora/`

Sirve para estimar precios de desarrollo y mensualidades. El resultado de la calculadora es una referencia comercial y debe reflejar el alcance real del proyecto. Los precios base actuales priorizan una relación precio/servicio competitiva, con dominio y alojamiento gestionados por AMS incluidos en la mensualidad. La referencia interna parte de un VPS-1 económico y una reserva por cliente; esos valores se pueden revisar desde Ajustes internos cuando cambien los costos reales.

## 5.1 Referencia de precios

Con tráfico bajo y soporte básico, la calculadora parte de esta escala interna: Landing $8/mes, Web empresarial $10, E-commerce $15, Aplicación web $20, Sistema a medida $25 y Sistema avanzado $32. El precio amigo parte de $5 y aumenta según la complejidad; el perfil de mayor demanda tiene una tarifa base algo superior. Soporte estándar agrega $2/mes y prioritario $5/mes. Tráfico alto o muy alto agrega una reserva. El plan anual equivale a 11 mensualidades y cubre 12 meses.

Los precios no muestran a los clientes el proveedor de dominio o infraestructura ni la estructura interna de costos. Los cambios de desarrollo, nuevas funciones y trabajos fuera de alcance se cotizan aparte.

## 6. Finanzas

Ruta dentro de Gestión:
`/gestion/finanzas/`

Registrar:
- ingresos;
- gastos;
- aportes;
- retiros;
- soportes y referencias.

Aporte no significa venta y retiro no significa gasto. Es control de gestión y no reemplaza la contabilidad fiscal.

## 7. Operación

Ruta dentro de Gestión:
`/gestion/operacion/`

Registrar cliente, proyecto, servicio, etapa, precio, dominio, staging, URL final, fecha objetivo, próximo paso y notas.

Etapas actuales:
Contacto inicial (Lead) → Calificado → Propuesta → Aceptado → Pago pendiente → Producción → Revisión cliente → Entrega → Mantenimiento → Cerrado.

**Contacto inicial (Lead)** significa simplemente que una persona o negocio acaba de llegar, preguntar o mostrar interés; todavía no es una venta.

## 8. Flujo recomendado

Formulario de proyecto → conversación/calificación → propuesta → aceptación → pago → alta en Operación → producción → revisión → entrega → documento correspondiente → registro financiero → Suscripción/mantenimiento.

## 9. Datos y respaldos

Las herramientas actuales usan almacenamiento local. Antes de cambiar de origen o equipo:
- respaldar Operación;
- respaldar Finanzas;
- respaldar Suscripciones;
- guardar los documentos generados;
- conservar los borradores/perfiles importantes.

Al pasar de GitHub Pages a `avilamorasoluciones.com`, el `localStorage` no se copia automáticamente porque pertenece al origen del navegador.

## 10. Seguridad

No guardar en estas herramientas:
- contraseñas;
- tokens;
- API keys;
- claves privadas;
- números completos de tarjetas;
- secretos de Wompi;
- credenciales de hosting.

Las pantallas internas de GitHub Pages y su contraseña JavaScript no constituyen seguridad de servidor. Para información sensible o varios usuarios, migrar a backend + autenticación real + base de datos.

## 11. Infraestructura prevista

- Porkbun: dominio.
- Zoho Mail: correo.
- GitHub: código y GitHub Pages.
- Google: Search Console.
- Wompi: pagos.
- OVHcloud: servidor.
- Coolify: despliegue y administración del servidor.