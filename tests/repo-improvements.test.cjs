const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

function makeStore() {
  const localStorage = new MemoryStorage();
  const context = vm.createContext({
    window: {},
    location: { pathname: "/gestion/contacto.js" },
    sessionStorage: { amsGestionAuth: "1" },
    localStorage,
    console,
    Date,
    Math
  });
  vm.runInContext(read("gestion/contacto.js"), context);
  return { store: context.window.AMSStore, localStorage };
}

function makeAyuContext(overrides = {}) {
  const localStorage = overrides.localStorage || new MemoryStorage();
  const context = vm.createContext({
    window: overrides.window || {},
    localStorage,
    console: { error() {} },
    CLOUD_USER: overrides.user || { id: "user-a" },
    CLOUD_PENDING_STATE: null,
    CLOUD_SYNCING: false,
    CLOUD_SYNC_PROMISE: null,
    cloudSaveTimer: null,
    KEY: "ayukcal_v8",
    CLOUD_OWNER_KEY: "ayukcal_cloud_owner_v1",
    ACCOUNT_CACHE_PREFIX: "ayukcal_account_cache_v1:",
    normalizeState: value => value || {},
    setCloudStatus() {},
    state: () => JSON.parse(localStorage.getItem("ayukcal_v8") || "{}"),
    confirm: () => true,
    toast() {}
  });
  const source = read("ayukcal/index.html");
  const helpersStart = source.indexOf("function localStateSave(");
  const helpersEnd = source.indexOf("\nfunction save(s)", helpersStart);
  const migrationStart = source.indexOf("async function migrateLocalToCloud(");
  const migrationEnd = source.indexOf("\nasync function bootCloud()", migrationStart);
  const logoutStart = source.indexOf("async function logoutCloud()");
  const logoutEnd = source.indexOf("\nasync function loadCloudForCurrentUser()", logoutStart);
  assert.notEqual(helpersStart, -1);
  assert.notEqual(helpersEnd, -1);
  assert.notEqual(migrationStart, -1);
  assert.notEqual(migrationEnd, -1);
  assert.notEqual(logoutStart, -1);
  assert.notEqual(logoutEnd, -1);
  vm.runInContext(source.slice(helpersStart, helpersEnd), context);
  vm.runInContext(source.slice(migrationStart, migrationEnd), context);
  vm.runInContext(source.slice(logoutStart, logoutEnd), context);
  return { context, localStorage };
}

function makeDueloHarness({ mode = "duel", target = 10, names = ["Ana", "Beto"] } = {}) {
  const elements = new Map();
  const getElement = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        id, value: "", textContent: "", innerHTML: "", hidden: false, disabled: false,
        attributes: {}, listeners: {}, classList: {
          add() {}, remove() {}, contains() { return false; }
        },
        addEventListener(type, callback) { this.listeners[type] = callback; },
        setAttribute(name, value) { this.attributes[name] = value; },
        focus() {}
      });
    }
    return elements.get(id);
  };
  let nextTimerId = 1;
  const timers = new Map();
  const sounds = [];
  const localStorage = new MemoryStorage();
  const window = {
    AMS_NEW_GAMES_DB: undefined,
    emitSound: (...args) => sounds.push(args),
    addEventListener() {},
    scrollTo() {}
  };
  const context = vm.createContext({
    window,
    document: { readyState: "complete", getElementById: getElement },
    localStorage,
    Date,
    Math,
    setInterval(callback) { const id = nextTimerId++; timers.set(id, callback); return id; },
    clearInterval(id) { timers.delete(id); },
    confirm: () => true,
    console
  });
  vm.runInContext(read("juegos/datos_nuevos.js"), context);
  vm.runInContext(read("juegos/duelo.js"), context);
  getElement("du-mode").value = mode;
  getElement("du-target").value = String(target);
  getElement("du-custom-target").value = String(target);
  getElement("du-time").value = "12";
  getElement("du-cat").value = "Todas";
  names.forEach(name => {
    getElement("du-inpName").value = name;
    getElement("du-btnAddPlayer").onclick();
  });
  const start = () => getElement("du-start").onclick();
  const runCountdown = () => {
    const callback = [...timers.values()].find(timer => timer !== undefined);
    assert.equal(typeof callback, "function");
    for (let tick = 0; tick < 5; tick++) callback();
  };
  return { context, elements, getElement, timers, sounds, start, runCountdown };
}

function loadQuestionDb() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(read("juegos/datos_nuevos.js"), context);
  return context.window.AMS_NEW_GAMES_DB;
}

test("Gestión subscription payment records cash once and advances due date once", () => {
  const { store } = makeStore();
  const client = store.upsertClient({
    company: "Cliente prueba",
    subscription: {
      price: 25,
      currency: "USD",
      period: "monthly",
      due: "2026-10-06",
      lastPayment: ""
    }
  });

  store.recordPayment(client.id, "2026-10-06");
  store.recordPayment(client.id, "2026-10-06");

  assert.equal(store.finance().filter(entry => entry.category === "Suscripción").length, 1);
  assert.equal(store.finance()[0].amount, 25);
  assert.equal(store.findClient(client.id).subscription.lastPayment, "2026-10-06");
  assert.equal(store.findClient(client.id).subscription.due, "2026-11-06");
  assert.equal(store.advanceDue("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(store.advanceDue("2024-02-29", "annual"), "2025-02-28");
});

test("Gestión rejects malformed restores before replacing existing records", () => {
  const { store } = makeStore();
  store.upsertClient({ company: "Conservar" });
  const before = JSON.stringify({
    clients: store.clients(),
    projects: store.projects(),
    finance: store.finance()
  });

  assert.throws(() => store.restore({
    clients: [{}],
    projects: [null],
    finance: [],
    tasks: []
  }), /Respaldo inválido/);
  assert.equal(JSON.stringify({
    clients: store.clients(),
    projects: store.projects(),
    finance: store.finance()
  }), before);
});

test("AyuKcal keeps account-local state separate when switching accounts", () => {
  const { context, localStorage } = makeAyuContext();
  localStorage.setItem("ayukcal_cloud_owner_v1", "user-a");
  localStorage.setItem("ayukcal_v8", JSON.stringify({ profile: { name: "A" } }));
  localStorage.setItem("ayukcal_account_cache_v1:user-b", JSON.stringify({ profile: { name: "B" } }));

  context.prepareLocalStateForUser("user-b");

  assert.equal(JSON.parse(localStorage.getItem("ayukcal_v8")).profile.name, "B");
  assert.equal(JSON.parse(localStorage.getItem("ayukcal_account_cache_v1:user-a")).profile.name, "A");
  assert.equal(localStorage.getItem("ayukcal_cloud_owner_v1"), "user-b");
});

test("AyuKcal clears the active health-data state on logout but retains the same-account copy", () => {
  const { context, localStorage } = makeAyuContext();
  localStorage.setItem("ayukcal_cloud_owner_v1", "user-a");
  localStorage.setItem("ayukcal_v8", JSON.stringify({ profile: { name: "A" } }));

  context.clearActiveAccountState("user-a");

  assert.equal(localStorage.getItem("ayukcal_v8"), null);
  assert.equal(localStorage.getItem("ayukcal_cloud_owner_v1"), null);
  assert.equal(JSON.parse(localStorage.getItem("ayukcal_account_cache_v1:user-a")).profile.name, "A");
});

test("AyuKcal still logs out after a sync failure and warns that changes remain local", async () => {
  let signOutCalls = 0;
  let status = "";
  const localStorage = new MemoryStorage({
    ayukcal_cloud_owner_v1: "user-a",
    ayukcal_v8: JSON.stringify({ profile: { name: "A" } })
  });
  const { context } = makeAyuContext({
    localStorage,
    window: {
      ayukcalSupabase: {
        auth: { signOut: async () => { signOutCalls++; return { error: null }; } }
      }
    }
  });
  context.CLOUD_SYNCING = true;
  context.CLOUD_SYNC_PROMISE = Promise.resolve(false);
  context.setCloudStatus = value => { status = value; };
  context.updateAuthUI = () => {};
  context.closeAccountModal = () => {};

  await context.logoutCloud();

  assert.equal(signOutCalls, 1);
  assert.equal(context.CLOUD_USER, null);
  assert.match(status, /no se sincronizaron/);
  assert.equal(localStorage.getItem("ayukcal_v8"), null);
  assert.notEqual(localStorage.getItem("ayukcal_account_cache_v1:user-a"), null);
});

test("AyuKcal propagates read failures and never treats them as an empty account", async () => {
  const dbError = new Error("read unavailable");
  let upserts = 0;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "user-a" } } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: dbError })
        })
      }),
      upsert: async () => { upserts++; return { error: null }; }
    })
  };
  const localStorage = new MemoryStorage({
    ayukcal_v8: JSON.stringify({ profile: { name: "Local" } })
  });
  const { context } = makeAyuContext({ window: { ayukcalSupabase: client }, localStorage });

  await assert.rejects(context.cloudLoad("user-a"), /read unavailable/);
  await assert.rejects(context.migrateLocalToCloud("user-a"), /read unavailable/);
  assert.equal(upserts, 0);
});

test("AyuKcal refuses to queue a save for a different active account", async () => {
  let upserts = 0;
  const client = {
    from: () => ({
      upsert: async () => { upserts++; return { error: null }; }
    })
  };
  const { context } = makeAyuContext({ window: { ayukcalSupabase: client }, user: { id: "user-b" } });

  assert.equal(await context.cloudSave({ profile: { name: "A" } }, "user-a"), false);
  assert.equal(upserts, 0);
});

test("AMS Fly browser RPCs match the public ranking projection and required score fields", () => {
  const game = read("juegos/ams-fly/game.js");
  const migration = read("juegos/ams-fly/neon/rls-migration.sql");

  assert.match(game, /rpc\("ams_fly_public_ranking"\)/);
  assert.match(migration, /create or replace function public\.ams_fly_public_ranking\(\)/);
  assert.match(migration, /grant execute on function public\.ams_fly_public_ranking\(\) to anonymous, authenticated/i);
  assert.match(game, /result\.error\.code[\s\S]*PGRST202/);
  assert.match(game, /from\("ams_fly_scores"\)[\s\S]*participant_id,player_name,country_code,bird_id,score,created_at/);
  assert.match(game, /const message=typedMessage\|\|savedMessage\|\|"¡A volar!"/);
  assert.doesNotMatch(game, /\.from\("ams_fly_participants"\)\s*\.select\("\*"\)/);
});

test("Store demo cart supports named, keyboard-operable controls and live totals", () => {
  const ecommerce = read("ecommerce/index.html");
  const tools = read("herramientas/index.html");

  assert.match(ecommerce, /id="openCartBtn"[^>]*aria-label="Abrir carrito"/);
  assert.match(ecommerce, /role="dialog" aria-modal="true"[^>]*inert/);
  assert.match(ecommerce, /#cartBadge\[hidden\], #checkoutBtn\[hidden\] \{ display: none; \}/);
  assert.match(ecommerce, /cartBackgroundInert\.forEach/);
  assert.match(ecommerce, /cart\.splice\(Number\(remove\.dataset\.removeIndex\), 1\)/);
  assert.match(ecommerce, /cartTotal\.textContent\s*=/);
  assert.match(ecommerce, /event\.key === 'Escape'/);
  assert.doesNotMatch(ecommerce, /href="#"/);
  assert.match(tools, /id="btn-uuid-copy"[^>]*aria-label="Copiar UUID"/);
  assert.match(tools, /id="btn-copy-pass"[^>]*aria-label="Copiar contraseña"/);
});

test("Game pages permit zoom and service workers do not cache out-of-scope requests", () => {
  const gamePages = fs.readdirSync(path.join(root, "juegos"))
    .filter(file => file.endsWith(".html"))
    .map(file => read(path.join("juegos", file)));
  assert.ok(gamePages.length >= 10);
  for (const page of gamePages) {
    assert.doesNotMatch(page, /(?:maximum-scale\s*=\s*["']?1(?:\.0)?|user-scalable\s*=\s*["']?no)/i);
  }
  assert.match(read("juegos/sw.js"), /url\.pathname\.startsWith\(scopePath\)/);
  assert.match(read("juegos/ams-fly/sw.js"), /url\.pathname\.startsWith\(scopePath\)/);
  assert.match(read("juegos/ams-fly/sw.js"), /if\(response\.ok\)/);
  const dueloPage = read("juegos/duelo.html");
  const gamesWorker = read("juegos/sw.js");
  for (const asset of ["scripts.js?v=20261006-54", "duelo.js?v=20261006-08"]) {
    assert.ok(dueloPage.includes(asset) && gamesWorker.includes(asset), `${asset} must be pre-cached`);
  }
  const gameIndex = read("juegos/index.html");
  const gameShell = read("juegos/sw.js");
  for (const asset of ["styles.css?v=20261006-50", "scripts.js?v=20261006-50", "manifest.webmanifest?v=23"]) {
    assert.ok(gameIndex.includes(asset) && gameShell.includes(asset), `${asset} must be pre-cached`);
  }
});

test("Public-site mobile navigation can be dismissed with Escape and returns focus", () => {
  const scripts = read("scripts.js");

  assert.match(scripts, /e\.key === "Escape" && mobilePanel\.classList\.contains\("open"\)/);
  assert.match(scripts, /closeMobile\(true\)/);
  assert.match(read("index.html"), /aria-controls="mobilePanel" aria-expanded="false"/);
});

test("Homepage preloads Montserrat and keeps startup animations composited", () => {
  const html = read("index.html");
  const scripts = read("scripts.js");
  const styles = read("styles.css");

  assert.match(html, /<link rel="preload" href="styles\.css\?v=20261007-1" as="style" fetchpriority="high"\s*\/>\s*<title>/);
  assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=20261007-1"/);
  assert.match(html, /<link rel="preload" href="https:\/\/fonts\.gstatic\.com\/s\/montserrat\/v31\/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y\.woff2" as="font" type="font\/woff2" crossorigin/);
  assert.match(scripts, /window\.addEventListener\("load", queueActiveSectionUpdate, \{ once: true \}\);\s*setActive\("inicio"\);/);
  assert.doesNotMatch(styles, /@keyframes pulse\s*\{[^}]*box-shadow/s);
});

test("Homepage founder names meet contrast requirements in both themes", () => {
  const html = read("index.html");
  const styles = read("styles.css");
  const rgb = hex => hex.match(/[a-f\d]{2}/gi).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = hex => {
    const [r, g, b] = rgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };

  for (const background of ["#7c3aed", "#2563eb"]) {
    assert.ok(contrast("#ffffff", background) >= 4.5, `${background} must provide WCAG AA text contrast`);
  }
  assert.match(styles, /body\.light-theme footer \.ams-footer-person > span\s*\{\s*background:\s*transparent !important;\s*color:\s*inherit !important;/);
  assert.match(html, /\.ams-footer-maria\{background:#7c3aed\}/);
});

test("Aura Studio demo navigation and FAQ use keyboard-accessible controls", () => {
  for (const page of ["multipages/index.html", "multipages/servicios.html", "multipages/contacto.html"]) {
    const html = read(page);
    assert.match(html, /<button class="menu-btn"[^>]*aria-controls="nav-links"/);
    assert.match(html, /event\.key === 'Escape'/);
  }
  const contact = read("multipages/contacto.html");
  assert.equal((contact.match(/class="faq-question" type="button"/g) || []).length, 3);
  assert.match(contact, /panel\.setAttribute\('aria-hidden', String\(!isOpen\)\)/);
});

test("BurgerX landing demo has accessible drawer navigation and FAQ state", () => {
  const landing = read("landing/index.html");
  assert.match(landing, /<button class="menu-btn"[^>]*aria-controls="navLinks"/);
  assert.match(landing, /event\.key === 'Escape'/);
  assert.match(landing, /navLinks\.inert = mobileNavMedia\.matches && !isOpen/);
  assert.equal((landing.match(/class="faq-question" type="button"/g) || []).length, 4);
  assert.match(landing, /answer\.setAttribute\('aria-hidden', 'false'\)/);
  assert.match(landing, /target="_blank" rel="noopener noreferrer" class="floating-wa"/);
  assert.doesNotMatch(landing, /href="#"/);
});

test("Venezuela landing navigation remains named when its visible caption hides on mobile", () => {
  assert.match(read("venezuela/index.html"), /class="nav-link"[^>]*aria-label="Ir al sitio principal de Avila Mora Soluciones"/);
});

test("Duelo keeps matchup points across questions and ends at exactly 10", () => {
  const game = makeDueloHarness();
  game.start();
  game.runCountdown();

  for (let point = 0; point < 10; point++) game.getElement("du-point-a").onclick();

  assert.equal(game.getElement("du-scr-result").hidden, false);
  assert.match(game.getElement("du-result-body").innerHTML, /10 pts/);
  assert.equal((game.getElement("du-result-body").innerHTML.match(/<div><strong>Duelo /g) || []).length, 10);
  game.getElement("du-point-a").onclick();
  assert.match(game.getElement("du-result-body").innerHTML, /10 pts/);
});

test("Duelo team mode ends when the shared team score reaches its target", () => {
  const game = makeDueloHarness({ mode: "teams", target: 2, names: ["Ana", "Beto", "Cata", "Diego"] });
  game.start();
  game.runCountdown();

  game.getElement("du-point-a").onclick();
  game.getElement("du-point-a").onclick();

  assert.equal(game.getElement("du-scr-result").hidden, false);
  assert.match(game.getElement("du-result-body").innerHTML, /Equipo A<\/span><strong>2 pts/);
  assert.doesNotMatch(game.getElement("du-result-body").innerHTML, /Equipo A<\/span><strong>[3-9]\d* pts/);
});

test("Duelo countdown sounds each tick and the shared audio helper handles autoplay rejection", async () => {
  const game = makeDueloHarness();
  game.start();
  game.runCountdown();

  const tones = game.sounds.map(([frequency]) => frequency);
  assert.ok(tones.includes(620));
  assert.deepEqual(tones.slice(-6), [620, 675, 730, 785, 840, 880]);

  const scripts = read("juegos/scripts.js");
  const audioStart = scripts.indexOf("let audioCtx;");
  const audioEnd = scripts.indexOf("\nwindow.emitSound = emitSound;", audioStart) + "\nwindow.emitSound = emitSound;".length;
  assert.notEqual(audioStart, -1);
  assert.ok(audioEnd > audioStart);
  const audioSource = scripts.slice(audioStart, audioEnd);
  let oscillatorCount = 0;
  const context = vm.createContext({
    window: {
      AudioContext: class {
        constructor() { this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
        resume() { return Promise.reject(new Error("Autoplay blocked")); }
        createOscillator() { oscillatorCount++; return { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      }
    },
    Promise
  });
  vm.runInContext(audioSource, context);
  context.window.emitSound(440, 0.1);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(oscillatorCount, 0);
});

test("Duelo database contains 30 valid, distinct questions in the configured category ranges", () => {
  const questions = loadQuestionDb().duelo.questions;
  const usable = questions.filter(question => Array.isArray(question)
    && typeof question[0] === "string"
    && Array.isArray(question[1])
    && question[1].length > 0
    && Number.isInteger(question[2])
    && question[2] >= 0
    && question[2] < question[1].length);
  const categories = [
    usable.slice(0, 10),
    usable.slice(10, 15),
    usable.slice(15, 25),
    usable.slice(25, 30)
  ];

  assert.equal(questions.length, 30);
  assert.equal(usable.length, 30);
  assert.equal(new Set(usable.map(question => question[0])).size, 30);
  assert.deepEqual(categories.map(category => category.length), [10, 5, 10, 5]);
});
