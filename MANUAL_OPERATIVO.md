# Manual Operativo AMS

## 1. Regla principal
AMS comienza simple: GitHub Pages + dominio propio avilamorasoluciones.com. No migrar a Hetzner/Coolify hasta que existan 2 clientes activos simultáneamente que justifiquen infraestructura propia.

## 2. Flujo comercial
1. Cliente llega por web/WhatsApp.
2. Se entiende la necesidad.
3. Se envía propuesta con alcance, precio, tiempos y servicios.
4. Cliente acepta.
5. Se registra el pago.
6. Cliente completa el Briefing de Proyecto en Microsoft Forms.
7. Se crea o actualiza el proyecto en Operación AMS.
8. Se prepara staging/demo.
9. Se desarrolla y prueba.
10. Se muestra el proyecto mediante un enlace.
11. Cliente revisa; se corrigen cambios dentro del alcance.
12. Aprobación.
13. Publicación.
14. Entrega.
15. Mantenimiento/renovación si corresponde.

## 3. Briefing
Debe entregar datos del cliente, objetivo, negocio, contenido, diseño, funciones, situación actual, dominio, referencias, prioridades, fecha y observaciones.
No pedir contraseñas, tarjetas, códigos de autenticación ni datos bancarios sensibles.
El formulario debe conservarse como registro del proyecto.

## 4. Staging
- No esperar al dominio.
- GitHub Pages/demo mientras AMS arranca.
- No subir datos privados del cliente a demos públicas.
- Con infraestructura propia: staging protegido y producción separada.
- La URL de demo se comparte cuando el proyecto esté listo para revisión.

## 5. Dominio
- Si el cliente ya tiene dominio: recopilar solo los datos DNS necesarios para publicar.
- Si no tiene: comprar después de aceptación, pago y autorización.
- Preferir registro/control del cliente y administración técnica por AMS cuando corresponda.
- Renovaciones deben quedar registradas en Operación/Suscripciones.

## 6. Operación AMS
Registrar cliente, proyecto, etapa, fechas, dominio, staging, producción, siguiente paso y notas.
Etapas: Lead → Calificado → Propuesta → Aceptado → Pago pendiente → Producción → Revisión cliente → Entrega → Mantenimiento → Cerrado.

## 7. Caja AMS
- Ingreso: venta o servicio cobrado por AMS.
- Gasto: costo de operación.
- Aporte: dinero personal puesto temporalmente en AMS.
- Retiro: dinero sacado de AMS.
Un aporte no es una venta; un retiro no es un gasto.
Objetivo: pagar progresivamente infraestructura y operación con caja generada por AMS.

## 8. Suscripciones
Registrar cliente, precio, moneda, periodicidad, inicio, vencimiento y estado.
El panel actual usa almacenamiento local y no sincroniza automáticamente entre dispositivos. Mantener un equipo principal y respaldar JSON.

## 9. Documentos
El Centro de Documentos genera documentos comerciales/cuentas de cobro. No es un sistema de facturación electrónica DIAN.
Cuando exista obligación de facturar, usar un sistema habilitado y la numeración y requisitos correspondientes.

## 10. Datos y privacidad
AMS debe cumplir su Política de Privacidad y limitar la información a la necesaria.
Las solicitudes de titulares se atienden por el canal comercial definido.
No almacenar secretos en GitHub, LocalStorage, Forms, WhatsApp o documentos públicos.

## 11. Seguridad
Nunca subir al repositorio contraseñas, API keys/tokens, claves privadas, credenciales de hosting, tarjetas o datos personales de clientes que deban permanecer privados.
Las pantallas internas publicadas en GitHub Pages no son seguridad real. Cuando haya información sensible o varios usuarios, migrar a backend con autenticación.

## 12. Backups
- Código: GitHub.
- Datos de Operación/Finanzas/Suscripciones: respaldos JSON periódicos.
- Bases de datos: exportación SQL cuando exista backend.
- Con Hetzner/Coolify: backups automáticos y restauración probada.

## 13. Finanzas y compras
1. Revisar Caja AMS.
2. Identificar el gasto.
3. Registrar el gasto.
4. Si falta caja, registrar un Aporte separado.
5. No mezclar gasto personal con gasto AMS.

## 14. Cuando llegue Hetzner/Coolify
Debe incluir staging protegido, producción separada, variables de entorno, backups automáticos, monitorización, backend/base de datos cuando haga falta y autenticación real para herramientas internas.
La migración no debe cambiar el flujo comercial.

## 15. Checklist antes de entregar
Contenido correcto · móvil · tablet · PC · enlaces · formularios · WhatsApp · dominio · HTTPS · SEO básico · PDF si aplica · permisos · backup · aprobación del cliente · documento comercial/fiscal correspondiente · instrucciones de uso.

## 16. Fuente de verdad
1. Web pública = captación.
2. Briefing = requisitos del cliente.
3. Propuesta = alcance vendido.
4. Términos = condiciones.
5. Documentos = soporte comercial/fiscal según corresponda.
6. Operación = proyecto.
7. Suscripciones = recurrentes.
8. Finanzas = caja.
9. Infraestructura = hosting/staging/producción.
10. Backups = recuperación.

## 17. Regla de cambio de infraestructura
No pagar servidor propio por anticipación. Cuando haya 2 clientes activos a la vez, evaluar Hetzner/Coolify u otra infraestructura similar y confirmar que los ingresos recurrentes justifican el costo.