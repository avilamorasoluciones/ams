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

function uiIcon(name, extraClass = "") {
  const cls = ["ui-icon", extraClass].filter(Boolean).join(" ");
  return '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="ui-icons.svg#' + name + '"></use></svg>';
}
window.uiIcon = uiIcon;

/********************
 * SONIDO GLOBAL
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
 * PWA / INSTALACIÓN
 ********************/
const PWA = (() => {
  let deferredPrompt = null;
  let banner = null;
  let installButton = null;
  const DISMISS_KEY = "avila_mora_pwa_install_dismissed_v4";

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://");
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function wasDismissed() {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  }

  function markDismissed() {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }

  function createUI() {
    if (document.getElementById("pwa-install-banner")) return;

    banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.className = "pwa-install-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Instalar Juegos Avila Mora");
    banner.hidden = true;
    banner.innerHTML = `
      <div class="pwa-install-banner-card">
        <div class="pwa-install-banner-icon" aria-hidden="true">
          <img src="pwa-icon-192.svg" alt="">
        </div>
        <div class="pwa-install-banner-copy">
          <strong>Instala Juegos Avila Mora</strong>
          <span id="pwa-install-copy">Ten tus juegos siempre a mano.</span>
        </div>
        <div class="pwa-install-banner-actions">
          <button id="pwa-install-btn" class="pwa-install-banner-btn" type="button">Instalar</button>
          <button id="pwa-install-close" class="pwa-install-banner-close" type="button" aria-label="Cerrar">×</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    installButton = document.getElementById("pwa-install-btn");
    installButton.addEventListener("click", handleInstallClick);
    document.getElementById("pwa-install-close")?.addEventListener("click", () => {
      markDismissed();
      hideBanner();
    });
  }

  function showBanner(mode = "install") {
    if (!banner || isStandalone() || wasDismissed()) return;
    const copy = document.getElementById("pwa-install-copy");
    if (mode === "ios") {
      copy.textContent = "En Safari: Compartir → Añadir a pantalla de inicio.";
      installButton.textContent = "Cómo instalar";
    } else if (mode === "manual") {
      copy.textContent = "Desde el menú del navegador puedes instalar Juegos Avila Mora.";
      installButton.textContent = "Cómo instalar";
    } else {
      copy.textContent = "Ten tus juegos siempre a mano.";
      installButton.textContent = "Instalar";
    }
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add("is-visible"));
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("is-visible");
    setTimeout(() => { if (banner) banner.hidden = true; }, 260);
  }

  async function triggerInstall() {
    if (!deferredPrompt) {
      if (isIOS()) showBanner("ios");
      return;
    }
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === "accepted") {
        hideBanner();
      } else {
        showBanner();
      }
    } catch {
      showBanner();
    }
  }

  function handleInstallClick() {
    if (deferredPrompt) {
      triggerInstall();
      return;
    }
    if (isIOS()) {
      showBanner("ios");
      return;
    }
    alert("Para instalar Juegos Avila Mora, abre el menú del navegador y busca «Instalar aplicación» o «Añadir a pantalla de inicio».");
  }

  function init() {
    try { sessionStorage.removeItem("ams_sw_reloaded_v30"); } catch {}
    createUI();

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredPrompt = event;
      showBanner("install");
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      hideBanner();
    });

    if (isStandalone()) {
      hideBanner();
    } else if (isIOS()) {
      setTimeout(() => showBanner("ios"), 1500);
    } else {
      setTimeout(() => {
        if (!deferredPrompt) showBanner("manual");
      }, 1800);
    }

    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // El nuevo worker ya tomó el control. Recargamos una sola vez para
        // que la página actual use también el HTML/JS/CSS recién publicados.
        if (!hadController) return;
        try {
          if (sessionStorage.getItem("ams_sw_reloaded_v30") === "1") return;
          sessionStorage.setItem("ams_sw_reloaded_v30", "1");
        } catch {}
        window.location.reload();
      });

      navigator.serviceWorker.register("./sw.js?v=20260926-30", {
        scope: "./",
        updateViaCache: "none"
      }).then(registration => {
        // Fuerza una comprobación de actualización en cada entrada,
        // sin depender de cuándo Chrome decida revisar el worker.
        return registration.update();
      }).catch(() => {});
    }
  }

  return { init, triggerInstall };
})();;
window.PWA = PWA;

/********************
 * SESIÓN DE JUEGO
 * Guarda el estado local para recuperar partidas tras recarga,
 * botón atrás o cambio de aplicación.
 ********************/
const GameSession = (() => {
  const PREFIX = "ams_game_session_v2_";
  const MAX_AGE = 24 * 60 * 60 * 1000;

  function save(game, state) {
    try {
      localStorage.setItem(PREFIX + game, JSON.stringify({ ...state, savedAt: Date.now() }));
    } catch {}
  }

  function load(game) {
    try {
      const raw = localStorage.getItem(PREFIX + game);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || Date.now() - Number(data.savedAt || 0) > MAX_AGE) {
        localStorage.removeItem(PREFIX + game);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  let activeSaver = null;

  function clear(game) {
    try { localStorage.removeItem(PREFIX + game); } catch {}
  }

  function register(saver) {
    activeSaver = typeof saver === "function" ? saver : null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") activeSaver?.();
  });
  window.addEventListener("pagehide", () => activeSaver?.());
  window.addEventListener("beforeunload", () => activeSaver?.());

  return { save, load, clear, register };
})();
window.GameSession = GameSession;

/********************
 * TEMA CLARO / OSCURO
 ********************/
const Theme = (() => {
  const KEY = "avila_mora_theme_v3";

  function updateMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", document.body.classList.contains("light-theme") ? "#f8fafc" : "#070A12");
  }

  function updateButtons() {
    const light = document.body.classList.contains("light-theme");
    document.querySelectorAll("[data-theme-toggle]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(light));
      btn.setAttribute("aria-label", light ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
      btn.setAttribute("title", light ? "Modo oscuro" : "Modo claro");
    });
  }

  function apply(mode, persist = true) {
    const light = mode === "light";
    document.body.classList.toggle("light-theme", light);
    if (persist) {
      try { localStorage.setItem(KEY, light ? "light" : "dark"); } catch {}
    }
    updateMeta();
    updateButtons();
  }

  function toggle() {
    const light = !document.body.classList.contains("light-theme");
    apply(light ? "light" : "dark", true);
    if (typeof window.emitSound === "function") window.emitSound(light ? 800 : 400, 0.05, "triangle");
  }

  function init() {
    let saved = "dark";
    try { saved = localStorage.getItem(KEY) || localStorage.getItem("avila_mora_theme_v2") || "dark"; } catch {}
    apply(saved === "light" ? "light" : "dark", false);
    document.querySelectorAll("[data-theme-toggle]").forEach(btn => {
      btn.addEventListener("click", toggle);
    });
  }

  return { init, toggle, apply };
})();
window.Theme = Theme;

/********************
 * NAVEGACIÓN MÓVIL
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

  function populateGameNavigation() {
    if (!panel) return;
    const inner = panel.querySelector(".site-nav-inner");
    if (!inner) return;

    // En las páginas individuales dejamos el menú completo disponible,
    // sin obligar a volver a la portada para cambiar de juego.
    const hasGameLinks = inner.querySelectorAll('a[href$=".html"]').length > 1;
    if (hasGameLinks) return;

    const games = [
      ["index.html", "Menú principal", "home"],
      ["impostor.html", "El Impostor", "user"],
      ["bomba.html", "La Bomba", "bomb"],
      ["nosconocemos.html", "¿Nos Conocemos?", "user"],
      ["rompehielo.html", "Rompehielo", "question"],
      ["tabu.html", "Tabú", "close"],
      ["verdadreto.html", "Verdad o Reto", "flame"],
      ["yonunca.html", "Yo Nunca", "question"]
    ];

    inner.innerHTML = games.map(([href, label, icon]) =>
      '<a class="nav-item" href="' + href + '"><svg class="ui-icon" aria-hidden="true"><use href="ui-icons.svg#' + icon + '"></use></svg><span>' + label + '</span></a>'
    ).join("");
  }

  function init() {
    btn = document.getElementById("navToggle");
    panel = document.getElementById("siteNav");

    if (!btn || !panel) return;

    populateGameNavigation();

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
 * HERRAMIENTAS
 ********************/
const Tools = (() => {
  const $ = (id) => document.getElementById(id);

  const CARD_SUITS = ["S", "H", "D", "C"];
  const CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const DICE_FACES = ["1", "2", "3", "4", "5", "6"];

  function getModal(type) {
    return $(`${type}-modal`);
  }

  function ensureModals() {
    if (document.getElementById("dice-modal") && document.getElementById("cards-modal")) return;

    const host = document.createElement("div");
    host.innerHTML = `
      <div id="dice-modal" class="tool-overlay" role="dialog" aria-modal="true" aria-labelledby="dice-modal-title">
        <div class="box narrow stack center tool-modal-card">
          <button type="button" class="btn ghost modal-close-btn" data-tool-close="dice" aria-label="Cerrar modal de dado">×</button>
          <h2 id="dice-modal-title" class="modal-title color-accent">Lanzar Dado</h2>
          <p class="muted modal-copy">Un comodín para decidir quién empieza, ordenar turnos o desempatar sin salir del juego.</p>
          <div id="dice-result" class="dice-stage" aria-live="polite" aria-label="Resultado del dado">
            <div class="dice-cube" aria-hidden="true">
              <span class="dice-face dice-front">1</span>
              <span class="dice-face dice-back">6</span>
              <span class="dice-face dice-right">3</span>
              <span class="dice-face dice-left">4</span>
              <span class="dice-face dice-top">5</span>
              <span class="dice-face dice-bottom">2</span>
            </div>
          </div>
          <button type="button" class="btn primary btn-xl" data-tool-roll>¡Lanzar!</button>
        </div>
      </div>
      <div id="cards-modal" class="tool-overlay" role="dialog" aria-modal="true" aria-labelledby="cards-modal-title">
        <div class="box narrow stack center tool-modal-card">
          <button type="button" class="btn ghost modal-close-btn" data-tool-close="cards" aria-label="Cerrar modal de cartas">×</button>
          <h2 id="cards-modal-title" class="modal-title color-danger">Sacar Carta</h2>
          <p class="muted modal-copy">Un comodín para resolver decisiones al azar, formar equipos o desempatar dentro de la partida.</p>
          <div id="card-result" class="card-result-box" aria-live="polite">
            <div class="playing-card playing-card-back" aria-label="Carta lista para sacar">
              <span class="playing-card-mark">AMS</span>
            </div>
          </div>
          <button type="button" class="btn danger btn-xl" data-tool-card>¡Sacar Carta!</button>
        </div>
      </div>`;
    while (host.firstElementChild) document.body.appendChild(host.firstElementChild);
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
    if (!resultEl) return;

    // Algunas páginas ya traen un modal antiguo en el HTML. Lo actualizamos
    // aquí para que el botón nunca dependa de que exista previamente el cubo 3D.
    let cube = resultEl.querySelector(".dice-cube");
    if (!cube) {
      resultEl.className = "dice-stage";
      resultEl.innerHTML = `
        <div class="dice-cube" aria-hidden="true">
          <span class="dice-face dice-front">1</span>
          <span class="dice-face dice-back">6</span>
          <span class="dice-face dice-right">3</span>
          <span class="dice-face dice-left">4</span>
          <span class="dice-face dice-top">5</span>
          <span class="dice-face dice-bottom">2</span>
        </div>`;
      cube = resultEl.querySelector(".dice-cube");
    }
    if (!cube || cube.classList.contains("dice-rolling")) return;

    cube.classList.remove("dice-settled");
    cube.classList.add("dice-rolling");
    resultEl.setAttribute("aria-label", "El dado está rodando");

    const finalFace = Math.floor(Math.random() * 6) + 1;
    const rotations = [
      [720, 1080],
      [630, 1080],
      [720, 990],
      [720, 1170],
      [810, 1080],
      [720, 1260]
    ][finalFace - 1];

    cube.style.setProperty("--spin-x", rotations[0] + "deg");
    cube.style.setProperty("--spin-y", rotations[1] + "deg");

    let ticks = 0;
    const tickInt = setInterval(() => {
      window.emitSound(220 + Math.random() * 160, 0.035, "square", 0.18);
      ticks++;
      if (ticks >= 10) {
        clearInterval(tickInt);
        cube.classList.remove("dice-rolling");
        cube.classList.add("dice-settled");
        resultEl.setAttribute("aria-label", "Resultado del dado: " + finalFace);
        window.emitSound(760, 0.08, "triangle", 0.28);
        setTimeout(() => window.emitSound(980, 0.14, "triangle", 0.22), 90);
      }
    }, 120);
  }
  function drawCard() {
    const resultEl = $("card-result");
    if (!resultEl || resultEl.classList.contains("card-flipping")) return;

    resultEl.className = "card-result-box card-flipping";
    resultEl.innerHTML = '<div class="playing-card playing-card-back" aria-label="Sacando carta"><span class="playing-card-mark">AMS</span></div>';
    window.emitSound(360, 0.08, "sawtooth", 0.18);

    setTimeout(() => {
      const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
      const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
      const symbols = { S: "♠", H: "♥", D: "♦", C: "♣" };
      const red = suit === "H" || suit === "D";
      resultEl.className = "card-result-box";
      resultEl.innerHTML =
        '<div class="playing-card ' + (red ? "red" : "black") + '" aria-label="Carta ' + value + ' ' + symbols[suit] + '">' +
          '<span class="card-corner top">' + value + '<b>' + symbols[suit] + '</b></span>' +
          '<span class="card-center-suit">' + symbols[suit] + '</span>' +
          '<span class="card-corner bottom">' + value + '<b>' + symbols[suit] + '</b></span>' +
        '</div>';
      window.emitSound(760, 0.12, "triangle", 0.22);
    }, 420);

    setTimeout(() => resultEl.classList.remove("card-flipping"), 700);
  }
  function bindModalEvents() {
    document.querySelectorAll("[data-tool-close]").forEach((button) => {
      button.addEventListener("click", () => closeModal(button.dataset.toolClose));
    });
    document.querySelectorAll("[data-tool-roll]").forEach((button) => {
      button.addEventListener("click", rollDice);
    });
    document.querySelectorAll("[data-tool-card]").forEach((button) => {
      button.addEventListener("click", drawCard);
    });

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
    ensureModals();
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
 * SELECTOR DE JUEGOS
 ********************/
const GamesMenu = (() => {
  let slides = [];
  let activeIndex = 0;

  function isMobileLayout() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function isAvailableOnCurrentDevice(slide) {
    return isMobileLayout() || slide.dataset.mobileOnly !== "true";
  }

  function visibleSlides() {
    return slides.filter(slide => !slide.hidden && isAvailableOnCurrentDevice(slide));
  }

  function updateDots(list) {
    const dots = document.getElementById("gameDots");
    if (!dots) return;
    dots.innerHTML = list.map((slide, index) =>
      '<button type="button" class="game-dot" data-dot-index="' + index + '" aria-label="Ir a ' +
      (slide.querySelector("h3")?.textContent || "juego") + '" aria-current="' + (index === activeIndex ? "true" : "false") + '"></button>'
    ).join("");
    dots.querySelectorAll("[data-dot-index]").forEach(dot => {
      dot.addEventListener("click", () => goTo(Number(dot.dataset.dotIndex), true));
    });
  }

  function goTo(index, smooth = true) {
    const list = visibleSlides();
    if (!list.length) return;
    activeIndex = Math.max(0, Math.min(index, list.length - 1));
    const carousel = document.getElementById("gameCarousel");
    const slide = list[activeIndex];
    if (carousel && slide) {
      const targetLeft = slide.offsetLeft - Math.max(0, (carousel.clientWidth - slide.offsetWidth) / 2);
      carousel.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth ? "smooth" : "auto"
      });
    }
    updateControls(list);
  }

  function updateControls(list = visibleSlides()) {
    const count = document.getElementById("gameSelectorCount");
    if (count) count.textContent = list.length + " juego" + (list.length === 1 ? "" : "s");
    const prev = document.getElementById("gamePrev");
    const next = document.getElementById("gameNext");
    if (prev) prev.disabled = list.length <= 1 || activeIndex <= 0;
    if (next) next.disabled = list.length <= 1 || activeIndex >= list.length - 1;
    updateDots(list);
  }

  function syncActive() {
    const list = visibleSlides();
    const carousel = document.getElementById("gameCarousel");
    if (!carousel || !list.length) return;
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let best = 0;
    let distance = Infinity;
    list.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const d = Math.abs(slideCenter - center);
      if (d < distance) {
        distance = d;
        best = index;
      }
    });
    activeIndex = best;
    updateControls(list);
  }

  function filter() {
    const input = document.getElementById("gameSearch");
    const query = (input?.value || "").trim().toLowerCase();
    slides.forEach(slide => {
      const haystack = ((slide.dataset.search || "") + " " + (slide.querySelector("h3")?.textContent || "")).toLowerCase();
      const unavailable = !isAvailableOnCurrentDevice(slide);
      slide.hidden = unavailable || Boolean(query && !haystack.includes(query));
    });
    activeIndex = 0;
    const list = visibleSlides();
    if (list.length) list[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    updateControls(list);
    const clear = document.getElementById("gameSearchClear");
    if (clear) clear.classList.toggle("is-visible", Boolean(query));
    const empty = document.getElementById("gameSearchEmpty");
    if (empty) empty.hidden = list.length !== 0;
  }

  function bind() {
    const carousel = document.getElementById("gameCarousel");
    if (!carousel) return;
    slides = [...carousel.querySelectorAll(".game-slide")];

    document.getElementById("gamePrev")?.addEventListener("click", () => goTo(activeIndex - 1));
    document.getElementById("gameNext")?.addEventListener("click", () => goTo(activeIndex + 1));

    const search = document.getElementById("gameSearch");
    search?.addEventListener("input", filter);
    document.getElementById("gameSearchClear")?.addEventListener("click", () => {
      if (search) search.value = "";
      filter();
      search?.focus();
    });

    carousel.addEventListener("scroll", () => {
      window.clearTimeout(carousel._amsScrollTimer);
      carousel._amsScrollTimer = window.setTimeout(syncActive, 90);
    }, { passive: true });

    // El navegador gestiona el gesto táctil de forma nativa.
    // Evitamos pointer capture porque en Android puede cancelar el scroll o los clics.
    carousel.addEventListener("keydown", event => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(activeIndex - 1);
      }
    });

    updateControls();
  }

  function init() {
    bind();
    window.addEventListener("resize", () => {
      const input = document.getElementById("gameSearch");
      if (input) {
        filter();
        return;
      }
      slides.forEach(slide => {
        slide.hidden = !isAvailableOnCurrentDevice(slide);
      });
      activeIndex = 0;
      updateControls();
    }, { passive: true });
  }

  return { init, goTo, filter };
})();
window.GamesMenu = GamesMenu;

/********************
 * APP GLOBAL
 ********************/
const MobileInputGuard = (() => {
  function init() {
    const inputs = document.querySelectorAll("input[type=text], input[type=search]");
    inputs.forEach(input => {
      // The global player field is intentionally focused with preventScroll on
      // the user's tap. This avoids Android Chrome jumping the whole page.
      if (input.id === "globalPlayerInput") {
        input.addEventListener("pointerdown", event => {
          event.preventDefault();
          try { input.focus({ preventScroll: true }); } catch { input.focus(); }
        });
      }

      let lockedScrollY = null;
      let wasVisibleBeforeFocus = false;
      let releaseTimer = null;

      const restoreIfNeeded = () => {
        if (lockedScrollY === null || !wasVisibleBeforeFocus) return;
        // Only undo a browser jump; never call scrollIntoView.
        if (Math.abs(window.scrollY - lockedScrollY) > 2) {
          window.scrollTo(0, lockedScrollY);
        }
      };

      input.addEventListener("focus", () => {
        lockedScrollY = window.scrollY;
        const rect = input.getBoundingClientRect();
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        wasVisibleBeforeFocus = rect.top >= 0 && rect.bottom <= viewportHeight;
        clearTimeout(releaseTimer);
        if (!wasVisibleBeforeFocus) return;

        // Android may reposition once when the keyboard appears. Undo that jump
        // for a short window while the keyboard settles.
        requestAnimationFrame(restoreIfNeeded);
        setTimeout(restoreIfNeeded, 60);
        setTimeout(restoreIfNeeded, 180);
        setTimeout(restoreIfNeeded, 360);
        releaseTimer = setTimeout(() => {
          lockedScrollY = null;
          wasVisibleBeforeFocus = false;
        }, 650);
      });

      input.addEventListener("blur", () => {
        lockedScrollY = null;
        wasVisibleBeforeFocus = false;
        clearTimeout(releaseTimer);
      });
    });
  }
  return { init };
})();

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
    Theme.init();
Nav.init();
    Tools.init();
    MobileInputGuard.init();
    GamesMenu.init();
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