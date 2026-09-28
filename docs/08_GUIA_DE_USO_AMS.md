# Guía rápida de uso de AMS

## Entrada principal

Web pública:
- GitHub Pages: `https://avilamorasoluciones.github.io/ams/`
- Dominio final: `https://avilamorasoluciones.com/`

El dominio propio se configura cuando el sitio esté listo. No hace falta mover el frontend para publicar la web.

## Herramientas internas

### 1. Suscripciones

Ruta:
`/suscripciones/`

Uso:
- Entrar al panel interno.
- Crear cada cliente una sola vez.
- Guardar empresa, contacto, correo, dominio, URL, alojamiento/infraestructura, precio, moneda, periodicidad y fecha de inicio.
- El sistema calcula el próximo vencimiento.
- Hacer respaldo desde “Respaldo”.

Nota: hoy guarda la información en el navegador mediante `localStorage`. No es todavía un sistema multiusuario ni una base de datos central.

### 2. Documentos

Ruta:
`/suscripciones/documentos/`

Flujo:
1. Elegir el documento.
2. Seleccionar un cliente existente cuando aplique.
3. Completar o revisar datos.
4. Revisar la vista previa.
5. Exportar el PDF.

Documentos disponibles:
- Contrato de prestación de servicios.
- Cotización / propuesta comercial.
- Cuenta de cobro.
- Comprobante / recibo de pago.
- Ficha de cliente.
- Cierre mensual.
- Acta de entrega y aceptación.
- Ficha de datos del prestador.

Contrato y acta incluyen espacios de firma.

### 3. Finanzas

Ruta:
`/finanzas/`

Uso:
- Registrar ingresos.
- Registrar gastos.
- Registrar aportes.
- Registrar retiros.
- Guardar referencia o soporte.
- Exportar respaldo.

El sistema distingue aportes de ingresos y retiros de gastos. No sustituye un sistema contable.

### 4. Operación

Ruta:
`/operacion/`

Uso:
- Consultar y organizar información operativa interna.
- Mantener separados los datos de operación de los documentos y finanzas.

No guardar contraseñas, tarjetas, tokens ni secretos.

### 5. Calculadora

Ruta:
`/calculadora/`

Uso:
- Herramienta interna para cálculos comerciales de AMS.

### 6. Herramientas

Ruta:
`/herramientas/`

Uso:
- Herramientas públicas disponibles desde la web de AMS.

### 7. Juegos

Ruta:
`/juegos/`

Uso:
- Juegos y herramientas recreativas públicas.

### 8. AyuKcal

Ruta:
`/ayukcal/`

Es una aplicación independiente dentro del repositorio. Utiliza Supabase para autenticación y almacenamiento de los datos de usuario. Tratar sus datos personales conforme a la política de privacidad.

## Flujo recomendado para un cliente nuevo

Formulario de proyecto → conversación → propuesta/cotización → contrato si corresponde → desarrollo → acta de entrega → cuenta de cobro o factura según corresponda → recibo/comprobante → registrar movimiento en Finanzas → actualizar Suscripciones.

## Acceso y seguridad

Las rutas internas tienen `noindex` y el archivo `robots.txt` evita su rastreo, pero esto **no equivale a seguridad**. La versión actual de los paneles internos está pensada para uso local y de apoyo. Cuando AMS maneje información centralizada o varios usuarios, se debe migrar el acceso a autenticación real + backend + base de datos.

## Pagos

Wompi se integrará cuando AMS necesite cobros automáticos. La llave pública puede estar en el frontend según la integración, pero los secretos y la validación de webhooks deben permanecer en backend.

## Servidor futuro

Cuando AMS necesite backend:
- OVHcloud: VPS.
- Coolify: despliegue y administración.
- PostgreSQL u otra base de datos: dentro del VPS al inicio, si el tamaño y criticidad lo permiten.
- GitHub: código y frontend estático.
- Backups: independientes del VPS.

## Dominio y correo

- Porkbun: dominio.
- Zoho Mail: correo oficial `equipo@avilamorasoluciones.com`.
- GitHub: código y Pages.
- Google: Search Console.
- Wompi: pagos.
- OVHcloud: infraestructura.

## Antes de pasar de GitHub Pages al dominio propio

Los datos guardados en el navegador mediante `localStorage` pertenecen al origen actual. Al pasar de `avilamorasoluciones.github.io/ams` a `avilamorasoluciones.com`, esos datos no se trasladan automáticamente.

Antes del cambio de dominio, usar “Respaldo” en Operación, Finanzas y Suscripciones y conservar los archivos JSON. Después del cambio, usar “Restaurar”. El generador de documentos también guarda borradores/perfiles localmente; conviene volver a guardar los datos del prestador en el nuevo origen.
