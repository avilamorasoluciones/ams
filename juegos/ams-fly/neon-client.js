(() => {
"use strict";

const SDK_URL = "https://esm.sh/@neondatabase/neon-js@0.7.0-beta?bundle";
const config = window.AMS_FLY_NEON_CONFIG || {};
let clientPromise = null;
let publicClientPromise = null;

async function getClient() {
  if (!config.authUrl || !config.dataApiUrl) {
    throw new Error("Neon Auth/Data API todavía no está configurado.");
  }

  if (!clientPromise) {
    clientPromise = import(SDK_URL).then(({ createClient, BetterAuthVanillaAdapter }) => {
      if (typeof BetterAuthVanillaAdapter !== "function") {
        throw new Error("El SDK de Neon no cargó BetterAuthVanillaAdapter.");
      }

      return createClient({
        auth: {
          adapter: BetterAuthVanillaAdapter(),
          url: config.authUrl,
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

async function getPublicClient() {
  if (!config.dataApiUrl) {
    throw new Error("Neon Data API todavía no está configurado.");
  }
  if (!publicClientPromise) {
    publicClientPromise = import("https://esm.sh/@neondatabase/postgrest-js@0.2.0-beta?bundle")
      .then(({ NeonPostgrestClient }) => {
        if (typeof NeonPostgrestClient !== "function") {
          throw new Error("No se pudo cargar el cliente público de Neon Data API.");
        }
        return new NeonPostgrestClient({
          dataApiUrl: config.dataApiUrl,
          options: { db: { schema: "public" } }
        });
      });
  }
  return publicClientPromise;
}

window.AMS_FLY_NEON = Object.freeze({
  config,
  getClient,
  getPublicClient
});

})();