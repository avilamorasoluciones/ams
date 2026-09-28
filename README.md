# Avila Mora Soluciones · AMS

## Manual y cumplimiento
El procedimiento operativo completo está en `MANUAL_OPERATIVO.md`. Las páginas públicas cuentan con política de privacidad, términos y política de cookies. Actualmente el sitio no despliega analítica ni publicidad propia.

## Estado
AMS está preparado para comenzar con **GitHub Pages + dominio propio**. No se incorpora Hetzner/Coolify hasta que el volumen real lo justifique; la referencia operativa actual es esperar a tener al menos dos clientes activos simultáneamente que necesiten infraestructura propia.

## Estructura
- `/` — web pública y captación.
- `/operacion/` — proyectos, etapas, dominios, staging, gastos y procesos.
- `/finanzas/` — Caja AMS: ingresos, gastos, aportes y retiros.
- `/suscripciones/` — clientes recurrentes y vencimientos.
- `/suscripciones/documentos/` — documentos comerciales/cuentas de cobro.
- `/legal_privacidad.html` — política de privacidad y tratamiento de datos.
- `/legal_terminos.html` — términos y condiciones.
- `/legal_cookies.html` — política de cookies y tecnologías similares.
- `/MANUAL_OPERATIVO.md` — manual operativo.
- Demos y juegos — carpetas públicas independientes.

## Flujo de cliente
Contacto → Briefing → Calificación → Propuesta → Aceptación → Pago → Alta → Dominio → Staging/Demo → Producción → Revisión → Correcciones → Publicación → Entrega → Mantenimiento → Renovación.

## Caja AMS: regla financiera
El objetivo es que **AMS pague progresivamente sus propios gastos**.

En Caja AMS:
- **Ingreso:** dinero generado por AMS.
- **Gasto:** dinero utilizado para operar.
- **Aporte:** dinero personal que los propietarios ponen temporalmente en AMS.
- **Retiro:** dinero que sale de AMS hacia los propietarios.

Los aportes no son ventas y los retiros no son gastos. Esto es control de gestión, no contabilidad fiscal.

### Regla práctica
Antes de usar dinero personal para una compra:
1. Revisar la Caja AMS.
2. Registrar qué se necesita comprar.
3. Definir si el gasto corresponde a AMS o a un cliente.
4. Si AMS todavía no tiene caja suficiente, registrar el aporte personal por separado.
5. Cuando AMS genere caja, decidir con criterio contable/comercial cómo reponer ese aporte.

No mezclar dinero personal y dinero de AMS sin registrarlo.

## GitHub Pages mientras arrancamos
GitHub Pages sirve para el sitio público y demos estáticas.

No usar GitHub Pages como backend seguro. No guardar allí:
- contraseñas;
- API keys;
- tokens;
- tarjetas;
- secretos de producción;
- información privada de clientes.

Las herramientas internas actuales usan almacenamiento local del navegador. Eso significa que **PC y celular no comparten automáticamente los mismos datos**. Por ahora se debe usar el respaldo JSON y mantener un dispositivo principal de operación. Cuando la operación necesite sincronización real, se migra a una base de datos/backend.

## Staging y dominios
No esperar al dominio para comenzar un proyecto.
- Cliente con dominio existente: solicitar los datos DNS necesarios en la fase de publicación.
- Cliente sin dominio: comprarlo después de autorización y según el acuerdo.
- Mientras tanto: trabajar con staging/demo.
- Las demos públicas deben usar contenido ficticio y no datos sensibles.

## Cuando llegue Hetzner/Coolify
La migración debe añadir:
- staging protegido;
- producción separada por proyecto;
- variables de entorno;
- backups automáticos;
- monitorización;
- backend/base de datos cuando sea necesario.

La interfaz y el flujo de negocio no deberían cambiar.

## Antes de vender formalmente
Quedan fuera del código y requieren acción de ustedes:
1. Configurar Zoho Mail y `equipo@avilamorasoluciones.com`.
2. Crear la cuenta Microsoft operativa para Forms.
3. Crear y probar el briefing; añadir en el formulario el enlace a la Política de Privacidad de AMS.
4. Configurar el medio de pago real.
5. Confirmar con contador la situación fiscal/facturación.
6. Comprar/configurar el dominio AMS.
7. Definir el procedimiento real de backups.
8. Configurar Hetzner/Coolify solo cuando existan 2 clientes activos simultáneamente y el costo quede justificado.

## Principio de desarrollo
No agregar tecnología por moda. Cada herramienta debe ahorrar tiempo, reducir un riesgo, controlar dinero, mejorar una venta, facilitar producción o mejorar la entrega.
