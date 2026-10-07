const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

function makeProfileHarness({ profileReadError = null } = {}) {
  const source = read("juegos/ams-fly/game.js");
  const storage = new MemoryStorage();
  const user = { id: "pilot-a", email: "pilot@example.com", name: "Ana Mora" };
  let activeUser = null;
  let remoteProfile = null;
  let authStatus = "";
  let accountStatus = "";
  const calls = [];
  const makeElement = (value = "") => ({
    value, textContent: "", innerHTML: "", hidden: false, disabled: false,
    dataset: {},
    classList: { toggle() {}, remove() {} }
  });
  const els = {
    authEmail: makeElement(user.email),
    authPassword: makeElement("password123"),
    authSignInBtn: makeElement(),
    authStatus: makeElement(),
    accountStatus: makeElement(),
    accountTitle: makeElement(),
    accountSubtitle: makeElement(),
    loginFields: makeElement(),
    registerFields: makeElement(),
    accountDetails: makeElement(),
    accountName: makeElement("Ana"),
    accountLastName: makeElement("Mora"),
    accountDialCode: makeElement("57"),
    accountPhone: makeElement("3001234567"),
    accountCountry: makeElement("CO"),
    accountEmail: makeElement(),
    saveAccountBtn: makeElement(),
    playerDialCode: makeElement("57")
  };
  const client = {
    auth: {
      async getSession() {
        return { data: { session: activeUser ? { user: activeUser } : null } };
      },
      async signIn() {},
      async signOut() { activeUser = null; return { error: null }; }
    },
    async rpc(name, args) {
      calls.push({ name, args });
      if (name === "ams_fly_register_participant") {
        remoteProfile = {
          participant_id: "participant-a",
          name: args.p_name,
          first_name: "Ana",
          last_name: "Mora",
          country: args.p_country,
          bird_id: args.p_bird_id,
          phone: args.p_phone || "",
          dial: "57",
          prize_eligible: true,
          terms_accepted: false
        };
        return { data: { participant_id: "participant-a", prize_eligible: true } };
      }
      if (name === "ams_fly_get_participant_profile") {
        if (profileReadError) return { error: profileReadError };
        return { data: remoteProfile ? { found: true, ...remoteProfile } : { found: false } };
      }
      throw new Error("Unexpected RPC: " + name);
    }
  };
  const extract = (startMarker, endMarker) => {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, `Unable to find ${startMarker}`);
    return source.slice(start, end);
  };
  const context = vm.createContext({
    STORAGE_KEY: "amsFlyProfileV2",
    PENDING_REG_KEY: "amsFlyPendingRegistrationV1",
    VALID_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NEON_DATA_READY: () => true,
    countries: [{ code: "CO", dial: "57", flag: "🇨🇴", name: "Colombia" }],
    selectedBirdId: "condor-co",
    profile: null,
    localStorage: storage,
    console: { error() {}, warn() {} },
    els,
    getNeonClient: async () => client,
    getPublicNeonClient: async () => client,
    getCurrentAuthUser: async () => activeUser,
    friendlyAuthError: (_error, fallback) => fallback,
    friendlyNeonSyncError: error => String(error?.message || error),
    neonAuthRetryable: () => false,
    setAuthStatus(target, message) {
      target.textContent = message;
      if (target === els.authStatus) authStatus = message;
      if (target === els.accountStatus) accountStatus = message;
    },
    renderBirds() {},
    renderHomeBird() {},
    navigateTo() {},
    readPendingScore: () => null,
    restorePendingResult() {}
  });
  const friendStart = source.indexOf("function friendlyNeonSyncError");
  const friendEnd = source.indexOf("\nfunction neonAuthRetryable", friendStart);
  vm.runInContext(source.slice(friendStart, friendEnd), context);
  vm.runInContext(
    extract("async function getCurrentAuthUser()", "\nconst RANKING_LIMIT"),
    context
  );
  vm.runInContext(
    extract("function safeParse(key, fallback)", "\nfunction saveStats()"),
    context
  );
  vm.runInContext(
    extract("function fillDialSelect(selectId", "\nasync function refreshAuthUI()"),
    context
  );
  vm.runInContext(
    extract("async function refreshAuthUI()", "\nfunction showRegistrationMode"),
    context
  );
  vm.runInContext(
    extract("async function signInPlayer()", "\nasync function signUpPlayer()"),
    context
  );
  vm.runInContext(
    extract("async function syncParticipantProfile(user)", "\nfunction dismissLoadingScreen"),
    context
  );
  vm.runInContext(
    extract("function setAuthStatus(target,message,error=false)", "\nfunction fillDialSelect"),
    context
  );
  context.profile = {
    email: user.email, name: "Ana Mora", firstName: "Ana", lastName: "Mora",
    country: "CO", birdId: "condor-co", phone: "", dial: "57"
  };
  return {
    context, calls, client, els, user, storage,
    get remoteProfile() { return remoteProfile; },
    get authStatus() { return authStatus; },
    get accountStatus() { return accountStatus; },
    setSignedIn() { activeUser = user; }
  };
}

test("AMS Fly saves the phone to Neon and restores it after logout and login", async () => {
  const harness = makeProfileHarness();
  const { context, els, user, storage } = harness;
  harness.setSignedIn();

  await vm.runInContext("saveAccount()", context);
  assert.equal(harness.remoteProfile.phone, "+573001234567");
  assert.match(els.accountStatus.textContent, /sincronizados/);
  assert.equal(storage.getItem("amsFlyProfileV2") !== null, true);

  await vm.runInContext("signOutPlayer()", context);
  assert.equal(storage.getItem("amsFlyProfileV2"), null);

  els.authEmail.value = user.email;
  els.authPassword.value = "password123";
  harness.client.auth.signIn = {
    email: async () => {
      harness.setSignedIn();
      return {};
    }
  };
  await vm.runInContext("signInPlayer()", context);

  assert.ok(harness.calls.some(call => call.name === "ams_fly_get_participant_profile"));
  assert.equal(els.accountPhone.value, "3001234567");
  assert.equal(els.accountDialCode.value, "57");
  assert.equal(els.saveAccountBtn.disabled, false);
});

test("AMS Fly exposes profile recovery failures and preserves matching local phone data", async () => {
  const harness = makeProfileHarness({
    profileReadError: { code: "PGRST202", message: "ams_fly_get_participant_profile not found" }
  });
  const { context, els, storage } = harness;
  storage.setItem("amsFlyProfileV2", JSON.stringify({
    email: harness.user.email, name: "Ana Mora", firstName: "Ana", lastName: "Mora",
    country: "CO", birdId: "condor-co", phone: "+573001234567", dial: "57"
  }));
  harness.setSignedIn();

  await vm.runInContext("refreshAuthUI()", context);

  assert.equal(els.accountPhone.value, "3001234567");
  assert.match(els.accountStatus.textContent, /phone-profile-recovery-migration\.sql/);
  assert.equal(els.saveAccountBtn.disabled, true);
});

test("AMS Fly recovery migration only grants the authenticated profile lookup and returns phone", () => {
  const migration = read("juegos/ams-fly/neon/phone-profile-recovery-migration.sql");

  assert.match(migration, /create or replace function public\.ams_fly_get_participant_profile\(\)/i);
  assert.match(migration, /'phone',coalesce\(v_participant\.phone,''\)/i);
  assert.match(migration, /grant execute on function public\.ams_fly_get_participant_profile\(\) to authenticated/i);
  assert.doesNotMatch(migration, /create policy|drop policy|ams_fly_is_admin|ams_fly_register_participant/i);
  assert.match(read("juegos/ams-fly/index.html"), /game\.js\?v=88/);
  assert.match(read("juegos/ams-fly/sw.js"), /ams-fly-v95/);
  assert.match(read("juegos/ams-fly/sw.js"), /game\.js\?v=88/);
});
