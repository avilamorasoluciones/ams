const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("AMS Fly shows its result and stops the game loop when local storage fails", () => {
  const source = read("juegos/ams-fly/game.js");
  const showStart = source.indexOf("function showOnly(target){");
  const showEnd = source.indexOf("\nfunction hydrateStats", showStart);
  const loopStart = source.indexOf("function loop(now){");
  const loopEnd = source.indexOf("\nfunction savePendingScore", loopStart);
  const endStart = source.indexOf("function endGame(){");
  const endEnd = source.indexOf("\nasync function ensureResultPublishedBeforeLeaving()", endStart);
  assert.notEqual(loopStart, -1);
  assert.notEqual(showStart, -1);
  assert.ok(showEnd > showStart);
  assert.ok(loopEnd > loopStart);
  assert.notEqual(endStart, -1);
  assert.ok(endEnd > endStart);

  const screens = {
    homeScreen: { hidden: false },
    profileScreen: { hidden: true },
    factScreen: { hidden: true },
    gameScreen: { hidden: false },
    pauseScreen: { hidden: true },
    gameOverScreen: { hidden: true },
    rankingScreen: { hidden: true },
    bottomNav: { hidden: false }
  };
  const resultScreen = screens.gameOverScreen;
  const scheduledFrames = [];
  let drawCount = 0;
  const context = vm.createContext({
    cancelAnimationFrame() {},
    console: { error() {} },
    document: {
      getElementById() { return null; },
      querySelector() { return { classList: { toggle() {} } }; }
    },
    els: {
      ...screens,
      gameOverScreen: resultScreen,
      homeBest: { textContent: "" },
      homeGames: { textContent: "" },
      finalScore: { textContent: "" },
      resultBest: { textContent: "" },
      resultGames: { textContent: "" },
      resultBird: { innerHTML: "" },
      resultEyebrow: { textContent: "" },
      resultTitle: { textContent: "" },
      newRecord: { hidden: true },
      scoreMessage: null,
      submitScoreBtn: { hidden: false, disabled: false, dataset: {}, innerHTML: "" },
      submitScoreStatus: { hidden: true, textContent: "" }
    },
    eventIsOpen: () => false,
    game: {
      running: true, paused: false, score: 4, time: 2, last: 0,
      birdData: { id: "condor-co" }
    },
    lastResult: null,
    performance: { now: () => 100 },
    playTone() {},
    profile: null,
    publishScore() {},
    raf: 1,
    requestAnimationFrame(callback) { scheduledFrames.push(callback); return scheduledFrames.length; },
    savePendingScore: () => false,
    saveStats() { throw new Error("storage unavailable"); },
    selectedBirdId: "condor-co",
    setHeaderGameActionsHidden() {},
    stats: { games: 0, best: 0 },
    stopMusic() {},
    window: { scrollTo() {} },
    draw() { drawCount++; },
    birdMarkup: () => "<bird>"
  });
  vm.runInContext(`${source.slice(showStart, showEnd)}\n${source.slice(loopStart, loopEnd)}\n${source.slice(endStart, endEnd)}`, context);
  vm.runInContext("update = function(){ endGame(); }; loop(16);", context);

  assert.equal(resultScreen.hidden, false);
  assert.equal(screens.gameScreen.hidden, true);
  assert.equal(context.els.finalScore.textContent, "4");
  assert.match(context.els.submitScoreStatus.textContent, /No se pudo guardar el resultado/);
  assert.match(context.els.submitScoreStatus.textContent, /No se pudieron guardar las estadísticas/);
  assert.equal(context.stats.games, 1);
  assert.equal(context.game.running, false);
  assert.equal(drawCount, 0);
  assert.equal(scheduledFrames.length, 1, "only the result-focus callback remains; the game loop must not restart");
  scheduledFrames[0]();
  assert.equal(resultScreen.hidden, false);
});

test("AMS Fly pause and resume restart exactly one animation frame loop", () => {
  const source = read("juegos/ams-fly/game.js");
  const showStart = source.indexOf("function showOnly(target){");
  const showEnd = source.indexOf("\nfunction hydrateStats", showStart);
  const loopStart = source.indexOf("function loop(now){");
  const loopEnd = source.indexOf("\nfunction savePendingScore", loopStart);
  const pauseStart = source.indexOf('els.pauseBtn?.addEventListener("click"');
  const quitStart = source.indexOf('els.quitBtn?.addEventListener("click"', pauseStart);
  const visibilityStart = source.indexOf('document.addEventListener("visibilitychange"');
  const visibilityEnd = source.indexOf("\nels.soundBtn.textContent", visibilityStart);
  assert.ok(showEnd > showStart);
  assert.ok(loopEnd > loopStart);
  assert.ok(quitStart > pauseStart);
  assert.ok(visibilityEnd > visibilityStart);

  const screens = {
    homeScreen: { hidden: true },
    profileScreen: { hidden: true },
    factScreen: { hidden: true },
    gameScreen: { hidden: false },
    pauseScreen: { hidden: true },
    gameOverScreen: { hidden: true },
    rankingScreen: { hidden: true },
    bottomNav: { hidden: true }
  };
  const frameCallbacks = new Map();
  const listeners = {};
  const documentListeners = {};
  const windowListeners = {};
  let nextFrameId = 1;
  let updates = 0;
  let draws = 0;
  const context = vm.createContext({
    cancelAnimationFrame(id) { frameCallbacks.delete(id); },
    document: {
      hidden: false,
      addEventListener(type, callback) { documentListeners[type] = callback; },
      getElementById() { return null; },
      querySelector() { return { classList: { toggle() {} } }; }
    },
    els: {
      ...screens,
      pauseBtn: { addEventListener(type, callback) { listeners.pause = callback; } },
      resumeBtn: { addEventListener(type, callback) { listeners.resume = callback; } },
      pauseScore: { textContent: "" }
    },
    game: { running: true, paused: false, last: 0, score: 7 },
    performance: { now: () => 100 },
    raf: 42,
    requestAnimationFrame(callback) {
      const id = nextFrameId++;
      frameCallbacks.set(id, callback);
      return id;
    },
    update() { updates++; },
    draw() { draws++; },
    window: { addEventListener(type, callback) { windowListeners[type] = callback; } },
    documentHidden: false
  });
  vm.runInContext(
    `${source.slice(showStart, showEnd)}\n${source.slice(loopStart, loopEnd)}\n${source.slice(pauseStart, quitStart)}\n${source.slice(visibilityStart, visibilityEnd)}`,
    context
  );

  listeners.pause();
  assert.equal(context.game.paused, true);
  assert.equal(screens.gameScreen.hidden, true);
  assert.equal(screens.pauseScreen.hidden, false);
  assert.equal(frameCallbacks.size, 0);

  listeners.resume();
  assert.equal(context.game.paused, false);
  assert.equal(screens.gameScreen.hidden, false);
  assert.equal(screens.pauseScreen.hidden, true);
  assert.equal(frameCallbacks.size, 1);

  listeners.resume();
  assert.equal(frameCallbacks.size, 1, "repeated resume must replace, not duplicate, the pending frame");
  const [frameId, callback] = frameCallbacks.entries().next().value;
  frameCallbacks.delete(frameId);
  callback(120);
  assert.equal(updates, 1);
  assert.equal(draws, 1);
  assert.equal(frameCallbacks.size, 1, "the resumed loop must schedule its next frame");

  context.document.hidden = true;
  documentListeners.visibilitychange();
  assert.equal(context.game.paused, true);
  assert.equal(screens.pauseScreen.hidden, false);
  assert.equal(frameCallbacks.size, 0);
  context.document.hidden = false;
  documentListeners.visibilitychange();
  assert.equal(context.game.paused, false);
  assert.equal(screens.gameScreen.hidden, false);
  assert.equal(frameCallbacks.size, 1);
  windowListeners.focus();
  assert.equal(frameCallbacks.size, 1, "focus recovery must not leave duplicate RAF callbacks");
});

test("AMS Fly falls back to public score rows when the no-argument ranking RPC is absent", async () => {
  const source = read("juegos/ams-fly/game.js");
  const start = source.indexOf("async function loadRankingFromScores(client){");
  const end = source.indexOf("\nfunction escapeHtml", start);
  assert.ok(start >= 0);
  assert.ok(end > start);

  const rpcCalls = [];
  const queriedFields = [];
  const scores = [
    { id: "1", participant_id: "pilot-a", player_name: "A", country_code: "CO", bird_id: "condor-co", score: 20, created_at: "2026-01-01" },
    { id: "2", participant_id: "pilot-b", player_name: "B", country_code: "VE", bird_id: "turpial", score: 15, created_at: "2026-01-02" },
    { id: "3", participant_id: "pilot-a", player_name: "A", country_code: "CO", bird_id: "condor-co", score: 10, created_at: "2026-01-03" },
    { id: "4", participant_id: null, player_name: "Legacy", country_code: "CO", bird_id: "condor-co", score: 99, created_at: "2026-01-04" }
  ];
  const client = {
    async rpc(...args) {
      rpcCalls.push(args);
      return { error: { code: "PGRST202", message: "Could not find the function without parameters" } };
    },
    from(table) {
      assert.equal(table, "ams_fly_scores");
      const query = {
        select(fields) { queriedFields.push(fields); return this; },
        order() { return this; },
        async range(first, last) { return { data: scores.slice(first, last + 1), error: null }; }
      };
      return query;
    }
  };
  const context = vm.createContext({
    console: { warn() {} },
    RANKING_LIMIT: 50
  });
  vm.runInContext(source.slice(start, end), context);
  context.client = client;
  const result = await vm.runInContext("getRankingRows(client)", context);

  assert.deepEqual(rpcCalls, [["ams_fly_public_ranking"]]);
  assert.deepEqual(queriedFields, ["id,participant_id,player_name,country_code,bird_id,score,created_at"]);
  assert.equal(result.fallback, true);
  assert.deepEqual(Array.from(result.rows, row => row.participant_id), ["pilot-a", "pilot-b"]);
  assert.deepEqual(Array.from(result.rows, row => row.score), [20, 15]);
});

test("AMS Fly ranking RPC matches its public migration and Neon cache-busting assets", () => {
  const game = read("juegos/ams-fly/game.js");
  const page = read("juegos/ams-fly/index.html");
  const worker = read("juegos/ams-fly/sw.js");
  const migration = read("juegos/ams-fly/neon/ranking-rpc-migration.sql");
  const fullMigration = read("juegos/ams-fly/neon/rls-migration.sql");

  assert.match(game, /rpc\("ams_fly_public_ranking"\)/);
  assert.match(migration, /create or replace function public\.ams_fly_public_ranking\(\)/);
  assert.match(migration, /grant execute on function public\.ams_fly_public_ranking\(\) to anonymous, authenticated/i);
  assert.match(migration, /notify pgrst,\s*'reload schema'/i);
  assert.match(fullMigration, /create or replace function public\.ams_fly_public_ranking\(\)/);
  assert.match(game, /result\.error\.code[\s\S]*PGRST202/);
  assert.match(game, /from\("ams_fly_scores"\)[\s\S]*participant_id,player_name,country_code,bird_id,score,created_at/);
  assert.match(page, /game\.js\?v=87/);
  assert.match(worker, /ams-fly-v94/);
  assert.match(worker, /game\.js\?v=87/);
  assert.doesNotMatch(migration, /create schema|ams_fly\.public_ranking/i);
});
