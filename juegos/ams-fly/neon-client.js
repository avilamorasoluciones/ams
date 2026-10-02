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
    clientPromise = import(SDK_URL).then(({createClient}) => createClient({
      auth: {
        url: config.authUrl,
        allowAnonymous: true
      },
      dataApi: {
        url: config.dataApiUrl
      }
    }));
  }
  return clientPromise;
}

window.AMS_FLY_NEON = Object.freeze({
  config,
  getClient
});
})();
