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

  assert.match(game, /rpc\("ams_fly_public_ranking",\s*\{\s*p_limit:RANKING_LIMIT\s*\}\)/);
  assert.match(migration, /create or replace function public\.ams_fly_public_ranking\(p_limit integer default 100\)/);
  assert.match(migration, /grant execute on function public\.ams_fly_public_ranking\(integer\) to anonymous, authenticated/i);
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
