# Política interna de planes y precios AMS
**Versión:** 1.0 · **Fecha de referencia:** 5 de noviembre de 2026

## 1. Modelo comercial

AMS no vende únicamente espacio de hosting. Vende:
1. **Desarrollo inicial:** pago único por diseñar, construir y entregar el alcance definido.
2. **Administración mensual:** hosting gestionado, dominio, conexión segura, copias programadas, mantenimiento y soporte dentro del plan.
3. **Ampliaciones:** nuevas funciones, integraciones y recursos que superen los límites se cotizan antes de ejecutarse.

La mensualidad no sustituye el precio de desarrollo. Un sitio puede ser sencillo de mantener pero necesitar trabajo inicial; un sistema con usuarios y bases de datos exige mayor administración.

## 2. Tarifas públicas fijas

| Plan | Desarrollo (una sola vez) | Administración mensual | Alcance resumido |
|---|---:|---:|---|
| Pequeño | COP $690.000 | COP $89.900 | Web de hasta 5 páginas, formulario, WhatsApp/redes y mini catálogo de hasta 20 productos |
| Mediano | COP $1.490.000 | COP $149.900 | Web de hasta 10 páginas y catálogo de hasta 50 productos con pedidos por WhatsApp |
| Grande | COP $3.490.000 | COP $299.900 | Aplicación web con base de datos, hasta 10 usuarios y 3 módulos |
| Personalizado | Desde COP $5.900.000 | Desde COP $499.900 | Sistemas que exceden límites o requieren integraciones/arquitectura especial |

El alcance público vigente está en la sección `#planes` de `index.html`. Esta política y la web deben mantenerse sincronizadas.

### 2.1 Equivalencia USD

- El precio contractual y de cobro al cliente colombiano permanece fijo en COP.
- La web muestra equivalencia USD informativa, no un segundo precio contractual.
- Tasa aplicada: TRM oficial diaria + COP $300 por USD como margen de conversión de AMS.
- Fuente primaria: dataset oficial TRM de datos.gov.co, suministrado por la Superintendencia Financiera: https://www.datos.gov.co/resource/mcec-87by.json
- Fecha de referencia de esta versión: 05/11/2026.
- TRM publicada para 05/11/2026: COP $3.221,19.
- Tasa usada para equivalencias: COP $3.521,19 por USD.
- La TRM es diaria, no una cotización de divisas segundo a segundo. La web consulta el dato oficial automáticamente y conserva la última tasa válida en caché. Si falla la consulta, los precios COP siguen visibles y el sitio informa que la equivalencia USD no pudo actualizarse.
- No modificar las cifras COP por cambios de TRM. Revisar los precios COP solo mediante decisión comercial de AMS.

Equivalencias de referencia al 05/11/2026:

| Plan | Desarrollo | Administración |
|---|---:|---:|
| Pequeño | ≈ US$195,96 | ≈ US$25,53/mes |
| Mediano | ≈ US$423,15 | ≈ US$42,57/mes |
| Grande | ≈ US$991,14 | ≈ US$85,17/mes |
| Personalizado | desde ≈ US$1.675,57 | desde ≈ US$141,97/mes |

No utilizar estas equivalencias históricas para facturar después; consultar la tasa que muestre la web al momento de preparar la propuesta.

## 3. Definición precisa de cada plan

### Pequeño

**Desarrollo incluido**
- Una landing o web informativa de hasta 5 páginas/secciones.
- Adaptación responsive a móvil, tablet y escritorio.
- Un formulario de contacto.
- Enlaces a WhatsApp y redes sociales.
- Configuración SEO inicial (títulos, descripciones, estructura semántica y sitemap cuando corresponda).
- Mini catálogo informativo de hasta 20 productos, con contacto o pedido directo a WhatsApp.

**Administración incluida**
- Un sitio y un dominio estándar .com administrado por AMS.
- Hasta 2 GB de archivos e imágenes.
- HTTPS/SSL.
- Copias de seguridad programadas.
- Mantenimiento técnico y soporte en días hábiles.
- Supervisión básica del sitio.

**No incluye:** carrito complejo, pagos en línea, inventario sincronizado, cuentas de usuario, panel administrativo, integraciones externas de pago ni desarrollo recurrente de nuevas funciones.

### Mediano

**Desarrollo incluido**
- Web de hasta 10 páginas/secciones.
- Catálogo informativo de hasta 50 productos, con carga inicial a partir del material entregado por el cliente.
- Categorías, búsqueda/filtros sencillos y resumen de pedido por WhatsApp.
- No incluye inventario automático, panel autónomo de productos, pagos en línea ni sincronización con caja/POS. Las actualizaciones recurrentes de catálogo se acuerdan y cotizan según su volumen.
- Formularios, enlaces de contacto, SEO inicial y analítica básica cuando aplique.
- Hasta 5 GB de archivos e imágenes.

**Administración incluida**
- Un sitio, un dominio estándar .com administrado por AMS.
- HTTPS/SSL.
- Copias de seguridad programadas.
- Mantenimiento técnico, revisión de funcionamiento y soporte en días hábiles.

**No incluye:** pagos en línea, sincronización automática con ERP/POS, inventario multibodega, cuentas de comprador, facturación electrónica, marketplace ni logística conectada. Esas funciones requieren un alcance de sistema personalizado.

### Grande

**Desarrollo incluido**
- Una aplicación web para un proceso de negocio concreto.
- Hasta 10 usuarios nominativos.
- Hasta 3 áreas de trabajo acordadas (por ejemplo: producción, inventario y reportes). Cada área corresponde a un proceso definido con formularios, consultas, operaciones y reportes básicos; no a un ERP ilimitado.
- Una base de datos independiente del cliente.
- Roles/permisos básicos.
- Panel, consultas y reportes dentro del alcance.
- Exportaciones sencillas a PDF/Excel cuando sean compatibles con el proceso acordado.
- Hasta 5 GB para archivos/documentos del sistema.

**Administración incluida**
- Un sistema y un dominio estándar .com administrado por AMS.
- Hosting de aplicación y base de datos.
- HTTPS/SSL.
- Copias de seguridad programadas.
- Mantenimiento técnico y soporte en días hábiles.
- Revisión básica de errores y capacidad.

**No incluye:** ERP completo, nómina, contabilidad certificada, app móvil nativa, múltiples bases de datos, integraciones bancarias, pasarela de pago, automatización compleja, más de 10 usuarios o más de 3 módulos. Eso pasa a Personalizado.

### Personalizado

Se usa cuando el proyecto supera los límites anteriores, necesita más usuarios, módulos, almacenamiento, integraciones, automatizaciones, pagos, procesos críticos, varias sedes o recursos especiales.

- Desarrollo desde COP $5.900.000.
- Administración desde COP $499.900/mes.
- No mostrar “ilimitado”.
- Cotizar después de identificar usuarios, módulos, datos, integraciones, concurrencia, almacenamiento, tráfico y nivel de soporte.
- La capacidad del servidor y el costo de servicios externos deben estar calculados antes de aceptar.

## 4. Qué incluye la administración mensual

Todos los planes administrados incluyen:
- Alojamiento gestionado por AMS.
- Registro y renovación de un dominio .com estándar nuevo a nombre del cliente, o gestión técnica de su dominio existente sin transferencia.
- Certificado HTTPS/SSL.
- Copias de seguridad programadas.
- Supervisión básica y mantenimiento técnico.
- Soporte por los canales y en los horarios hábiles definidos por AMS.
- Renovación de un dominio .com nuevo registrado por AMS, mientras el plan esté activo.

La mensualidad no representa recursos infinitos. La infraestructura se comparte con otros proyectos y AMS vigila uso de CPU, RAM, almacenamiento, bases de datos, tráfico y concurrencia.

## 5. Dominios y Porkbun

- Porkbun es el registrador preferido para nuevos dominios.
- El titular registral debe ser el cliente. AMS administra la configuración y renovaciones mediante accesos delegados o el mecanismo autorizado.
- Si el cliente ya tiene dominio, no se transfiere por defecto. AMS configura los registros DNS necesarios con autorización y conserva los registros de correo existentes.
- El plan contempla la gestión de un dominio .com estándar. Si el cliente utiliza una extensión de mayor costo (por ejemplo, .co), un dominio premium o varios dominios, AMS informa y cobra la diferencia antes de comprar/renovar.
- Como referencia consultada: Porkbun publica .com a US$11,08 por registro y renovación estándar; .co tiene precio promocional inicial y renovación estándar superior. Verificar el precio vigente en el carrito antes de registrar o renovar: https://porkbun.com/products/domains
- El correo corporativo no está incluido en la mensualidad. Google Workspace, Microsoft 365 u otro proveedor se contrata aparte.

## 6. Qué se cotiza aparte

No incluir automáticamente en ninguna mensualidad:
- Nuevas funcionalidades o cambios grandes de alcance.
- Rediseños completos.
- Carga masiva o migración compleja de información.
- Correos corporativos y licencias de terceros.
- Comisiones de Wompi u otras pasarelas.
- SMS, WhatsApp API, mapas, servicios de IA y APIs de pago.
- Dominios adicionales, extensiones premium o renovaciones que excedan el dominio .com contemplado.
- Almacenamiento, tráfico, concurrencia o recursos que excedan el uso razonable del plan.
- Atención 24/7 o SLA especial.

AMS debe informar cualquier costo externo antes de contratarlo. No añadir cargos sorpresa.

## 7. Cobro anual

- Mensual: 12 pagos del valor mensual.
- Anual anticipado: 11 mensualidades por 12 meses de servicio.
- El descuento anual aplica sobre la administración, no sobre el desarrollo inicial, salvo promoción escrita específica.
- No afirmar que hay débito automático si la pasarela o contrato no lo implementa.

## 8. Benchmarks competitivos (interno, no publicar como promesa)

Los precios de hosting puro suelen ser muy inferiores porque el cliente administra por su cuenta y el proveedor no desarrolla su solución:
- Hostinger Colombia muestra planes promocionales desde COP $4.900/mes con 48 meses pagados por adelantado y renovación superior (por ejemplo, Single: COP $17.900/mes); Cloud Startup muestra COP $25.900/mes promocional y COP $84.900/mes de renovación. Fuente: https://www.hostinger.com/co/precios
- HostGator Colombia muestra Personal desde COP $5.550/mes y Emprendedor desde COP $8.500/mes con plazo de 3 años. Fuente: https://www.hostgator.co/
- La captura de GoDaddy Colombia revisada por AMS mostró Inicial COP $6.999, Económico COP $7.499, Deluxe COP $19.999 y Ultimate COP $24.999/mes para el primer periodo de un año; condiciones y renovación deben comprobarse en checkout. Referencia pública: https://www.godaddy.com/es/hosting/web-hosting

Esos precios son hosting, no una comparación equivalente con desarrollo + hosting administrado + dominio + mantenimiento y soporte. No decir que AMS es más barato que un hosting puro; explicar que AMS resuelve y administra el proyecto para que el cliente no tenga que hacerlo.

## 9. Rentabilidad interna

- Presupuesto de referencia de infraestructura: OVH VPS-2 cotizado en US$8,50/mes; AMS reserva US$10/mes equivalente (US$120/año) para presupuesto.
- No afirmar que el servidor está activo hasta contratarlo y configurarlo.
- Evaluar la rentabilidad sobre todos los contratos recurrentes, no dividiendo arbitrariamente el VPS por cliente.
- No prometer número fijo de clientes por servidor. Medir consumo real de cada aplicación.
- Registrar ingresos mensuales recurrentes, dominio, licencias, respaldos, pasarela, VPS, otros costos fijos y margen.
- Antes de aceptar sistemas grandes, revisar CPU, RAM, almacenamiento, base de datos, concurrencia y respaldos.
- Si una carga necesita más recursos, proponer un plan personalizado o separar la aplicación en otro nodo.

## 10. Cambios de precios

- Los valores publicados en COP son los que controlan la oferta.
- No cambiar precios directamente por variación de dólar.
- Revisar trimestralmente costos de infraestructura, dominios, proveedores y carga de soporte.
- Documentar cualquier modificación y actualizar simultáneamente la web, este documento y las plantillas comerciales.
- Mantener una versión anterior del tarifario por trazabilidad.
