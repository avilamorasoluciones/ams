# Backups y seguridad · AMS

## GitHub
GitHub es la copia principal del código fuente.

No subir:
- .env;
- API keys;
- tokens;
- secretos;
- certificados privados;
- credenciales;
- datos privados de clientes.

## Herramientas internas
Las herramientas de Gestión AMS usan almacenamiento local del navegador en la versión actual.

Esto significa:
- no hay sincronización automática entre dispositivos;
- borrar datos del navegador puede eliminar información local;
- el acceso JavaScript no equivale a autenticación de servidor;
- no deben guardarse secretos allí.

## Backup operativo
Hacer respaldos periódicos usando **Respaldo completo** desde Gestión.
Mantener al menos una copia fuera del equipo principal.
Conservar además los PDFs finales y los archivos que resulten importantes para la operación.

## Operación en el dominio oficial
El sitio público opera en `https://avilamorasoluciones.com/`. Como el `localStorage` pertenece al origen del navegador, los datos internos de Gestión deben respaldarse antes de cambiar de dispositivo, reinstalar el entorno o restaurarlos en otro origen:
1. Exportar el respaldo completo de Gestión.
2. Guardar los PDFs finales.
3. Confirmar que el dominio oficial funciona.
4. Restaurar el respaldo cuando se cambie de dispositivo u origen.
5. Generar un documento de prueba y verificar enlaces/PDF.

## Regla 3-2-1
- 3 copias;
- 2 medios diferentes;
- 1 copia separada del equipo principal.

## Cuando exista backend
Añadir:
- variables de entorno;
- autenticación real;
- base de datos;
- backups automáticos;
- pruebas de restauración;
- logs;
- monitorización;
- staging y producción separadas.

## PWA y caché
Los Service Workers pueden conservar recursos antiguos. Al cambiar un recurso crítico:
- actualizar la versión de caché;
- comprobar que el navegador recibe la nueva versión;
- limpiar/reinstalar solo cuando sea necesario;
- verificar de nuevo formularios, enlaces y PDF.

## Incidente
Ante una exposición:
1. detener la causa;
2. preservar evidencia;
3. revocar/rotar secretos afectados;
4. revisar acceso y registros;
5. restaurar una copia limpia si hace falta;
6. documentar el incidente;
7. comunicar a quienes correspondan según el caso.
