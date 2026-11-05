# Avila Mora Soluciones (AMS)

## Documentación y operación
El procedimiento operativo completo está en `MANUAL_OPERATIVO.md`. Las páginas públicas cuentan con privacidad, términos y cookies. Las demos de portafolio se identifican como demos y no se indexan. Actualmente el sitio no despliega analítica ni publicidad propia.

## Estado
Avila Mora Soluciones opera como marca comercial y proveedor de servicios digitales con sitio oficial, dominio propio, HTTPS y publicación mediante **GitHub Pages**. No se incorpora OVHcloud/Coolify hasta que el flujo real de clientes o los requisitos técnicos lo justifiquen.

## Estructura
- `/` — web pública y captación.
- `/gestion/` — centro interno con Calculadora, Clientes/Suscripciones, Documentos, Finanzas y Operación.
- `/legal_privacidad.html` — privacidad y tratamiento de datos.
- `/legal_terminos.html` — términos de uso y de los servicios.
- `/legal_cookies.html` — cookies y tecnologías similares.
- `/MANUAL_OPERATIVO.md` — manual operativo.
- `/LANZAMIENTO.md` — checklist para dominio, correo y pagos.
- Demos y juegos — carpetas públicas independientes.

## Pruebas locales
Con Node.js, ejecuta `node --test tests/repo-improvements.test.cjs` para correr las pruebas de regresión del almacén de Gestión, el aislamiento local de AyuKcal, los contratos de AMS Fly y la navegación/demos accesibles.

## Flujo de cliente
Contacto → Formulario de proyecto → Calificación → Propuesta → Aceptación → Pago → Alta → Dominio → Staging/Demo → Producción → Revisión → Correcciones → Publicación → Entrega → Mantenimiento → Renovación.

## Caja Avila Mora Soluciones
La Caja Avila Mora Soluciones es una herramienta de **control interno del dinero**, no un sistema contable.

- **Ingreso:** dinero que entra a Avila Mora Soluciones.
- **Gasto:** dinero utilizado para operar.
- **Aporte:** dinero personal que entra temporalmente para sostener una compra u operación.
- **Retiro:** dinero que sale de Avila Mora Soluciones hacia los propietarios.

Los aportes no son ventas y los retiros no son gastos.

### Regla práctica
Antes de usar dinero personal para una compra:
1. Revisar la Caja Avila Mora Soluciones.
2. Registrar qué se necesita comprar.
3. Definir si corresponde a Avila Mora Soluciones o a un cliente.
4. Si falta caja, registrar el aporte por separado.
5. Cuando Avila Mora Soluciones tenga caja suficiente, decidir cómo reponerlo.

No mezclar dinero personal y dinero de Avila Mora Soluciones sin registrarlo.

## GitHub Pages y dominio oficial
El dominio oficial del sitio público es `https://avilamorasoluciones.com/`. El repositorio se utiliza para desarrollo, pruebas y despliegue de los proyectos.

No usar GitHub Pages como backend seguro. No guardar allí:
- contraseñas;
- API keys;
- tokens;
- tarjetas;
- secretos de producción;
- información privada de clientes.

Las herramientas internas actuales usan almacenamiento local del navegador. Eso significa que **PC y celular no comparten automáticamente los mismos datos**. Por ahora se debe usar el respaldo completo y mantener un dispositivo principal de operación. Cuando la operación necesite sincronización real, se migra a una base de datos/backend.

## Staging y dominios
No esperar al dominio para comenzar un proyecto.
- Cliente con dominio existente: solicitar solo los datos DNS necesarios en la fase de publicación.
- Cliente sin dominio: comprarlo después de autorización y según el acuerdo.
- Mientras tanto: trabajar con staging/demo.
- Las demos públicas deben usar contenido ficticio y no datos privados.

## Cuando llegue OVHcloud/Coolify
La migración debe añadir:
- staging protegido;
- producción separada por proyecto;
- variables de entorno;
- backups automáticos;
- monitorización;
- backend/base de datos cuando sea necesario;
- autenticación real para herramientas internas.

La interfaz y el flujo de negocio no deberían cambiar.

## Pendientes de consolidación operativa
El sitio, el dominio y el enlace de pago Wompi ya están publicados. La cuenta Wompi se utiliza a nombre de una persona natural; esto no implica que exista una sociedad ni una integración técnica propia.

Quedan por verificar o completar, según la operación real:
1. Confirmar que el buzón `equipo@avilamorasoluciones.com` recibe y envía correctamente; que la dirección aparezca en la web no demuestra por sí sola que el buzón esté configurado.
2. Completar y mantener actualizada la identificación legal del titular en los documentos y avisos que correspondan, sin publicar datos privados innecesarios en GitHub.
3. Crear y probar el briefing en Microsoft Forms y revisar sus permisos.
4. Revisar que privacidad, términos y canales de atención describan la operación real.
5. Mantener copias externas y probar la restauración de los respaldos de Gestión.
6. Implementar backend/webhooks solo si se necesita automatizar la confirmación de pagos o las suscripciones.
7. Configurar OVHcloud/Coolify solo cuando el volumen y los requisitos técnicos lo justifiquen.

**Nota:** Avila Mora Soluciones debe mantener sus textos públicos ajustados a su operación real y no afirmar una sociedad, registro, certificación o condición jurídica concreta sin haberla formalizado o verificado.

## Principio de desarrollo
No agregar tecnología por moda. Cada herramienta debe ahorrar tiempo, reducir un riesgo, controlar dinero, mejorar una venta, facilitar producción o mejorar la entrega.
