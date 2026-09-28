# Avila Mora Soluciones · AMS

## Documentación y operación
El procedimiento operativo completo está en `MANUAL_OPERATIVO.md`. Las páginas públicas cuentan con privacidad, términos y cookies. Las demos de portafolio se identifican como demos y no se indexan. Actualmente el sitio no despliega analítica ni publicidad propia.

## Estado
AMS está preparado para comenzar con **GitHub Pages + dominio propio**. No se incorpora OVHcloud/Coolify hasta que el volumen real lo justifique; la referencia operativa actual es esperar a tener al menos dos clientes activos simultáneamente que necesiten infraestructura propia.

## Estructura
- `/` — web pública y captación.
- `/gestion/` — centro interno con Calculadora, Clientes/Suscripciones, Documentos, Finanzas y Operación.
- `/legal_privacidad.html` — privacidad y tratamiento de datos.
- `/legal_terminos.html` — términos de uso y de los servicios.
- `/legal_cookies.html` — cookies y tecnologías similares.
- `/MANUAL_OPERATIVO.md` — manual operativo.
- `/LANZAMIENTO.md` — checklist para dominio, correo y pagos.
- Demos y juegos — carpetas públicas independientes.

## Flujo de cliente
Contacto → Formulario de proyecto → Calificación → Propuesta → Aceptación → Pago → Alta → Dominio → Staging/Demo → Producción → Revisión → Correcciones → Publicación → Entrega → Mantenimiento → Renovación.

## Caja AMS
La Caja AMS es una herramienta de **control interno del dinero**, no un sistema contable.

- **Ingreso:** dinero que entra a AMS.
- **Gasto:** dinero utilizado para operar.
- **Aporte:** dinero personal que entra temporalmente para sostener una compra u operación.
- **Retiro:** dinero que sale de AMS hacia los propietarios.

Los aportes no son ventas y los retiros no son gastos.

### Regla práctica
Antes de usar dinero personal para una compra:
1. Revisar la Caja AMS.
2. Registrar qué se necesita comprar.
3. Definir si corresponde a AMS o a un cliente.
4. Si falta caja, registrar el aporte por separado.
5. Cuando AMS tenga caja suficiente, decidir cómo reponerlo.

No mezclar dinero personal y dinero de AMS sin registrarlo.

## GitHub Pages mientras arrancamos
GitHub Pages sirve para el sitio público y las demos estáticas. Mientras no esté comprado/configurado el dominio, las URLs `avilamorasoluciones.github.io/ams/...` se conservan funcionales.

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

## Antes de iniciar actividad comercial real
Quedan fuera del código y requieren revisión de ustedes:
1. Comprar/configurar el dominio AMS.
2. Configurar Zoho Mail y `equipo@avilamorasoluciones.com`.
3. Crear y probar el briefing en Microsoft Forms.
4. Revisar la identificación pública real del titular antes de publicar datos legales definitivos.
5. Configurar el medio de pago real.
6. Revisar que privacidad, términos y canales de atención describan la operación real.
7. Definir el procedimiento real de backups.
8. Configurar OVHcloud/Coolify solo cuando el volumen y el flujo de trabajo lo justifiquen.

**Nota:** que AMS sea una iniciativa pequeña o que todavía no tenga registro propio no permite asumir por sí solo una situación legal concreta. No hacemos esa afirmación en el sitio; los documentos públicos se mantienen generales y se actualizan cuando la operación real cambie.

## Principio de desarrollo
No agregar tecnología por moda. Cada herramienta debe ahorrar tiempo, reducir un riesgo, controlar dinero, mejorar una venta, facilitar producción o mejorar la entrega.
