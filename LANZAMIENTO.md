# Lanzamiento AMS · checklist de operación y publicación
**Actualizado:** 5 de noviembre de 2026

## Estado del sitio público
- Sitio oficial: https://avilamorasoluciones.com/
- Publicación: GitHub Pages.
- Dominio, DNS, CNAME y HTTPS: configurados.
- No guardar secretos ni datos privados en el repositorio.
- La versión pública de planes tiene cuatro paquetes y selector COP/USD (COP por defecto): `index.html`, `planes.css`, `planes.js`.
- El selector COP/USD muestra dos listas independientes de tarifas fijas. No consulta la TRM, no convierte importes ni requiere conexión a datos.gov.co.

## Documentos fuente
- `AGENTS.md`: reglas permanentes de desarrollo.
- `PROMPT_MAESTRO_ANTIGRAVITY_AMS.md`: prompt de nuevos proyectos.
- `POLITICA_PLANES_Y_PRECIOS.md`: límites, tarifas y exclusiones.
- `MANUAL_OPERATIVO.md`: proceso de atención y entrega.
- `README.md`: mapa del repositorio.

## Planes públicos
| Plan | Desarrollo COP / USD | Mensual COP / USD | Anual COP / USD |
|---|---:|---:|---:|
| Presencia | $500.000 / US$ 125 | $60.000 / US$ 15 | $600.000 / US$ 150 |
| Comercio | $1.000.000 / US$ 250 | $100.000 / US$ 25 | $1.000.000 / US$ 250 |
| Gestión | $2.400.000 / US$ 600 | $200.000 / US$ 50 | $2.000.000 / US$ 500 |
| Empresarial | Desde $4.000.000 / US$ 1.000 | Desde $360.000 / US$ 90 | Desde $3.600.000 / US$ 900 |

- Desarrollo se cobra una vez.
- Anual anticipado: se pagan 10 mensualidades y se reciben 12 meses de servicio; el cliente ahorra dos mensualidades.
- Los límites publicados deben coincidir con `POLITICA_PLANES_Y_PRECIOS.md`.
- Un dominio .com estándar nuevo se registra y renueva a nombre del cliente, según el plan.
- Correo corporativo, licencias externas, comisiones de pago, dominios premium/adicionales y ampliaciones se cotizan aparte.
- El titular del dominio es el cliente. Si ya tiene dominio, no se transfiere por defecto.

## Pendientes reales de verificación
1. Probar desde un navegador real que todos los enlaces, botones y tarjetas de planes funcionan en escritorio y móvil.
2. Probar que el selector COP/USD cambia todos los importes de desarrollo, mensualidad, anualidad y ahorro.
3. Confirmar que ambos juegos de tarifas coinciden con `POLITICA_PLANES_Y_PRECIOS.md` y que no dependen de la TRM.
4. Confirmar que el buzón `equipo@avilamorasoluciones.com` recibe y envía correctamente; su aparición en la web no garantiza que el servicio esté configurado.
5. Mantener actualizados privacidad, términos, cookies y canales de atención según la operación real.
6. Mantener la cuenta Wompi activa y revisar condiciones y cuenta de desembolso.
7. No guardar llaves secretas de Wompi en GitHub Pages.
8. Implementar backend/webhooks solo cuando se necesite confirmar pagos o suscripciones de forma automática.
9. Revisar el Microsoft Forms de briefing, sus permisos y enlace de privacidad.
10. Mantener respaldos externos y probar restauración de Gestión.

## Dominio y Porkbun
- Si el cliente ya tiene dominio, solicitar solo datos DNS necesarios y autorización; no transferirlo por defecto.
- Si requiere dominio nuevo, comprar después de aceptación y autorización, a nombre del cliente.
- AMS gestiona DNS y renovación según la propuesta.
- Mantener los registros MX, SPF, DKIM y DMARC para evitar interrumpir el correo.
- El plan contempla un .com estándar; extensiones costosas, premium o adicionales se cotizan por diferencia.

## Flujo de cada proyecto
1. Briefing y calificación.
2. Selección de plan y propuesta.
3. Aceptación y pago.
4. Repositorio privado del cliente.
5. Prototipo local Antigravity con Bootstrap CDN, CSS propio y JavaScript.
6. Pruebas con datos ficticios y doble clic en `index.html`.
7. Demo pública en GitHub Pages solo si puede ser pública; de lo contrario staging protegido.
8. Aprobación del cliente.
9. Backend y base de datos solo cuando los requisitos lo exijan.
10. Pruebas reales en staging con datos ficticios.
11. Promoción autorizada a producción.
12. Conexión del dominio, HTTPS, backups y entrega.
13. Mantenimiento y renovación.

## Infraestructura
- GitHub Pages sirve demos estáticas; no ejecuta Express ni bases de datos.
- El entorno Hetzner/Coolify existente debe revisarse antes de comprar infraestructura adicional.
- OVH VPS-2 + Coolify es una opción evaluada, no declararla activa hasta que esté contratada, configurada y probada.
- No instalar CloudPanel y Coolify simultáneamente como administradores del mismo servidor.
- No prometer un número fijo de clientes por VPS. Medir CPU, RAM, disco, bases de datos, visitas y concurrencia por aplicación.
- Mantener staging y producción separados y no desplegar cambios experimentales automáticamente.

## Datos locales antes de cambiar de origen
Los módulos internos de Gestión AMS guardan información en `localStorage`, que pertenece al origen y al navegador. Al cambiar de GitHub Pages a `avilamorasoluciones.com` esos datos no se transfieren automáticamente. Antes del cambio, usar **Respaldo completo** y conservar los JSON para restauración controlada.
