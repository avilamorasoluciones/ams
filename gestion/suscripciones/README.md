# Clientes y Suscripciones · Gestión AMS

Este módulo forma parte de `/gestion/` y **no tiene un login propio**. El acceso se realiza una sola vez desde Gestión AMS.

## Función

Panel local para mantener:
- clientes;
- contacto;
- correo;
- teléfono;
- dominio;
- URL;
- infraestructura;
- precio;
- moneda;
- periodicidad;
- fecha de inicio;
- vencimiento;
- días de gracia;
- estado.

## Integración

El Centro Documental puede leer los clientes guardados aquí para autocompletar documentos. Operación mantiene información adicional del proyecto. Ambos módulos comparten el mismo `localStorage` cuando se usan en el mismo origen.

## Respaldo

Usar **Respaldo** para exportar JSON y **Restaurar** para recuperar la información.

## Seguridad

No guardar contraseñas, tokens, secretos, tarjetas ni credenciales de proveedores.

El acceso de Gestión AMS es una protección de uso interno del frontend actual. No equivale a autenticación de servidor. Cuando la operación necesite varios usuarios o información sensible, migrar a backend + autenticación real + base de datos.