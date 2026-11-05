# Manual Operativo — Avila Mora Soluciones (AMS)
**Actualizado:** 5 de noviembre de 2026

## 1. Estado y fuente de verdad

- Web pública: https://avilamorasoluciones.com/
- Repositorio: https://github.com/avilamorasoluciones/ams
- Gestión interna: https://avilamorasoluciones.com/gestion/
- La web pública y las demos estáticas se publican mediante GitHub Pages.
- Gestión AMS conserva almacenamiento local del navegador. No sincroniza automáticamente entre PC y móvil.
- AMS tiene un entorno Hetzner/Coolify referido para operación de clientes. Antes de comprar otro servidor, verificar CPU, RAM, disco, cargas y compromisos existentes.
- OVH VPS-2 es una opción de ampliación/infraestructura propia considerada, no debe afirmarse como servidor de producción activo hasta contratarlo, configurarlo y probarlo.
- La arquitectura de despliegue objetivo es GitHub + pruebas en GitHub Actions + Coolify en un VPS + bases de datos aisladas. No instalar CloudPanel y Coolify simultáneamente en el mismo servidor.

Documentos fuente:
- `AGENTS.md`: reglas permanentes de desarrollo y operación.
- `PROMPT_MAESTRO_ANTIGRAVITY_AMS.md`: prompt reutilizable para construir proyectos.
- `POLITICA_PLANES_Y_PRECIOS.md`: alcance y tarifas públicas.
- `LANZAMIENTO.md`: checklist de puesta en marcha.

La sección `#planes` de la web y `POLITICA_PLANES_Y_PRECIOS.md` deben coincidir. El cotizador interno antiguo no es la fuente de precios públicos; no usarlo para sustituir el tarifario.

## 2. Modelo comercial AMS

AMS ofrece una solución completa, no solo espacio de hosting:
1. Desarrollo inicial, cobrado una sola vez.
2. Administración mensual, que cubre alojamiento gestionado, dominio estándar .com, conexión segura, copias programadas, mantenimiento y soporte del plan.
3. Ampliaciones y servicios de terceros, cotizados por separado.

La propuesta debe describir qué incluye el alcance, los límites, el precio inicial, la mensualidad, la renovación y las exclusiones.

El cliente no debe tener que administrar paneles técnicos, servidores, DNS ni bases de datos en el uso diario. AMS gestiona esa parte.

## 3. Planes públicos

| Plan | Desarrollo | Administración |
|---|---:|---:|
| Pequeño | COP $690.000 | COP $89.900/mes |
| Mediano | COP $1.490.000 | COP $149.900/mes |
| Grande | COP $3.490.000 | COP $299.900/mes |
| Personalizado | Desde COP $5.900.000 | Desde COP $499.900/mes |

Alcances:
- Pequeño: web de hasta 5 páginas, formulario, WhatsApp/redes, SEO inicial y mini catálogo de hasta 20 productos.
- Mediano: web de hasta 10 páginas, catálogo de hasta 50 productos y pedidos por WhatsApp. No incluye pasarela de pago ni inventario sincronizado.
- Grande: aplicación web con una base de datos, hasta 10 usuarios nominativos y 3 módulos definidos.
- Personalizado: más usuarios/módulos, integraciones, pagos, automatizaciones, recursos especiales o procesos más complejos.

La administración de cada plan incluye un dominio .com estándar mientras el plan esté activo, alojamiento, HTTPS/SSL, copias programadas, mantenimiento y soporte en días hábiles. El correo corporativo, las comisiones de pago y las licencias de terceros no están incluidos.

Pago anual anticipado: 11 mensualidades por 12 meses de servicio. El desarrollo inicial se cobra aparte.

Consultar límites y exclusiones completos en `POLITICA_PLANES_Y_PRECIOS.md`.

## 4. Dominio y Porkbun

- Porkbun es el registrador preferido para dominios nuevos.
- El titular del dominio es siempre el cliente. AMS administra técnicamente con autorización.
- Si el cliente ya tiene dominio, no transferirlo por defecto. Configurar los registros DNS necesarios y conservar MX/SPF/DKIM/DMARC del correo existente.
- Si el cliente requiere dominio nuevo, registrar el dominio a nombre del cliente mediante Porkbun.
- El plan contempla un dominio .com estándar. Extensiones más costosas, premium o adicionales se cotizan por la diferencia y se autorizan antes de comprar.
- No publicar API keys de Porkbun ni solicitar contraseñas por WhatsApp o formularios.
- El correo con dominio es un producto aparte. Tener dominio no incluye automáticamente buzones.

## 5. Flujo de trabajo de cada cliente

1. Contacto por web, WhatsApp o recomendación.
2. Briefing: entender negocio, problema, usuarios y procesos.
3. Definir alcance y plan AMS (o Personalizado).
4. Propuesta: separar desarrollo inicial, administración y servicios extra.
5. Aceptación y pago según acuerdo.
6. Crear repositorio independiente del cliente en GitHub.
7. Construir prototipo local con Antigravity, Bootstrap CDN, CSS propio y JavaScript.
8. Probar con datos ficticios; abrir con doble clic en `index.html`.
9. Publicar preview estático por GitHub Pages cuando el contenido pueda ser público; si no, usar staging protegido.
10. Mostrar al cliente y corregir dentro del alcance.
11. Con aprobación, preparar backend/base de datos si el proyecto lo necesita.
12. Probar integración real en staging con datos de prueba.
13. Autorizar despliegue a producción.
14. Conectar dominio, HTTPS, respaldos y monitoreo.
15. Entregar instrucciones de uso y registrar mantenimiento/renovación.

## 6. Prompt y reglas de desarrollo

- Antigravity construye el prototipo local.
- El prompt reutilizable está en `PROMPT_MAESTRO_ANTIGRAVITY_AMS.md`.
- `AGENTS.md` define reglas permanentes que deben respetarse en cada repositorio.
- Bootstrap 5.3.8 por CDN oficial, CSS personalizado y JavaScript Vanilla son el estándar.
- Se permiten librerías de animación, carruseles o gráficas por CDN cuando aporten valor y estén justificadas.
- No cargar Bootstrap ni librerías en el repositorio.
- El prototipo local funciona con scripts clásicos y datos ficticios; no necesita Node/Python/Docker local.
- No fingir que localStorage es una base central. No incluir datos reales en demos.

## 7. GitHub, demos y ramas

GitHub es la fuente oficial del código y su historial.

- Cada cliente tiene su propio repositorio privado.
- No almacenar secretos, .env real, bases de datos reales ni backups de producción.
- Los commits deben ser descriptivos.
- No crear PR por rutina para cambios AMS si el responsable trabaja directamente en `main`; respetar las instrucciones específicas del proyecto.
- GitHub Pages solo sirve frontend estático. No ejecuta Express ni bases de datos.
- Pages debe usar datos ficticios y se considera público, aunque el repositorio fuente sea privado, salvo modalidad de acceso privado compatible con el plan de GitHub.
- Si el código o contenido debe permanecer restringido, usar staging protegido.
- Mantener demo y producción separadas. Un commit de prueba no debe publicar automáticamente a la web real.
- Producción se actualiza solo mediante promoción aprobada.

## 8. Arquitectura de producción

Arquitectura objetivo:
- VPS (Hetzner existente si tiene capacidad o nuevo OVH VPS-2 cuando se justifique).
- Coolify como panel único de despliegue.
- GitHub y GitHub Actions para código/pruebas.
- Node.js LTS + Express cuando exista API.
- MariaDB/MySQL como base de datos estándar.
- PostgreSQL solo cuando exista justificación técnica.
- HTTPS y proxy gestionado por Coolify.

Reglas:
- No instalar CloudPanel y Coolify en el mismo VPS para administrar el mismo proxy/servicios.
- Landing/web estática no necesita backend.
- Catálogo WhatsApp puede ser estático si no requiere inventario o cuentas.
- Sistemas con usuarios, roles, información compartida, historial, pagos o sincronización requieren API y base persistente.
- Una base de datos y credenciales independientes por cliente como estándar.
- No abrir públicamente el puerto de base de datos.
- No usar root para despliegues.
- Variables de entorno fuera del repositorio.
- Backups externos y prueba de restauración.
- Desplegar código sin borrar volúmenes ni datos persistentes.
- Tener rollback antes de un cambio importante.

## 9. Capacidad y rentabilidad del servidor

- El VPS-2 de OVH fue consultado a US$8,50/mes; AMS presupuesta US$10/mes equivalente (US$120/año) para planificación.
- Antes de comprarlo, medir si el Hetzner ya disponible puede alojar el piloto sin comprometer otros proyectos.
- No vender “50 clientes garantizados” ni asociar cantidad fija de sitios a un VPS sin medición.
- La capacidad depende de CPU, RAM, disco, procesos, base de datos, almacenamiento, visitas, concurrencia y comportamiento de cada aplicación.
- Medir recursos por proyecto y dejar margen de seguridad.
- Los sistemas de alto uso se revisan y cotizan como Personalizado o en infraestructura separada.
- La rentabilidad se mide sobre ingresos recurrentes totales menos VPS, dominios, backups, pasarela, licencias y operación. No cambiar la tarifa individual por alterar una cantidad hipotética de clientes.

## 10. USD/COP en la web

- Precios contractuales fijos en COP.
- Equivalencias USD informativas, usando la TRM oficial diaria del dataset mcec-87by más COP $300/USD de margen AMS.
- La tasa oficial se actualiza diariamente; no presentarla como mercado en vivo por segundo.
- Mostrar fecha de vigencia y fuente.
- Si falla la consulta, conservar última tasa válida en caché y no ocultar los precios COP.

## 11. Pagos e integraciones

Wompi:
- No guardar llaves privadas en GitHub ni frontend.
- Confirmar el pago desde panel/API/webhook del proveedor.
- Verificar firma y procesar eventos de forma idempotente.
- No marcar pagado por captura del cliente o redirección del navegador.
- Registrar valor, moneda, comisión, referencia y desembolso neto disponible.

WhatsApp:
- Enlace oficial para contacto simple.
- Automatizaciones solo mediante plataforma oficial y backend.

Bancolombia:
- Usar únicamente métodos autorizados.
- No automatizar accesos de banca personal.

Servicios externos:
- Informar costos y renovaciones antes de contratar.

## 12. Gestión interna, finanzas y datos

- Gestión AMS vive en `/gestion/`.
- Los módulos internos actuales usan localStorage y pertenecen al navegador/origen; no sincronizan automáticamente entre dispositivos.
- Mantener respaldo completo periódico.
- No cambiar esquemas ni datos de clientes al actualizar la aplicación.
- Caja AMS es control interno: ingreso, gasto, aporte y retiro son conceptos separados.
- Aportes no son ventas; retiros no son gastos.
- Registrar comisiones, retenciones y desembolso neto de Wompi por separado cuando estén disponibles.

## 13. Checklist antes de entregar a un cliente

- Alcance y plan aprobado.
- Desarrollo inicial cobrado según acuerdo.
- Mensualidad y dominio explicados.
- Móvil, tablet y escritorio revisados.
- Formularios, cálculos y enlaces probados.
- Datos de demostración retirados de producción.
- Usuarios y permisos revisados.
- HTTPS activo.
- DNS y correo preservados.
- Backups configurados y restauración considerada.
- Staging aprobado.
- Producción autorizada.
- Instrucciones de uso entregadas.
- Próxima renovación registrada.

## 14. Principio operativo

AMS debe encargarse de la complejidad técnica para que el cliente use su web o sistema sin administrar servidores, paneles, DNS ni bases de datos. La tecnología se mantiene simple por dentro, pero la seguridad y la continuidad no se improvisan.
