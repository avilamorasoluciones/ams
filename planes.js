/* Equivalencias USD de los planes AMS.
   Los precios contractuales permanecen fijos en COP.
   La TRM oficial se publica diariamente; no es una cotización Forex minuto a minuto. */
(() => {
  "use strict";

  const ENDPOINT = "https://www.datos.gov.co/resource/mcec-87by.json?$select=valor,vigenciadesde&$order=vigenciadesde%20DESC&$limit=1";
  const CACHE_KEY = "ams_public_trm_v1";
  const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;
  const AMS_MARGIN_COP = 300;
  const nodes = Array.from(document.querySelectorAll("[data-cop-value]"));
  const statusNode = document.getElementById("amsFxStatus");
  let currentTRM = null;
  let loading = false;

  const copFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2
  });
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Number.isFinite(Number(data.rate)) || Number(data.rate) < 1000) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function formatDate(value) {
    if (!value) return "fecha no disponible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota"
    }).format(date);
  }

  function render(rateData, sourceLabel) {
    const trm = Number(rateData.rate);
    if (!Number.isFinite(trm) || trm < 1000 || trm > 10000) return;
    currentTRM = trm;
    const appliedRate = trm + AMS_MARGIN_COP;

    nodes.forEach((node) => {
      const cop = Number(node.dataset.copValue);
      if (!Number.isFinite(cop) || cop <= 0) return;
      node.textContent = "≈ " + usdFormatter.format(cop / appliedRate) +
        (node.dataset.monthly === "true" ? "/mes" : "");
      node.setAttribute("title",
        copFormatter.format(cop) + " ÷ " + copFormatter.format(appliedRate) + " por USD");
    });

    if (statusNode) {
      statusNode.textContent =
        "Equivalencia informativa: TRM " + copFormatter.format(trm) +
        " + margen AMS " + copFormatter.format(AMS_MARGIN_COP) +
        " = " + copFormatter.format(appliedRate) +
        " por USD. Vigencia: " + formatDate(rateData.validFrom) +
        ". " + (sourceLabel || "Fuente: datos oficiales de la Superintendencia Financiera.");
    }
  }

  async function fetchTRM() {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 7000) : null;
    try {
      const response = await fetch(ENDPOINT, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "application/json" },
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.length) throw new Error("La fuente no devolvió registros");
      const rate = Number(rows[0].valor);
      if (!Number.isFinite(rate) || rate < 1000 || rate > 10000) {
        throw new Error("La TRM recibida no es válida");
      }
      return {
        rate,
        validFrom: rows[0].vigenciadesde || null,
        fetchedAt: new Date().toISOString()
      };
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  async function init() {
    if (loading || !nodes.length) return;
    loading = true;
    const cached = readCache();
    if (cached) render(cached, "Última tasa guardada.");

    const cacheAge = cached && cached.fetchedAt
      ? Date.now() - new Date(cached.fetchedAt).getTime()
      : Infinity;

    if (cached && cacheAge >= 0 && cacheAge < CACHE_MAX_AGE) {
      if (statusNode) statusNode.textContent += " Consulta en caché (actualizada recientemente).";
      loading = false;
      return;
    }

    try {
      const latest = await fetchTRM();
      saveCache(latest);
      render(latest, "Fuente: TRM oficial de datos.gov.co / Superintendencia Financiera.");
    } catch (error) {
      if (cached) {
        if (statusNode) statusNode.textContent += " No se pudo actualizar; se conserva la última TRM guardada.";
      } else if (statusNode) {
        statusNode.textContent =
          "No fue posible consultar la TRM. Los valores COP siguen vigentes; la equivalencia USD inicial es solo orientativa.";
      }
    } finally {
      loading = false;
    }
  }

  init();
})();
