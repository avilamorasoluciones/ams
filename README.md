# Avila Mora Soluciones (AMS)

Repositorio principal de la web pública, documentación operativa, herramientas internas y demostraciones de Avila Mora Soluciones.

## Documentación fuente

Leer estos documentos antes de construir o modificar proyectos:

- **`AGENTS.md`** — reglas permanentes de arquitectura, desarrollo, seguridad, GitHub, hosting y operación.
- **`PROMPT_MAESTRO_ANTIGRAVITY_AMS.md`** — prompt completo y reutilizable para crear nuevos proyectos con Antigravity, desde prototipo local hasta producción.
- **`MANUAL_OPERATIVO.md`** — flujo comercial y operativo de cada cliente.
- **`POLITICA_PLANES_Y_PRECIOS.md`** — alcance, límites, precios y exclusiones de los cuatro planes públicos.
- **`LANZAMIENTO.md`** — checklist de publicación, dominio, pagos, privacidad y datos.

La web pública muestra cuatro planes: Presencia, Comercio, Gestión y Empresarial. El desarrollo se cobra una sola vez; la administración puede ser mensual o anual. La anualidad cobra 10 mensualidades por 12 meses de servicio (dos meses gratis). La sección de precios inicia en COP y permite mostrar todos los importes en USD con un selector. Los valores contractuales están fijos en COP; la conversión USD es informativa y utiliza la TRM oficial diaria más COP $300 por USD.

## Estado e infraestructura

- Web oficial: https://avilamorasoluciones.com/
- Publicación pública: GitHub Pages.
- Dominio oficial y HTTPS: configurados.
- Gestión interna: `/gestion/`.
- Gestión AMS utiliza almacenamiento local del navegador. Sus datos no se sincronizan automáticamente entre dispositivos; usar el respaldo completo.
- El entorno Hetzner/Coolify existente debe revisarse antes de comprar infraestructura adicional.
- OVH VPS-2 + Coolify es una arquitectura objetivo/evaluada, no debe presentarse como producción activa hasta que se contrate, configure y pruebe.
- No instalar CloudPanel y Coolify simultáneamente como administradores del mismo servidor.
- GitHub Pages sirve frontend estático y demos; no ejecuta backend ni bases de datos.

## Estructura principal

- `/index.html` — web pública, servicios, planes, hosting y dominios.
- `/planes.css` — estilos responsive de las cuatro tarjetas públicas.
- `/planes.js` — selector COP/USD y equivalencias informativas mediante TRM oficial diaria + margen AMS.
- `/gestion/` — Clientes/Suscripciones, Cotizador interno, Documentos, Finanzas y Operación.
- `/legal_privacidad.html` — privacidad.
- `/legal_terminos.html` — términos.
- `/legal_cookies.html` — cookies.
- `/MANUAL_OPERATIVO.md` — operación.
- `/AGENTS.md` — reglas permanentes.
- `/PROMPT_MAESTRO_ANTIGRAVITY_AMS.md` — prompt para nuevos proyectos.
- `/POLITICA_PLANES_Y_PRECIOS.md` — tarifario y límites.
- `/LANZAMIENTO.md` — lista de lanzamiento.
- Demos y juegos — carpetas independientes; las demos públicas no deben contener datos privados.

## Stack de proyectos AMS

Frontend estándar: HTML5 + Bootstrap 5.3.8 por CDN + CSS propio + JavaScript Vanilla. Se pueden añadir librerías especializadas por CDN cuando aporten valor. Versiones exactas y SRI cuando esté disponible. No combinar Bootstrap y Tailwind.

El prototipo de cada cliente debe poder abrirse directamente con doble clic en `index.html`, usando scripts clásicos y datos ficticios. No requiere instalaciones locales de Node/Python/Docker.

El mismo frontend debe tener una capa de acceso a datos que permita pasar de `DemoProvider` a `ApiProvider` sin reconstruir las pantallas.

## Flujo de trabajo del cliente

Briefing → alcance y plan → propuesta → aceptación/pago → repositorio GitHub privado → prototipo local Antigravity → pruebas → demo/preview → aprobación del cliente → API/DB si aplica → pruebas de staging → publicación autorizada → dominio/HTTPS → mantenimiento.

GitHub Pages puede mostrar demos estáticas con datos ficticios. No es backend, no almacena datos reales y no es privado por el solo hecho de que el repositorio fuente sea privado. Cuando una demo no pueda ser pública, usar staging protegido.

## Seguridad e infraestructura

- Nunca guardar contraseñas, API keys, tokens, .env real, tarjetas, base de datos o backups de producción en GitHub.
- En producción, secretos fuera del directorio público y del repositorio.
- Sistemas con usuarios o datos compartidos requieren API, autenticación/autorización en servidor y persistencia real.
- Base de datos por cliente como estándar, con usuario y privilegios mínimos.
- Usar consultas parametrizadas, HTTPS, control de sesiones, validaciones, rate limiting y backups externos.
- No afirmar que una aplicación es inhackeable.
- No desplegar cada commit experimental directamente a producción. Mantener preview y producción separados; producción requiere promoción autorizada.
- No declarar un despliegue como completado hasta confirmar el resultado en el hosting.

## Pruebas locales

Con Node.js, ejecutar:

```bash
node --test tests/repo-improvements.test.cjs
```

Esto ejecuta pruebas de regresión del almacén de Gestión, aislamiento local de AyuKcal, contratos de AMS Fly y navegación/demos accesibles.

Las pruebas específicas de planes públicos deben revisar: cuatro tarjetas, precios COP, equivalencias USD, carga de `planes.js`, IDs de estado, rutas y comportamiento responsive.

## Caja AMS

La Caja es control interno, no un sistema contable.

- Ingreso: dinero que entra a AMS.
- Gasto: dinero utilizado para operar.
- Aporte: dinero personal puesto temporalmente para sostener una compra/operación.
- Retiro: dinero que sale hacia los propietarios.

Los aportes no son ventas y los retiros no son gastos. Registrar por separado comisiones, retenciones y desembolsos netos de pasarelas cuando estén disponibles.

## Principio de desarrollo

No agregar tecnología por moda. Cada herramienta debe mejorar venta, operación, seguridad, entrega, mantenimiento o rentabilidad. Construir una sola solución que evolucione desde demo local hasta producción sin rehacer el frontend ni comprometer los datos.
