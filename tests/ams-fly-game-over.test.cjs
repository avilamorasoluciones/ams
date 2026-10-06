const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("AMS Fly shows its result and stops the game loop when local storage fails", () => {
  const source = read("juegos/ams-fly/game.js");
  const loopStart = source.indexOf("function loop(now){");
  const loopEnd = source.indexOf("\nfunction savePendingScore", loopStart);
  const endStart = source.indexOf("function endGame(){");
  const endEnd = source.indexOf("\nasync function ensureResultPublishedBeforeLeaving()", endStart);
  assert.notEqual(loopStart, -1);
  assert.ok(loopEnd > loopStart);
  assert.notEqual(endStart, -1);
  assert.ok(endEnd > endStart);

  const resultScreen = { hidden: true };
  const scheduledFrames = [];
  let drawCount = 0;
  const context = vm.createContext({
    cancelAnimationFrame() {},
    console: { error() {} },
    els: {
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
      scoreMessage: { value: "", closest: () => ({ hidden: false }), focus() {} },
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
    showOnly(target) { target.hidden = false; },
    stats: { games: 0, best: 0 },
    stopMusic() {},
    window: { scrollTo() {} },
    draw() { drawCount++; },
    birdMarkup: () => "<bird>"
  });
  vm.runInContext(`${source.slice(loopStart, loopEnd)}\n${source.slice(endStart, endEnd)}`, context);
  vm.runInContext("update = function(){ endGame(); }; loop(16);", context);

  assert.equal(resultScreen.hidden, false);
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

test("AMS Fly ranking RPC matches its public migration and Neon cache-busting assets", () => {
  const game = read("juegos/ams-fly/game.js");
  const page = read("juegos/ams-fly/index.html");
  const worker = read("juegos/ams-fly/sw.js");
  const migration = read("juegos/ams-fly/neon/ranking-rpc-migration.sql");
  const fullMigration = read("juegos/ams-fly/neon/rls-migration.sql");

  assert.match(game, /rpc\("ams_fly_public_ranking",\s*\{\s*p_limit:RANKING_LIMIT\s*\}\)/);
  assert.match(migration, /create or replace function public\.ams_fly_public_ranking\(p_limit integer default 100\)/);
  assert.match(migration, /grant execute on function public\.ams_fly_public_ranking\(integer\) to anonymous, authenticated/i);
  assert.match(migration, /notify pgrst,\s*'reload schema'/i);
  assert.match(fullMigration, /create or replace function public\.ams_fly_public_ranking\(p_limit integer default 100\)/);
  assert.match(page, /game\.js\?v=86/);
  assert.match(worker, /ams-fly-v93/);
  assert.match(worker, /game\.js\?v=86/);
  assert.doesNotMatch(migration, /create schema|ams_fly\.public_ranking/i);
});
