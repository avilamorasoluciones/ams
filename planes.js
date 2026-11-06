/* Selector COP/USD para los planes públicos de AMS. */
(() => {
  "use strict";

  const ENDPOINT = "https://www.datos.gov.co/resource/mcec-87by.json?$select=valor,vigenciadesde&$order=vigenciadesde%20DESC&$limit=1";
  const CACHE_KEY = "ams_public_trm_v1";
  const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;
  const AMS_MARGIN_COP = 300;

  const priceNodes = Array.from(document.querySelectorAll("[data-cop-value]"));
  const currencyButtons = Array.from(document.querySelectorAll("[data-currency]"));
  const statusNode = document.getElementById("amsFxStatus");

  const copFormatter = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0
  });
  const usdFormatter = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  let selectedCurrency = "COP";
  let rateData = null;
  let rateRequest = null;

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const rate = Number(data && data.rate);
      if (!Number.isFinite(rate) || rate < 1000 || rate > 10000) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function saveCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (_) {
      // La moneda sigue funcionando durante esta visita aunque el navegador no permita guardar caché.
    }
  }

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message;
  }

  function updateButtons() {
    currencyButtons.forEach((button) => {
      const active = button.dataset.currency === selectedCurrency;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderPrices() {
    priceNodes.forEach((node) => {
      const copValue = Number(node.dataset.copValue);
      if (!Number.isFinite(copValue) || copValue < 0) return;

      const prefix = node.dataset.prefix || "";
      if (selectedCurrency === "USD") {
        if (!rateData) return;
        const appliedRate = Number(rateData.rate) + AMS_MARGIN_COP;
        node.textContent = prefix + "US$ " + usdFormatter.format(copValue / appliedRate);
      } else {
        node.textContent = prefix + "COP $" + copFormatter.format(copValue);
      }
    });
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
      if (!response.ok) throw new Error("No se pudo consultar la tasa");
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.length) throw new Error("No hay una tasa disponible");

      const rate = Number(rows[0].valor);
      if (!Number.isFinite(rate) || rate < 1000 || rate > 10000) {
        throw new Error("La tasa recibida no es válida");
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

  function refreshRate() {
    if (rateRequest) return rateRequest;

    rateRequest = fetchTRM()
      .then((latest) => {
        rateData = latest;
        saveCache(latest);
        if (selectedCurrency === "USD") renderPrices();
        return latest;
      })
      .catch((error) => {
        rateRequest = null;
        throw error;
      });

    return rateRequest;
  }

  async function selectCurrency(nextCurrency) {
    if (nextCurrency !== "COP" && nextCurrency !== "USD") return;

    if (nextCurrency === "USD" && !rateData) {
      setStatus("Consultando el valor en dólares…");
      try {
        await refreshRate();
      } catch (_) {
        selectedCurrency = "COP";
        updateButtons();
        renderPrices();
        setStatus("No pudimos actualizar el dólar. Puedes consultar los precios en COP.");
        return;
      }
    }

    selectedCurrency = nextCurrency;
    updateButtons();
    renderPrices();
    setStatus(nextCurrency === "USD"
      ? "Valores aproximados en dólares."
      : "Precios en pesos colombianos.");
  }

  currencyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectCurrency(button.dataset.currency);
    });
  });

  const cached = readCache();
  if (cached) rateData = cached;

  updateButtons();
  renderPrices();
  setStatus("Precios en pesos colombianos.");

  const cacheAge = cached && cached.fetchedAt
    ? Date.now() - new Date(cached.fetchedAt).getTime()
    : Infinity;

  if (!cached || cacheAge < 0 || cacheAge >= CACHE_MAX_AGE) {
    refreshRate().catch(() => {
      // La cotización COP siempre permanece disponible aunque la fuente de cambio falle.
    });
  }
})();
