/********************
 * UTILIDADES GLOBALES
 ********************/
const Utils = (() => {
  const $ = (id) => document.getElementById(id);

  function safeJSONParse(value, fallback = null) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function shuffleArray(arr) {
    const clone = [...arr];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  function pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setPlayingMode(isPlaying) {
    document.body.classList.toggle("playing", Boolean(isPlaying));
  }

  function escapeHTML(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return {
    $,
    safeJSONParse,
    shuffleArray,
    pickRandom,
    scrollTop,
    setPlayingMode,
    escapeHTML
  };
})();
window.Utils = Utils;

/********************
 * SONIDO GLOBAL 🎧
 ********************/
let audioCtx;

function emitSound(frequency, duration, waveType = "sine", volume = 0.5) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Silencioso a propósito
  }
}
window.emitSound = emitSound;

/********************
 * PWA / INSTALACIÓN 📲
 ********************/
const PWA = (() => {
  let deferredPrompt = null;
  let installButton = null;
  let modal = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function createUI() {
    if (document.getElementById("pwa-install-btn")) return;

    const dock = document.createElement("div");
    dock.className = "pwa-dock";
    const hasThemeControl = Boolean(document.getElementById("themeToggleBtn"));
    dock.innerHTML = `
      <button id="appearance-fab" class="pwa-fab" type="button" aria-label="Cambiar apariencia" title="Cambiar apariencia">🎨</button>
      ${hasThemeControl ? "" : '<button id="pwa-theme-fab" class="pwa-fab" type="button" aria-label="Cambiar modo claro u oscuro" title="Modo claro u oscuro">🌓</button>'}
      <button id="pwa-install-btn" class="pwa-fab install-fab" type="button" aria-label="Instalar Juegos Avila Mora" title="Instalar Juegos" hidden>📲</button>
    `;
    document.body.appendChild(dock);

    installButton = document.getElementById("pwa-install-btn");
    document.getElementById("appearance-fab")?.addEventListener("click", () => Appearance.open());
    document.getElementById("pwa-theme-fab")?.addEventListener("click", () => Theme.toggle());

    modal = document.createElement("div");
    modal.id = "pwa-install-modal";
    modal.className = "tool-overlay";
    modal.innerHTML = `
      <div class="box narrow stack center tool-modal-card pwa-install-card" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <button type="button" class="btn ghost modal-close-btn" id="pwa-install-close" aria-label="Cerrar instalación">❌</button>
        <div class="emoji-display">📲</div>
        <h2 id="pwa-install-title" class="modal-title color-accent">Lleva los juegos contigo</h2>
        <p class="muted modal-copy" id="pwa-install-copy"></p>
        <div class="pwa-install-steps" id="pwa-install-steps"></div>
        <button type="button" class="btn primary btn-xl" id="pwa-install-action">Instalar</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("pwa-install-close")?.addEventListener("click", closeInstallModal);
    modal.addEventListener("click", event => {
      if (event.target === modal) closeInstallModal();
    });
    installButton.addEventListener("click", handleInstallClick);
  }

  function showButton() {
    if (installButton && !isStandalone()) installButton.hidden = false;
  }

  function hideButton() {
    if (installButton) installButton.hidden = true;
  }

  function openInstallModal() {
    if (!modal) return;
    const copy = document.getElementById("pwa-install-copy");
    const steps = document.getElementById("pwa-install-steps");
    const action = document.getElementById("pwa-install-action");

    if (isIOS()) {
      copy.textContent = "En iPhone o iPad la instalación se hace desde el menú de compartir de Safari.";
      steps.innerHTML = `
        <ol>
          <li>Abre este sitio en <strong>Safari</strong>.</li>
          <li>Toca <strong>Compartir</strong> ⬆️.</li>
          <li>Elige <strong>Añadir a pantalla de inicio</strong>.</li>
          <li>Confirma con <strong>Añadir</strong>.</li>
        </ol>
      `;
      action.textContent = "Entendido";
      action.onclick = closeInstallModal;
    } else {
      copy.textContent = "Instálalo como una aplicación para abrir tus juegos desde el celular o computador sin buscar la web cada vez.";
      steps.innerHTML = `
        <ul>
          <li>Se creará un acceso directo con el icono de Juegos Avila Mora.</li>
          <li>La aplicación abrirá en modo independiente.</li>
          <li>Los recursos principales quedarán disponibles incluso sin conexión después de la primera carga.</li>
        </ul>
      `;
      action.textContent = "Instalar ahora";
      action.onclick = triggerInstall;
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("appearance-picker-open");
    document.body.style.overflow = "hidden";
  }

  function closeInstallModal() {
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  async function triggerInstall() {
    if (!deferredPrompt) {
      openInstallModal();
      return;
    }

    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    hideButton();

    try {
      await promptEvent.prompt();
    } catch (error) {
      showButton();
    }
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await triggerInstall();
      return;
    }
    openInstallModal();
  }

  function init() {
    createUI();

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredPrompt = event;
      showButton();
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      hideButton();
      closeInstallModal();
    });

    if (isStandalone()) {
      hideButton();
    } else if (isIOS()) {
      showButton();
    }

    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" }).catch(() => {});
    }
  }

  return { init, openInstallModal, triggerInstall };
})();
window.PWA = PWA;

/********************
 * APARIENCIAS 🎨
 ********************/
const Appearance = (() => {
  const KEY = "avila_mora_appearance_v1";
  const OPTIONS = {
    original: {
      name: "Original",
      icon: "🎮",
      description: "La apariencia original de Juegos Avila Mora, sin cambios visuales."
    },
    neon: {
      name: "Neon Pulse",
      icon: "🌌",
      description: "El estilo actual: cyber, brillante y energético."
    },
    aurora: {
      name: "Aurora Glass",
      icon: "🌈",
      description: "Cristal translúcido, auroras suaves y sensación premium."
    },
    arcade: {
      name: "Arcade Pixel",
      icon: "🕹️",
      description: "Retro, cuadrado y con vibra de máquina arcade."
    },
    sakura: {
      name: "Sakura Dream",
      icon: "🌸",
      description: "Suave, colorido y juguetón, inspirado en una estética anime."
    },
    luxe: {
      name: "Midnight Luxe",
      icon: "✨",
      description: "Elegante, sobrio y con detalles dorados sobre negro."
    }
  };

  function current() {
    return document.body.dataset.appearance || "original";
  }

  function apply(name, persist = true) {
    const next = OPTIONS[name] ? name : "original";
    Object.keys(OPTIONS).forEach(key => document.body.classList.remove(`appearance-${key}`));
    if (next !== "original") {
      document.body.classList.add(`appearance-${next}`);
    }
    document.body.dataset.appearance = next;
    if (persist) localStorage.setItem(KEY, next);
    updateButtons(next);
    updateAppearanceMeta();
    close();
  }

  function updateAppearanceMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const computed = getComputedStyle(document.body).getPropertyValue("--theme-color").trim();
    if (computed) meta.setAttribute("content", computed);
  }

  function updateButtons(active) {
    document.querySelectorAll("[data-appearance-choice]").forEach(button => {
      const selected = button.dataset.appearanceChoice === active;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
  }

  function buildModal() {
    if (document.getElementById("appearance-modal")) return;

    const modal = document.createElement("div");
    modal.id = "appearance-modal";
    modal.className = "tool-overlay";
    modal.innerHTML = `
      <div class="box narrow stack appearance-modal-card" role="dialog" aria-modal="true" aria-labelledby="appearance-title">
        <button type="button" class="btn ghost modal-close-btn" id="appearance-close" aria-label="Cerrar apariencias">❌</button>
        <div class="center">
          <div class="emoji-display">🎨</div>
          <h2 id="appearance-title" class="modal-title color-primary">Apariencia</h2>
          <p class="muted modal-copy">Elige un estilo visual. El modo claro u oscuro sigue funcionando por separado.</p>
        </div>
        <div class="appearance-grid">
          ${Object.entries(OPTIONS).map(([key, option]) => `
            <button type="button" class="appearance-choice" data-appearance-choice="${key}" role="radio" aria-checked="false">
              <span class="appearance-choice-icon">${option.icon}</span>
              <span class="appearance-choice-copy"><strong>${option.name}</strong><small>${option.description}</small></span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", event => {
      const choice = event.target.closest("[data-appearance-choice]");
      if (choice) {
        apply(choice.dataset.appearanceChoice);
        return;
      }
      if (event.target === modal) close();
    });
    document.getElementById("appearance-close")?.addEventListener("click", close);
  }

  function open() {
    buildModal();
    const modal = document.getElementById("appearance-modal");
    if (!modal) return;
    updateButtons(current());
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("appearance-picker-open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    const modal = document.getElementById("appearance-modal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.removeProperty("overflow");
    document.body.classList.remove("appearance-picker-open");
  }

  function init() {
    const saved = localStorage.getItem(KEY);
    apply(saved && OPTIONS[saved] ? saved : "original", false);
    buildModal();
  }

  return { init, apply, open, close };
})();
window.Appearance = Appearance;

/********************
 * NAVEGACIÓN MÓVIL ☰
 ********************/
const Nav = (() => {
  let btn = null;
  let panel = null;

  function getFirstItem() {
    return panel?.querySelector(".nav-item");
  }

  function isDesktop() {
    return window.matchMedia("(min-width: 860px)").matches;
  }

  function isOpen() {
    return btn?.getAttribute("aria-expanded") === "true";
  }

  function open() {
    if (!btn || !panel) return;
    panel.hidden = false;
    panel.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    setTimeout(() => getFirstItem()?.focus(), 0);
  }

  function close(focusButton = false) {
    if (!btn || !panel) return;
    panel.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    if (focusButton) {
      setTimeout(() => btn.focus(), 0);
    }
  }

  function toggle() {
    if (!btn || !panel) return;
    isOpen() ? close(true) : open();
  }

  function bindEvents() {
    if (!btn || !panel) return;

    btn.addEventListener("click", toggle);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close(true);
    });

    document.addEventListener("click", (e) => {
      if (isDesktop() || panel.hidden) return;
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        close(false);
      }
    });

    panel.querySelectorAll("a, button").forEach((item) => {
      item.addEventListener("click", () => {
        if (!isDesktop()) close(false);
      });
    });

    window.addEventListener("resize", () => {
      if (isDesktop()) {
        panel.hidden = false;
        panel.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      } else if (!isOpen()) {
        panel.hidden = true;
      }
    });
  }

  function init() {
    btn = document.getElementById("navToggle");
    panel = document.getElementById("siteNav");

    if (!btn || !panel) return;

    // FUERZA EL CIERRE SIEMPRE AL INICIAR
    panel.hidden = true;
    panel.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");

    bindEvents();
  }

  return { init, open, close, toggle };
})();
window.Nav = Nav;

/********************
 * HERRAMIENTAS 🎲🃏
 ********************/
const Tools = (() => {
  const $ = (id) => document.getElementById(id);

  const CARD_SUITS = ["♠", "♥", "♦", "♣"];
  const CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  function getModal(type) {
    return $(`${type}-modal`);
  }

  function openModal(type) {
    const modal = getModal(type);
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    window.emitSound(400, 0.05, "triangle");
  }

  function closeModal(type) {
    const modal = getModal(type);
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
    window.emitSound(300, 0.05, "triangle");
  }

  function closeAllModals() {
    ["dice", "cards"].forEach((type) => {
      const modal = getModal(type);
      if (modal) modal.classList.remove("active");
    });
    document.body.style.overflow = "";
  }

  function rollDice() {
    const resultEl = $("dice-result");
    if (!resultEl || resultEl.classList.contains("dice-rolling")) return;

    resultEl.classList.add("dice-rolling");

    let ticks = 0;
    const tickInt = setInterval(() => {
      resultEl.textContent = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
      window.emitSound(800 + Math.random() * 400, 0.02, "square", 0.3);
      ticks++;

      if (ticks > 8) {
        clearInterval(tickInt);
        resultEl.classList.remove("dice-rolling");

        const finalFace = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
        resultEl.textContent = finalFace;

        window.emitSound(1000, 0.1, "triangle");
        setTimeout(() => window.emitSound(1200, 0.15, "triangle"), 100);
      }
    }, 50);
  }

  function drawCard() {
    const resultEl = $("card-result");
    if (!resultEl || resultEl.classList.contains("card-flipping")) return;

    resultEl.classList.add("card-flipping");
    window.emitSound(400, 0.1, "sawtooth");

    setTimeout(() => {
      const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
      const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];

      resultEl.textContent = `${value}${suit}`;
      resultEl.className = "card-result-box";
      resultEl.classList.add(suit === "♥" || suit === "♦" ? "red" : "black");

      window.emitSound(800, 0.15, "triangle");
    }, 250);

    setTimeout(() => {
      resultEl.classList.remove("card-flipping");
    }, 500);
  }

  function bindModalEvents() {
    ["dice", "cards"].forEach((type) => {
      const modal = getModal(type);
      if (!modal) return;

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal(type);
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllModals();
      }
    });
  }

  function init() {
    bindModalEvents();
  }

  return {
    init,
    openModal,
    closeModal,
    closeAllModals,
    rollDice,
    drawCard
  };
})();
window.Tools = Tools;

/********************
 * TEMA (CLARO/OSCURO) 🌓
 ********************/
const Theme = (() => {
  const THEME_KEY = "avila_mora_theme_v2";

  function updateMetaTheme() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const isLight = document.body.classList.contains("light-theme");
    meta.setAttribute("content", isLight ? "#f8fafc" : "#070A12");
  }

  function updateIcon(mode) {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.textContent = mode === "light" ? "☀️" : "🌓";
  }

  function apply(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("light-theme", isLight);
    updateIcon(isLight ? "light" : "dark");
    updateMetaTheme();
  }

  function init() {
    const saved = localStorage.getItem(THEME_KEY);
    apply(saved === "light" ? "light" : "dark");
  }

  function toggle() {
    const willBeLight = !document.body.classList.contains("light-theme");
    const mode = willBeLight ? "light" : "dark";
    apply(mode);
    localStorage.setItem(THEME_KEY, mode);
    window.emitSound(willBeLight ? 800 : 400, 0.05, "triangle");
  }

  return { init, toggle, apply };
})();
window.Theme = Theme;

/********************
 * APP GLOBAL
 ********************/
const App = (() => {
  function initExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      if (!link.hasAttribute("rel")) {
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function init() {
    PWA.init();
    Appearance.init();
    Theme.init();
    Nav.init();
    Tools.init();
    initExternalLinks();
  }

  return { init };
})();
window.App = App;

/********************
 * INICIALIZACIÓN
 ********************/
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});