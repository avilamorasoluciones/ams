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
- información privada de clientes.

## Herramientas internas actuales

Operación, Finanzas, Suscripciones y Calculadora usan almacenamiento local del navegador en distintos grados.

Consecuencia:
- no sincronizan automáticamente entre dispositivos;
- limpiar navegador puede borrar datos;
- el login JavaScript no es seguridad de servidor;
- no guardar allí secretos ni información especialmente sensible.

## Backup operativo

Como mínimo:
- Operación: exportar JSON.
- Finanzas: exportar JSON.
- Suscripciones: exportar JSON.
- Mantener una copia fuera del navegador.
- Fecha del último backup: [POR COMPLETAR].
- Ubicación: [POR COMPLETAR].

## Regla 3-2-1 recomendada

- 3 copias.
- 2 medios diferentes.
- 1 copia separada del equipo principal.

## Cuando exista backend

- variables de entorno;
- autenticación real;
- backups automáticos;
- pruebas de restauración;
- logs;
- monitorización;
- separación de staging y producción.

## Incidente

- detener la exposición;
- preservar evidencia;
- revocar secretos;
- rotar credenciales;
- revisar logs;
- documentar;
- restaurar si hace falta;
- comunicar a afectados cuando legalmente corresponda.

## PWA

Los Service Workers pueden conservar recursos en caché. Al desplegar cambios:
- subir una nueva versión de caché;
- probar actualización;
- verificar que una versión vieja no bloquee cambios críticos.
