# Manual Operativo AMS

## 1. Regla principal
AMS comienza simple en GitHub Pages. Mientras el dominio propio no esté comprado/configurado, deben conservarse y probarse las URLs `avilamorasoluciones.github.io/ams/...`. Una vez configurado `avilamorasoluciones.com`, se mantiene el contenido funcional del repositorio y se hacen los cambios de canonical, sitemap y redirecciones de forma controlada. No migrar a OVHcloud/Coolify hasta que existan 2 clientes activos simultáneamente que justifiquen infraestructura propia.

## 2. Contacto rápido
La web oficial publica `equipo@avilamorasoluciones.com` y WhatsApp +57 305 254 7072. Los botones de WhatsApp llevan un mensaje prellenado. Los botones de correo pueden abrir Gmail, Outlook o el cliente de correo predeterminado con asunto y mensaje prellenados.

## 3. Flujo comercial
1. Cliente llega por web/WhatsApp.
2. Se entiende la necesidad.
3. Se envía propuesta con alcance, precio, tiempos y servicios.
4. Cliente acepta.
5. Se registra el pago.
6. Cliente completa el Formulario de Proyecto en Microsoft Forms.
7. Se crea o actualiza el proyecto en Gestión → Operación.
8. Se prepara staging/demo.
9. Se desarrolla y prueba.
10. Se muestra el proyecto mediante un enlace.
11. Cliente revisa; se corrigen cambios dentro del alcance.
12. Aprobación.
13. Publicación.
14. Entrega.
15. Mantenimiento/renovación si corresponde.

## 4. Formulario de Proyecto
Debe entregar datos del cliente, objetivo, negocio, contenido, diseño, funciones, situación actual, dominio, referencias, prioridades, fecha y observaciones.
No pedir contraseñas, tarjetas, códigos de autenticación ni datos bancarios sensibles.
El formulario debe conservarse como registro del proyecto.

## 5. Staging
- No esperar al dominio.
- GitHub Pages/demo mientras AMS arranca.
- No subir datos privados del cliente a demos públicas.
- Con infraestructura propia: staging protegido y producción separada.
- La URL de demo se comparte cuando el proyecto esté listo para revisión.

## 6. Dominio
- Si el cliente ya tiene dominio: recopilar solo los datos DNS necesarios para publicar.
- Si no tiene: comprar después de aceptación, pago y autorización.
- Preferir registro/control del cliente y administración técnica por AMS cuando corresponda.
- Renovaciones deben quedar registradas en Operación/Suscripciones.

## 7. Operación AMS
La información operativa se administra desde `/gestion/`, en el módulo Operación. El cliente se guarda como registro maestro y los proyectos quedan vinculados a ese cliente. Registrar etapa, fechas, dominio, staging, producción, siguiente paso y notas.
Etapas: Contacto inicial (Lead) → Calificado → Propuesta → Aceptado → Pago pendiente → Producción → Revisión cliente → Entrega → Mantenimiento → Cerrado. Contacto inicial (Lead) significa que alguien acaba de llegar o preguntar y todavía no es una venta.

## 8. Caja AMS
- Ingreso: venta o servicio cobrado por AMS.
- Gasto: costo de operación.
- Aporte: dinero personal puesto temporalmente en AMS.
- Retiro: dinero sacado de AMS.
Un aporte no es una venta; un retiro no es un gasto.
Objetivo: pagar progresivamente infraestructura y operación con caja generada por AMS.

## 9. Clientes y Suscripciones
Registrar o editar el cliente maestro y su suscripción: precio, moneda, periodicidad, inicio, vencimiento, días de gracia, último pago y estado.
Un cliente debe existir una sola vez. Operación y Documentos reutilizan este registro.
El panel actual usa almacenamiento local y no sincroniza automáticamente entre dispositivos. Existe un respaldo completo de Gestión que incluye clientes, proyectos, finanzas y checklist.

## 10. Documentos
Gestión → Documentos se limita a los PDFs realmente útiles para el emprendimiento: propuesta comercial/cotización, acta de entrega, comprobante de pago y ficha interna de cliente/proyecto. Cada tipo tiene un formulario propio y puede usar una plantilla de servicio para ahorrar trabajo repetitivo. Por ahora quedan fuera del flujo de Gestión la facturación electrónica, cuentas de cobro y contratos de prestación de servicios.

## 11. Datos y privacidad
AMS debe cumplir su Política de Privacidad y limitar la información a la necesaria.
Las solicitudes de titulares se atienden por el canal comercial definido.
No almacenar secretos en GitHub, LocalStorage, Forms, WhatsApp o documentos públicos.

## 12. Seguridad
Nunca subir al repositorio contraseñas, API keys/tokens, claves privadas, credenciales de hosting, tarjetas o datos personales de clientes que deban permanecer privados.
Las pantallas internas publicadas en GitHub Pages no son seguridad real. Cuando haya información sensible o varios usuarios, migrar a backend con autenticación.

## 13. Backups
- Código: GitHub.
- Datos de Operación/Finanzas/Suscripciones: respaldos JSON periódicos.
- Bases de datos: exportación SQL cuando exista backend.
- Con OVHcloud/Coolify: backups automáticos y restauración probada.

## 14. Finanzas y compras
1. Revisar Caja AMS.
2. Identificar el gasto.
3. Registrar el gasto.
4. Si falta caja, registrar un Aporte separado.
5. No mezclar gasto personal con gasto AMS.

## 15. Cuando llegue OVHcloud/Coolify
Debe incluir staging protegido, producción separada, variables de entorno, backups automáticos, monitorización, backend/base de datos cuando haga falta y autenticación real para herramientas internas.
La migración no debe cambiar el flujo comercial.

## 16. Checklist antes de entregar
Contenido correcto · móvil · tablet · PC · enlaces · formularios · WhatsApp · dominio · HTTPS · SEO básico · PDF si aplica · permisos · backup · aprobación del cliente · documento comercial correspondiente · instrucciones de uso.

## 17. Fuente de verdad
1. Web pública = captación.
2. Formulario de Proyecto = requisitos del cliente.
3. Propuesta = alcance vendido.
4. Documentos = soporte comercial del caso.
5. Cliente maestro = datos de la persona/empresa.
6. Operación = proyectos y próximos pasos.
7. Suscripciones = servicio recurrente y renovaciones.
8. Finanzas = único libro de movimientos de caja.
9. Procesos = checklist persistente por proyecto.
10. Backups = recuperación.

## 18. Regla de cambio de infraestructura
No pagar servidor propio por anticipación. Cuando haya 2 clientes activos a la vez, evaluar OVHcloud/Coolify u otra infraestructura similar y confirmar que los ingresos recurrentes justifican el costo.

## 19. Texto legal del briefing
En la descripción de Microsoft Forms, después de explicar el tiempo estimado, incluir:
"Al enviar este formulario, autorizas a Avila Mora Soluciones a utilizar la información proporcionada para analizar, preparar, cotizar y desarrollar tu proyecto, de acuerdo con nuestra Política de Privacidad. Consulta: https://avilamorasoluciones.com/legal_privacidad.html"

Mantener como preguntas obligatorias la confirmación y los datos esenciales. No solicitar contraseñas, tarjetas, códigos de autenticación ni datos bancarios sensibles.
