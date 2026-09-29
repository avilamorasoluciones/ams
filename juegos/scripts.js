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

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  async function triggerInstall() {
    if (!deferredPrompt || isStandalone()) return false;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      return true;
    } catch {
      return false;
    }
  }

  function init() {
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredPrompt = event;
      // El banner visual vive en index.html; evitamos crear un segundo banner.
      const banner = document.getElementById("amsGamesInstall");
      if (banner && !isStandalone()) banner.classList.add("show");
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      document.getElementById("amsGamesInstall")?.classList.remove("show");
    });

    if ("serviceWorker" in navigator &&
        (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("./sw.js?v=20260929-37", {
        scope: "./",
        updateViaCache: "none"
      }).then(registration => registration.update()).catch(() => {});
    }
  }

  return { init, triggerInstall };
})();

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

    const randomInt = (max) => {
      try {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0] % max;
      } catch {
        return Math.floor(Math.random() * max);
      }
    };

    const finalFace = randomInt(6) + 1;

    // Duración continua y aleatoria: desde muy rápido hasta una tirada
    // deliberadamente larga. No hay solo 3 velocidades predeterminadas.
    const duration = 650 + randomInt(2151); // 650–2800 ms
    const rotations = [720, 900, 1080, 1260, 1440, 1620, 1800, 1980];
    const spinX = rotations[randomInt(rotations.length)] + randomInt(360);
    const spinY = rotations[randomInt(rotations.length)] + randomInt(360);

    const front = cube.querySelector(".dice-front");
    if (front) front.textContent = String(finalFace);

    cube.classList.remove("dice-settled", "dice-rolling");
    cube.style.animationDuration = duration + "ms";
    cube.style.setProperty("--spin-x", spinX + "deg");
    cube.style.setProperty("--spin-y", spinY + "deg");

    void cube.offsetWidth;
    cube.classList.add("dice-rolling");
    resultEl.setAttribute("aria-label", "El dado está rodando");

    let elapsed = 0;
    const tickEvery = Math.max(95, Math.min(145, duration / 14));
    const tickInt = setInterval(() => {
      window.emitSound(220 + randomInt(161), 0.035, "square", 0.18);
      elapsed += tickEvery;
      if (elapsed >= duration) {
        clearInterval(tickInt);
        cube.classList.remove("dice-rolling");
        cube.style.animationDuration = "";
        cube.style.transform = "rotateX(0deg) rotateY(0deg)";
        cube.classList.add("dice-settled");
        resultEl.setAttribute("aria-label", "Resultado del dado: " + finalFace);
        window.emitSound(760, 0.08, "triangle", 0.28);
        setTimeout(() => window.emitSound(980, 0.14, "triangle", 0.22), 90);
      }
    }, tickEvery);
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
  let renderedListKey = "";
  let rafId = 0;

  function isMobileLayout() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function isAvailableOnCurrentDevice(slide) {
    return isMobileLayout() || slide.dataset.mobileOnly !== "true";
  }

  function visibleSlides() {
    return slides.filter(slide => !slide.hidden && isAvailableOnCurrentDevice(slide));
  }

  function listKey(list) {
    return list.map(slide => slide.dataset.game || slide.querySelector("h3")?.textContent || "").join("|");
  }

  // Los puntos se crean una sola vez. Antes se reconstruían en cada evento
  // de scroll, lo que hacía que el indicador se sintiera retrasado durante
  // un arrastre lento.
  function renderDots(list) {
    const dots = document.getElementById("gameDots");
    if (!dots) return;
    const key = listKey(list);
    if (key === renderedListKey) return;

    renderedListKey = key;
    dots.innerHTML = list.map((slide, index) =>
      '<button type="button" class="game-dot" data-dot-index="' + index +
      '" aria-label="Ir a ' + (slide.querySelector("h3")?.textContent || "juego") +
      '" aria-current="' + (index === activeIndex ? "true" : "false") + '"></button>'
    ).join("");

    dots.querySelectorAll("[data-dot-index]").forEach(dot => {
      dot.addEventListener("click", () => goTo(Number(dot.dataset.dotIndex), true));
    });
  }

  function paintActiveDot(list) {
    const dots = document.querySelectorAll("#gameDots [data-dot-index]");
    dots.forEach(dot => {
      dot.setAttribute("aria-current", String(Number(dot.dataset.dotIndex) === activeIndex));
    });
  }

  function updateDots(list) {
    renderDots(list);
    paintActiveDot(list);
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

  function updateSlideIndices(list) {
    const total = list.length;
    slides.forEach(slide => {
      const index = list.indexOf(slide);
      const label = slide.querySelector(".game-slide-index");
      if (!label) return;
      if (index < 0 || !total) {
        label.textContent = "";
        return;
      }
      label.textContent = String(index + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    });
  }

  function updateControls(list = visibleSlides()) {
    const count = document.getElementById("gameSelectorCount");
    if (count) count.textContent = list.length + " juego" + (list.length === 1 ? "" : "s");
    updateSlideIndices(list);

    const prev = document.getElementById("gamePrev");
    const next = document.getElementById("gameNext");
    if (prev) prev.disabled = list.length <= 1 || activeIndex <= 0;
    if (next) next.disabled = list.length <= 1 || activeIndex >= list.length - 1;

    updateDots(list);
  }

  function syncActive() {
    rafId = 0;
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

    if (best !== activeIndex) {
      activeIndex = best;
      // Solo actualizamos el estado visual del punto. No tocamos el DOM
      // completo ni volvemos a crear los botones durante el scroll.
      paintActiveDot(list);
    }
  }

  function scheduleSync() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(syncActive);
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
    renderedListKey = "";
    const list = visibleSlides();

    if (list.length) {
      list[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

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

    // Antes había un debounce de 90 ms. Eso significa que el indicador
    // podía quedarse hasta ~90 ms mirando la tarjeta anterior. Ahora usamos
    // requestAnimationFrame: se sincroniza con el refresco visual del navegador.
    carousel.addEventListener("scroll", scheduleSync, { passive: true });

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
      renderedListKey = "";
      updateControls();
    }, { passive: true });
  }

  return { init, goTo, filter };
})();
window.GamesMenu = GamesMenu;

/********************
 * APP GLOBAL
 ********************/

/**
 * RESTAURACIÓN DE SCROLL — PORTADA DE JUEGOS
 */
const GamesScrollState = (() => {
  const KEY = "ams-games-home-scroll-v1";
  let saveFrame = 0;

  function isHome() {
    return Boolean(document.getElementById("gameCarousel"));
  }

  function save() {
    if (!isHome()) return;
    try {
      sessionStorage.setItem(KEY, String(Math.max(0, Math.round(window.scrollY || 0))));
    } catch {}
  }

  function scheduleSave() {
    if (saveFrame) return;
    saveFrame = window.requestAnimationFrame(() => {
      saveFrame = 0;
      save();
    });
  }

  function restore() {
    if (!isHome()) return;
    let y = 0;
    try {
      y = Math.max(0, Number(sessionStorage.getItem(KEY) || 0));
    } catch {}
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo(0, y));
    });
  }

  function init() {
    if (!isHome()) return;
    try { history.scrollRestoration = "manual"; } catch {}
    window.addEventListener("scroll", scheduleSave, { passive: true });
    window.addEventListener("pagehide", save, { passive: true });
    window.addEventListener("beforeunload", save, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") save();
    });
    restore();
  }

  return { init, save, restore };
})();
window.GamesScrollState = GamesScrollState;

const App = (() => {
  function initExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      if (!link.hasAttribute("rel")) {
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function init() {
    GamesScrollState.init();
    PWA.init();
    Theme.init();
Nav.init();
    Tools.init();
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