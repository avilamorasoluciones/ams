# Clientes y Suscripciones · Gestión Avila Mora Soluciones

Este módulo forma parte de `/gestion/` y **no tiene un login propio**. El acceso se realiza una sola vez desde Gestión Avila Mora Soluciones.

## Función

Panel local para mantener:
- cliente maestro;
- contacto;
- correo;
- teléfono;
- país y ciudad;
- dominio;
- URL;
- infraestructura;
- precio;
- moneda;
- periodicidad;
- fecha de inicio;
- vencimiento;
- días de gracia;
- último pago;
- estado.

## Integración

Operación y Documentos reutilizan el mismo cliente maestro cuando se usan en el mismo origen del navegador.

**Registrar pago** actualiza la próxima fecha y crea el ingreso correspondiente en Caja Avila Mora Soluciones.

## Respaldo

Usar **Respaldo completo** desde Gestión para exportar clientes, proyectos, movimientos y checklist. Restaurar solo archivos de respaldo generados por Avila Mora Soluciones.

## Seguridad

No guardar contraseñas, tokens, secretos, tarjetas ni credenciales de proveedores.

El acceso de Gestión Avila Mora Soluciones es una protección de uso interno del frontend actual. No equivale a autenticación de servidor. Cuando la operación necesite varios usuarios o información sensible, migrar a backend + autenticación real + base de datos.
