// AMS Fly · Neon public configuration
// Estas URL no son secretos. Nunca pongas aquí DATABASE_URL, contraseñas o API keys.

window.AMS_FLY_NEON_CONFIG = Object.freeze({
  authUrl: "https://ep-curly-resonance-b4qb9jl8.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth",
  // Neon Console → Data API → URL del branch production.
  dataApiUrl: "https://ep-curly-resonance-b4qb9jl8.apirest.c-6.us-east-2.aws.neon.tech/neondb/rest/v1",
  // La identidad del piloto se gestiona exclusivamente con Neon Auth. No hay backend SMS.
});
