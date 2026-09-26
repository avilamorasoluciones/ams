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
  let banner = null;
  let installButton = null;
  const DISMISS_KEY = "avila_mora_pwa_install_dismissed_v1";

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

    const dock = document.createElement("div");
    dock.className = "pwa-dock";
    const hasThemeControl = Boolean(document.getElementById("themeToggleBtn"));
    dock.innerHTML = `
      <button id="appearance-fab" class="pwa-fab" type="button" aria-label="Cambiar apariencia" title="Cambiar apariencia">🎨</button>
      ${hasThemeControl ? "" : '<button id="pwa-theme-fab" class="pwa-fab" type="button" aria-label="Cambiar modo claro u oscuro" title="Modo claro u oscuro">🌓</button>'}
    `;
    document.body.appendChild(dock);

    document.getElementById("appearance-fab")?.addEventListener("click", () => Appearance.open());
    document.getElementById("pwa-theme-fab")?.addEventListener("click", () => Theme.toggle());

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
    triggerInstall();
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
    }

    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" }).catch(() => {});
    }
  }

  return { init, triggerInstall };
})();;
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

  function updateIcon() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;
    btn.innerHTML = '<img src="tool-theme.svg" alt="">';
  }

  function apply(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("light-theme", isLight);
    updateIcon();
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
 * MÚSICA AMBIENTAL
 ********************/
const PartyMusic = (() => {
  let ctx = null;
  let master = null;
  let timer = null;
  let enabled = false;
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
      filter.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055 / (index + 1), now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 3.6);
    });
  }

  async function start() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.72;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") await ctx.resume();
      enabled = true;
      playChord(chords[0]);
      let step = 1;
      clearInterval(timer);
      timer = setInterval(() => {
        playChord(chords[step % chords.length]);
        step++;
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
    list[activeIndex].scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "nearest",
      inline: "center"
    });
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

    // Gesto híbrido: el dedo puede desplazarse verticalmente por la página
    // y solo se captura cuando realmente empieza un gesto horizontal.
    let drag = null;
    carousel.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse") return;
      drag = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: carousel.scrollLeft,
        horizontal: false,
        dx: 0,
        pointerId: event.pointerId
      };
      try { carousel.setPointerCapture(event.pointerId); } catch {}
      carousel.classList.remove("is-dragging");
    }, { passive: true });

    carousel.addEventListener("pointermove", event => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.horizontal && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (!drag.horizontal && Math.abs(dy) > Math.abs(dx)) {
        drag = null;
        carousel.classList.remove("is-dragging");
        return;
      }
      if (Math.abs(dx) >= Math.abs(dy)) {
        drag.horizontal = true;
        drag.dx = dx;
        carousel.classList.add("is-dragging");
        event.preventDefault();
        carousel.scrollLeft = drag.scrollLeft - dx;
      }
    }, { passive: false });

    const finishDrag = () => {
      if (!drag) return;
      const wasHorizontal = drag.horizontal;
      const dx = drag.dx;
      const pointerId = drag.pointerId;
      drag = null;
      carousel.classList.remove("is-dragging");
      try { carousel.releasePointerCapture(pointerId); } catch {}
      if (wasHorizontal && Math.abs(dx) > 36) {
        goTo(activeIndex + (dx < 0 ? 1 : -1), true);
      } else if (wasHorizontal) {
        syncActive();
      }
    };
    carousel.addEventListener("pointerup", finishDrag, { passive: true });
    carousel.addEventListener("pointercancel", finishDrag, { passive: true });
    carousel.addEventListener("pointerleave", finishDrag, { passive: true });

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
    Appearance.init();
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