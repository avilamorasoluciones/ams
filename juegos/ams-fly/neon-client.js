(() => {
"use strict";

const SDK_URL = "https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle";
const config = window.AMS_FLY_NEON_CONFIG || {};
let clientPromise = null;

async function getClient() {
  if (!config.authUrl || !config.dataApiUrl) {
    throw new Error("Neon Auth/Data API todavía no está configurado.");
  }

  if (!clientPromise) {
    clientPromise = import(SDK_URL).then(({ createClient, BetterAuthVanillaAdapter }) => {
      if (typeof createClient !== "function") {
        throw new Error("El SDK de Neon no cargó createClient.");
      }
      if (typeof BetterAuthVanillaAdapter !== "function") {
        throw new Error("El SDK de Neon no cargó BetterAuthVanillaAdapter.");
      }

      return createClient({
        auth: {
          adapter: BetterAuthVanillaAdapter(),
          url: config.authUrl,
          // El juego público usa el rol anonymous mediante el JWT
          // emitido por Neon Auth. El administrador sigue usando su
          // sesión normal con este mismo cliente.
          allowAnonymous: true
        },
        dataApi: {
          url: config.dataApiUrl
        }
      });
    });
  }

  return clientPromise;
}

// IMPORTANTE: no crear un NeonPostgrestClient "desnudo" aquí.
// La Data API de Neon exige un JWT. getClient() obtiene/inyecta
// automáticamente el token anónimo cuando no hay sesión iniciada.
async function getPublicClient() {
  return getClient();
}

window.AMS_FLY_NEON = Object.freeze({
  config,
  getClient,
  getPublicClient
});

})();