/* Selector de tarifas fijas COP/USD para los planes públicos de AMS. */
(() => {
  "use strict";

  const priceNodes = Array.from(document.querySelectorAll("[data-cop-value][data-usd-value]"));
  const currencyButtons = Array.from(document.querySelectorAll("[data-currency]"));
  const statusNode = document.getElementById("amsFxStatus");

  const copFormatter = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0
  });
  const usdFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  });

  let selectedCurrency = "COP";

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
      const value = Number(selectedCurrency === "USD"
        ? node.dataset.usdValue
        : node.dataset.copValue);
      if (!Number.isFinite(value) || value < 0) return;

      const prefix = node.dataset.prefix || "";
      const formatted = selectedCurrency === "USD"
        ? "US$ " + usdFormatter.format(value)
        : "COP $" + copFormatter.format(value);
      node.textContent = prefix + formatted;
    });
  }

  function selectCurrency(nextCurrency) {
    if (nextCurrency !== "COP" && nextCurrency !== "USD") return;
    selectedCurrency = nextCurrency;
    updateButtons();
    renderPrices();
    setStatus(nextCurrency === "USD"
      ? "Tarifas fijas en dólares estadounidenses."
      : "Tarifas fijas en pesos colombianos.");
  }

  currencyButtons.forEach((button) => {
    button.addEventListener("click", () => selectCurrency(button.dataset.currency));
  });

  updateButtons();
  renderPrices();
  setStatus("Tarifas fijas en pesos colombianos.");
})();
