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

Cada documento tiene un formulario diferente.

### Contrato
Se completa con servicio, alcance, entregables, fechas, valor inicial, valor recurrente, pagos, soporte, terceros, propiedad/licencia, confidencialidad, terminación, jurisdicción y cláusulas específicas.

### Cotización / propuesta
Se completa con servicio, alcance, entregables, tiempos y una tabla de conceptos con cantidades y valores, además de descuento, impuestos, forma de pago, vigencia y exclusiones.

### Cuenta de cobro
Se completa con periodo, concepto, valor, impuestos cuando correspondan, vencimiento y datos de pago.

### Recibo
Se completa con fecha del pago, valor recibido, método, referencia, periodo y concepto.

### Ficha de cliente
Resume datos de contacto, proyecto, servicio, dominio, URLs, infraestructura, alta, renovación y notas.

### Cierre mensual
Lee los movimientos de Caja AMS del periodo seleccionado y construye un resumen de ingresos, gastos, aportes, retiros y saldo neto.

### Acta de entrega
Se completa con entregables efectivamente entregados, pendientes, observaciones, correcciones/garantía y texto de aceptación.

### Ficha del prestador
Guarda los datos reutilizables de la persona que presta el servicio para no volver a escribirlos en cada documento.

El botón **Generar PDF** crea el archivo a partir de la vista previa actual. Antes de enviarlo, revisar los datos.

## 5. Calculadora

Ruta dentro de Gestión:
`/gestion/calculadora/`

Sirve para estimar precios de desarrollo y mensualidades. El resultado de la calculadora es una referencia comercial y debe reflejar el alcance real del proyecto.

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
Lead → Calificado → Propuesta → Aceptado → Pago pendiente → Producción → Revisión cliente → Entrega → Mantenimiento → Cerrado.

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