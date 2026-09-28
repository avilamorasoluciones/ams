# Seguridad de AMS

Este repositorio contiene código público destinado principalmente a GitHub Pages.

## Nunca subir
- contraseñas;
- API keys;
- tokens;
- claves privadas;
- credenciales de hosting;
- datos bancarios;
- datos personales de clientes que no deban ser públicos.

## Herramientas internas
Las carpetas internas publicadas en GitHub Pages no deben considerarse un sistema de seguridad real. El noindex y una contraseña JavaScript solo reducen exposición casual; no sustituyen autenticación de servidor.

Cuando AMS maneje información sensible o necesite acceso multiusuario/multidispositivo, migrar la operación a backend/base de datos con autenticación real.

## Datos y cumplimiento

- Las rutas internas de operación se marcan como noindex y también se excluyen en robots.txt, pero esto **no constituye autenticación ni seguridad**.
- No guardar datos personales de clientes en el repositorio público.
- El briefing se gestiona en Microsoft Forms; conservar sus respuestas en el entorno autorizado y restringir el acceso.
- Si AMS incorpora analítica, publicidad o cualquier tratamiento no esencial basado en cookies, debe revisarse la Política de Cookies y habilitar el consentimiento que corresponda antes de activarlo.
- Reportar incidentes de seguridad y limitar el acceso a la información afectada.
