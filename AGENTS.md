# AGENTS.md — Estándares permanentes de Avila Mora Soluciones (AMS)

Este archivo es la fuente de reglas técnicas y operativas para cualquier IA o desarrollador que trabaje dentro del repositorio AMS o en un proyecto de cliente creado bajo la metodología AMS.

## 1. Principios no negociables

1. Entregar soluciones funcionales, mantenibles, seguras y económicas de operar.
2. Resolver el problema del cliente sin añadir complejidad tecnológica innecesaria.
3. No inventar pruebas, capacidades, integraciones, niveles de servicio ni garantías.
4. No borrar, sobrescribir o migrar datos existentes sin respaldo y autorización.
5. No publicar a producción sin aprobación expresa de AMS.
6. No exponer secretos, datos reales de clientes ni información privada en GitHub, GitHub Pages, demos, capturas o logs.
7. Mantener el código fácil de revisar y modificar desde GitHub.
8. Conservar la lógica de negocio existente al hacer mantenimiento. Primero inspeccionar; después modificar.

## 2. Stack frontend estándar AMS

- HTML5 semántico.
- Bootstrap 5.3.8 mediante CDN oficial jsDelivr.
- CSS personalizado del proyecto, cargado después de Bootstrap.
- JavaScript Vanilla para la lógica principal.
- Librerías especializadas mediante CDN solo cuando aporten valor real: carruseles, animación, gráficas, calendarios, alertas e iconos.
- No cargar varias librerías para resolver la misma función.
- No combinar Bootstrap con Tailwind.
- No usar jQuery.
- No añadir React, Vue, Angular, Next.js u otros frameworks de aplicación salvo justificación técnica escrita y autorización de AMS.

### CDN y seguridad de dependencias

- Fijar versiones exactas; nunca usar `latest`, `@latest` ni URLs flotantes.
- Utilizar los enlaces y hashes SRI publicados por el proveedor cuando estén disponibles.
- Mantener los hashes SRI sincronizados con la versión exacta.
- Cargar CSS de Bootstrap antes de `styles.css`.
- Cargar scripts con `defer` cuando sea adecuado.
- No depender de que el navegador tenga una copia previa en caché.
- Diseñar con degradación razonable: si una animación o librería secundaria no carga, la función principal debe seguir siendo utilizable.
- No prometer carga instantánea en conexiones lentas. Optimizar imágenes, fuentes, JavaScript y cantidad de solicitudes.

Referencia CDN fijada al crear esta guía:
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
      crossorigin="anonymous">
<link rel="stylesheet" href="styles.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous" defer></script>
<script src="app.js" defer></script>
```

## 3. Estructura preferida del frontend

Mantener el proyecto compacto cuando sea posible:

```text
cliente/
├── AGENTS.md
├── README.md
├── index.html
├── styles.css
├── app.js
├── config.js
└── assets/
```

- Los archivos principales permanecen en la raíz si el tamaño del proyecto lo permite.
- Crear carpetas adicionales únicamente cuando haya una razón real.
- Los recursos CDN no se copian al repositorio.
- No crear archivos vacíos, versiones duplicadas, código muerto ni archivos temporales.
- Los proyectos más grandes pueden separar JS/CSS por módulos, sin fragmentar por fragmentar.

## 4. Modo local: doble clic en index.html

La primera entrega debe poder abrirse directamente con doble clic en `index.html` en Windows, usando el navegador y conexión a Internet, sin instalar Node, Python, Flask, Docker, bases de datos ni extensiones.

Para mantener compatibilidad con `file://`:

- Preferir scripts clásicos y rutas relativas.
- No utilizar módulos ES como requisito del prototipo.
- No depender de `fetch()` para leer JSON locales.
- No depender de service workers, cookies seguras o funciones que exijan HTTPS en la fase local.
- Incluir datos ficticios dentro del código de demostración o en estructuras JavaScript.
- `localStorage` es solo persistencia de demostración; su comportamiento bajo `file://` puede variar por navegador.
- Detectar y explicar las limitaciones del navegador sin romper la navegación.
- No cargar datos personales, contraseñas ni credenciales reales en demos.

La demo debe parecer funcional y permitir probar flujos completos con datos ficticios. No debe fingir que existe una base de datos central, autenticación real o sincronización entre dispositivos.

## 5. Separación entre demo y producción desde el comienzo

Cada proyecto debe separar interfaz, reglas de negocio y persistencia.

Patrón recomendado:
- `DemoProvider`: datos ficticios y almacenamiento local para pruebas.
- `ApiProvider`: solicitudes HTTP a la API real cuando se habilite producción.

La interfaz debe llamar a operaciones de datos como `listarRegistros()`, `crearRegistro()`, `actualizarRegistro()` y `eliminarRegistro()`, no acceder directamente a localStorage desde todos los componentes.

Cuando se apruebe producción:
- Reutilizar la misma interfaz y los mismos componentes.
- Sustituir el proveedor de datos de demo por el proveedor API.
- No reconstruir el frontend desde cero.
- No trasladar los datos ficticios a producción.
- Crear migraciones y datos iniciales de producción de forma controlada.

## 6. GitHub, demos y repositorios

- Cada cliente tiene un repositorio independiente, preferiblemente privado.
- GitHub es la fuente de verdad del código.
- Los commits deben ser descriptivos.
- No guardar archivos .env reales, llaves, tokens, contraseñas, bases de datos, respaldos ni datos privados.
- Mantener `.gitignore`, `README.md` y `AGENTS.md`.
- No editar un proyecto sin inspeccionar primero su estado actual.
- En el repositorio AMS, trabajar directamente sobre `main` cuando el responsable lo solicite o sea la práctica establecida; no crear PR por rutina.
- En proyectos de clientes, preservar la rama y flujo aprobados.

### GitHub Pages

GitHub Pages sirve únicamente frontend estático:
- Demos con información ficticia.
- No contiene Express, bases de datos ni secretos.
- No se usa para autenticar usuarios reales ni para guardar información privada.

Una publicación de Pages no debe considerarse privada solo porque el repositorio fuente sea privado. Antes de compartir un preview, confirmar que su contenido puede ser público. Cuando el proyecto, el código o la información deban mantenerse restringidos, utilizar un staging protegido en infraestructura controlada.

## 7. Arquitectura de producción AMS

Arquitectura objetivo, sujeta a activación y pruebas reales:

- OVHcloud VPS como infraestructura.
- Coolify como panel único de despliegue y administración de aplicaciones.
- GitHub como repositorio y control de versiones.
- GitHub Actions para pruebas automatizadas.
- Nginx/HTTPS gestionado por el panel.
- Node.js LTS + Express para APIs cuando el proyecto lo requiera.
- MariaDB/MySQL como base de datos estándar.
- Porkbun para registro de dominios y DNS, conservando al cliente como titular.

No instalar CloudPanel y Coolify simultáneamente para administrar el mismo servidor. Elegir un único panel para evitar conflictos de puertos, proxy y servicios.

La arquitectura anterior es el destino técnico propuesto; no afirmar que OVH, Coolify, backups externos o automatizaciones están en producción hasta que hayan sido contratados, configurados y probados.

### No todos los proyectos necesitan backend

- Landing o sitio informativo estático: puede publicarse sin backend.
- Catálogo y pedidos por WhatsApp: puede funcionar como frontend estático si no necesita inventario compartido ni cuentas.
- Sistema con usuarios, roles, registros compartidos, historial, pagos o sincronización: necesita API y almacenamiento persistente del lado del servidor.
- El uso de base de datos se decide por requisitos, no por moda.

### Backend

Cuando aplique:
- Node.js LTS compatible con el entorno de producción.
- Express.js.
- API REST con validación de esquema.
- Helmet, rate limiting, CORS restrictivo, gestión de sesiones y errores.
- Consultas SQL parametrizadas o ORM seguro.
- Variables de entorno en servidor.
- Nunca exponer credenciales ni claves privadas en JavaScript público.

### Base de datos

- Preferir MariaDB/MySQL en la infraestructura estándar AMS.
- Una base de datos por cliente y credenciales propias, cuando la arquitectura lo permita.
- Usuario de aplicación con privilegios mínimos.
- Puerto de base de datos no expuesto públicamente.
- Migraciones versionadas, índices, restricciones, backups y pruebas de restauración.
- PostgreSQL solo cuando exista una necesidad real y se apruebe la arquitectura.
- Nunca guardar bases o backups de producción en GitHub.

## 8. Seguridad

Ningún sistema es “inhackeable”. Describir controles y riesgos residuales.

### Frontend
- No guardar secretos, contraseñas ni tokens de autenticación en localStorage/sessionStorage.
- Validar entradas visualmente, pero no confiar en esa validación.
- Evitar XSS: preferir textContent, sanitizar HTML no confiable.
- Validar tipos y tamaños de archivos.
- No exponer información sensible en mensajes de error.

### Backend
- Autenticación y autorización reales en servidor.
- Contraseñas con Argon2id u otro algoritmo seguro vigente.
- Cookies HttpOnly, Secure y SameSite apropiadas.
- Protección CSRF cuando aplique.
- Validación en cada endpoint.
- Consultas parametrizadas.
- Rate limiting, especialmente en login y recuperación de contraseña.
- Control de permisos por usuario y registro.
- No revelar stack traces, secretos ni rutas internas.

### Infraestructura
- HTTPS obligatorio.
- SSH con llaves, sin acceso root desde despliegues.
- Accesos administrativos restringidos.
- Secrets fuera del repositorio y del directorio público.
- Separación de ambientes demo, staging y producción.
- Backups fuera del mismo servidor y restauración probada.
- Monitorización y alertas antes de ampliar la cartera.

## 9. Dominios y Porkbun

- El cliente conserva la titularidad de su dominio.
- Si ya tiene dominio, no se transfiere por defecto: AMS configura los registros necesarios con autorización.
- Si requiere dominio nuevo, AMS puede registrarlo a nombre del cliente mediante Porkbun y gestionar configuración/renovación dentro del acuerdo.
- El plan publicado incluye una asignación estándar para un dominio .com; las extensiones más costosas, premium o múltiples dominios se cotizan por diferencia.
- Mantener los registros de correo existentes (MX, SPF, DKIM, DMARC) al conectar una web.
- Nunca publicar API keys de Porkbun.
- No prometer correo corporativo incluido si no está contratado.

## 10. Planes públicos AMS

La web pública utiliza cuatro planes:
- Pequeño: desarrollo COP $690.000; administración COP $89.900/mes.
- Mediano: desarrollo COP $1.490.000; administración COP $149.900/mes.
- Grande: desarrollo COP $3.490.000; administración COP $299.900/mes.
- Personalizado: desarrollo desde COP $5.900.000; administración desde COP $499.900/mes.

El precio contractual está fijo en COP. La página puede mostrar equivalencia USD informativa, calculada con TRM oficial diaria + margen AMS de COP $300/USD. No cotizar ni facturar en USD salvo acuerdo explícito.

Los planes tienen límites de páginas, productos, usuarios, módulos y almacenamiento descritos en `POLITICA_PLANES_Y_PRECIOS.md`. No prometer recursos ilimitados.

## 11. Integraciones

Implementar únicamente lo contratado:
- Wompi: llaves privadas y firma en backend; validar transacciones y webhooks de forma idempotente.
- WhatsApp: enlaces oficiales para contacto simple; API oficial cuando haya automatización.
- Bancolombia: medios autorizados, nunca automatizar acceso con claves de banca personal.
- APIs externas: claves en servidor; registrar costo recurrente y límites.
- Correo: proveedor dedicado cuando se requiera correo empresarial.

## 12. Flujo de trabajo de cada proyecto

1. Recibir el requerimiento.
2. Entender el proceso real y definir alcance.
3. Seleccionar plan AMS o marcar personalizado.
4. Antigravity construye el prototipo local con Bootstrap CDN, CSS propio y JavaScript.
5. Probar con datos ficticios en navegador.
6. Guardar el proyecto en repositorio GitHub del cliente.
7. Publicar preview estático en GitHub Pages solo si puede ser público; si no, staging protegido.
8. Obtener aprobación de AMS y del cliente.
9. Preparar backend/DB solo cuando haga falta.
10. Probar integración real en staging con datos de prueba.
11. Autorizar despliegue a producción.
12. Conectar dominio y HTTPS.
13. Entregar y documentar operación.
14. Mantener, revisar respaldos y registrar renovaciones.

### Ramas y despliegues

- Rama de trabajo/demo: cambios y preview.
- Producción: solo código aprobado.
- No configurar despliegue automático desde cada commit experimental a la web real.
- Las pruebas automáticas se ejecutan antes de publicar.
- El paso a producción debe estar controlado y ser reversible.
- Los cambios de base de datos deben tener migración compatible y backup previo.

## 13. Mantenimiento de repositorios

Antes de editar:
1. Inspeccionar archivos, ramas y cambios recientes.
2. Leer las reglas y el README.
3. Identificar datos, lógica y contratos existentes.
4. No reemplazar grandes bloques si basta con una modificación acotada.
5. Validar sintaxis, referencias DOM, rutas, enlaces y flujos afectados.
6. Probar responsive cuando el entorno lo permita.
7. Informar exactamente qué se probó y qué no.

No declarar publicado hasta verificar el despliegue. No afirmar una prueba visual si solo se revisó sintaxis.

## 14. Prioridad final

La solución AMS debe ser práctica para la persona que la utiliza, simple de mantener para AMS, segura en producción y rentable con los límites ofrecidos. Mantener el código ligero, aprovechar Bootstrap/CDN y no construir infraestructura que el proyecto no necesita.
