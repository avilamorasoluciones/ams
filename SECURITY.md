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
