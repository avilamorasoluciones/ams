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
  const DISMISS_KEY = "avila_mora_pwa_install_dismissed_v2";

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
          <img src="icon-192.svg" alt="">
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
      }, 2800);
    }

    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" }).catch(() => {});
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
      resultEl.classList.add(suit === "H" || suit === "D" ? "red" : "black");

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


 * MÚSICA AMBIENTAL
 ********************/
const PartyMusic = (() => {
  let ctx = null;
  let master = null;
  let compressor = null;
  let timer = null;
  let enabled = false;
  let step = 0;

  const chords = [
    [196.00, 246.94, 293.66],
    [174.61, 220.00, 261.63],
    [146.83, 196.00, 246.94],
    [164.81, 207.65, 246.94]
  ];

  function playChord(notes) {
    if (!ctx || !master || !enabled) return;
    const now = ctx.currentTime;
    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(frequency, now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1700, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime([0.13, 0.085, 0.06][index], now + 0.32);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  function playPulse() {
    if (!ctx || !master || !enabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.exponentialRampToValueAtTime(196, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  async function ensureContext() {
    if (!ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) throw new Error("Web Audio no disponible");
      ctx = new AudioCtor({ latencyHint: "interactive" });
      master = ctx.createGain();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.2;
      master.gain.value = 0.86;
      master.connect(compressor);
      compressor.connect(ctx.destination);
    }
    if (ctx.state === "suspended" || ctx.state === "interrupted") {
      await ctx.resume();
    }
    if (ctx.state !== "running") throw new Error("AudioContext no está activo");
  }

  async function start() {
    try {
      await ensureContext();
      enabled = true;
      if (master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.86, ctx.currentTime, 0.05);
      }
      step = 0;
      playPulse();
      playChord(chords[step]);
      step++;
      clearInterval(timer);
      timer = setInterval(() => {
        if (ctx && ctx.state === "running") {
          playChord(chords[step % chords.length]);
          step++;
        }
      }, 3000);
      updateButton();
    } catch {
      enabled = false;
      updateButton();
    }
  }

  function stop() {
    enabled = false;
    clearInterval(timer);
    timer = null;
    if (master && ctx) {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      } catch {}
    }
    updateButton();
  }

  function toggle() {
    if (enabled) stop();
    else start();
  }

  function updateButton() {
    const button = document.getElementById("musicToggle");
    if (!button) return;
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("title", enabled ? "Apagar música ambiental" : "Activar música ambiental");
    const small = button.querySelector("small");
    if (small) small.textContent = enabled ? "Encendida" : "Ambiente";
  }

  function init() {
    document.getElementById("musicToggle")?.addEventListener("click", toggle);
    document.addEventListener("visibilitychange", () => {
      if (enabled && ctx && document.visibilityState === "visible") {
        ctx.resume().catch(() => {});
      }
    });
    updateButton();
  }

  return { init, start, stop, toggle };
})();
window.PartyMusic = PartyMusic;

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
    PartyMusic.init();
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