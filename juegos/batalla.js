/* Batalla de Palabras: equipos, rondas completas y cronómetro recuperable. */
const BatallaPalabras = (() => {
  const $ = id => document.getElementById(id);
  const DB = window.AMS_NEW_GAMES_DB?.batalla?.categories || {};
  const categories = Object.keys(DB);
  const letters = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  const modes = [
    { id: "normal", name: "Normal", desc: "Responde una palabra de la categoría." },
    { id: "letra", name: "Letra", desc: "La respuesta debe empezar con la letra mostrada." },
    { id: "cadena", name: "Cadena", desc: "La respuesta empieza con la última letra válida." },
    { id: "rapido", name: "Rápido", desc: "El tiempo disminuye en cada ronda." },
    { id: "supervivencia", name: "Supervivencia", desc: "Un fallo o el tiempo agotado resta 1 punto." }
  ];

  let mode = "normal";
  let teams = [];
  let round = 1;
  let rounds = 10;
  let time = 30;
  let goal = 0;
  let active = 0;
  let score = [];
  let turnsPlayed = 0;
  let timer = null;
  let endsAt = 0;
  let remainingMs = 0;
  let paused = false;
  let current = null;
  let lastAnswer = "";
  let categoryFilter = "Todas";
  let challengeDeck = [];
  let lastChallengeKey = "";
  let currentScreen = "bp-scr-lobby";

  const esc = value => window.Utils?.escapeHTML
    ? window.Utils.escapeHTML(value)
    : String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));

  function save() {
    if (currentScreen === "bp-scr-lobby") {
      mode = document.querySelector("#bp-modes .selected")?.dataset.mode || mode;
      rounds = Number($("bp-rounds")?.value || rounds);
      time = Number($("bp-time")?.value || time);
      goal = Number($("bp-goal")?.value || 0);
      categoryFilter = $("bp-category-filter")?.value || "Todas";
      const count = Number($("bp-teams")?.value || 2);
      teams = Array.from({ length: count }, (_, index) =>
        $("bp-team-" + index)?.value.trim() || "Equipo " + (index + 1));
    }
    window.GameSession?.save("batalla", {
      mode, teams, round, rounds, time, goal, active, score, turnsPlayed, endsAt,
      remainingMs, paused, current, lastAnswer, categoryFilter, challengeDeck,
      lastChallengeKey, screen: currentScreen
    });
  }

  function showScreen(id) {
    currentScreen = id;
    ["bp-scr-lobby", "bp-scr-game", "bp-scr-result"].forEach(screenId =>
      $(screenId).classList.toggle("active", screenId === id));
    document.body.classList.toggle("playing", id !== "bp-scr-lobby");
    renderScore();
    save();
  }

  function showError(message) {
    const error = $("bp-data-error");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  }

  function renderModes() {
    $("bp-modes").innerHTML = modes.map(item =>
      '<button type="button" class="bp-mode ' + (item.id === mode ? "selected" : "") +
      '" data-mode="' + item.id + '" aria-pressed="' + (item.id === mode) + '">' +
      "<strong>" + item.name + "</strong><small>" + esc(item.desc) + "</small></button>"
    ).join("");
  }

  function renderCategories() {
    $("bp-category-filter").innerHTML = '<option value="Todas">Todas las categorías</option>' +
      categories.map(category => '<option value="' + esc(category) + '">' + esc(category) + "</option>").join("");
    $("bp-category-filter").value = categoryFilter;
  }

  function renderTeamInputs() {
    const count = Number($("bp-teams").value);
    $("bp-team-inputs").innerHTML = Array.from({ length: count }, (_, index) => {
      const name = teams[index] || "Equipo " + (index + 1);
      return '<label>Equipo ' + (index + 1) + '<input id="bp-team-' + index +
        '" maxlength="22" value="' + esc(name) + '" placeholder="Nombre del equipo" autocomplete="off"></label>';
    }).join("");
  }

  function renderScore() {
    $("bp-round").textContent = "Ronda " + round + " de " + rounds;
    $("bp-active").textContent = teams[active] || "";
    $("bp-score").innerHTML = teams.map((team, index) =>
      '<span class="badge ' + (index === active ? "badge-indigo" : "") + '">' +
      esc(team) + ": " + (score[index] ?? 0) + "</span>"
    ).join(" ");
  }

  function eligibleChallenges() {
    const selected = categoryFilter === "Todas" ? categories : [categoryFilter];
    return selected.flatMap(category =>
      (DB[category] || []).filter(word => typeof word === "string" && word.trim())
        .map(word => ({ category, word }))
    );
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function refillChallengeDeck() {
    challengeDeck = shuffle(eligibleChallenges());
    if (challengeDeck.length > 1) {
      const last = challengeDeck[challengeDeck.length - 1];
      if (last.category + ":" + last.word === lastChallengeKey) {
        [challengeDeck[0], challengeDeck[challengeDeck.length - 1]] =
          [challengeDeck[challengeDeck.length - 1], challengeDeck[0]];
      }
    }
  }

  function newChallenge() {
    if (!challengeDeck.length) refillChallengeDeck();
    const entry = challengeDeck.pop();
    if (!entry) {
      showError("No hay retos disponibles en esta categoría. Elige otra categoría.");
      return false;
    }

    const letter = mode === "cadena" && lastAnswer
      ? lastAnswer.trim().slice(-1).toLocaleUpperCase("es")
      : letters[Math.floor(Math.random() * letters.length)];
    current = { category: entry.category, target: entry.word, letter };
    lastChallengeKey = entry.category + ":" + entry.word;

    $("bp-category").textContent = current.category;
    $("bp-letter").textContent = mode === "normal" ? "" : current.letter;
    $("bp-letter").style.display = mode === "normal" ? "none" : "block";
    $("bp-chain-wrap").hidden = mode !== "cadena";
    $("bp-chain-answer").value = "";
    $("bp-chain-error").hidden = true;
    updatePrompt();
    return true;
  }

  function effectiveTime() {
    return mode === "rapido" ? Math.max(8, time - Math.max(0, round - 1) * 3) : time;
  }

  function updatePrompt() {
    $("bp-hint").textContent = mode === "normal"
      ? "Di una palabra que pertenezca a la categoría."
      : mode === "cadena"
        ? "Empieza con la letra mostrada. El equipo contrario valida la respuesta."
        : "Empieza con la letra mostrada. El equipo contrario valida la respuesta.";
    $("bp-timer-label").textContent = mode === "rapido"
      ? "Rápido · " + effectiveTime() + " s"
      : "Tiempo";
  }

  function updateTimer() {
    if (paused || currentScreen !== "bp-scr-game") return;
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    $("bp-timer").textContent = String(left);
    $("bp-timer").style.color = left <= 5 ? "var(--danger)" : "";
    if (left <= 0) timeExpired();
  }

  function startTimer(deadline = 0, remaining = 0) {
    clearInterval(timer);
    timer = null;
    if (paused) return;
    endsAt = deadline || (Date.now() + (remaining || effectiveTime() * 1000));
    if (endsAt <= Date.now()) {
      timeExpired();
      return;
    }
    updateTimer();
    if (currentScreen === "bp-scr-game" && !paused) timer = setInterval(updateTimer, 100);
  }

  function setActionButtonsDisabled(disabled) {
    ["bp-correct", "bp-wrong", "bp-next"].forEach(id => { $(id).disabled = disabled; });
  }

  function renderTurnState() {
    $("bp-pause").textContent = paused ? "Continuar" : "Pausar";
    $("bp-pause").setAttribute("aria-pressed", String(paused));
    $("bp-pause-banner").hidden = !paused;
    $("bp-timer").textContent = paused ? "PAUSA" : $("bp-timer").textContent;
    if (paused) $("bp-hint").textContent = "Partida pausada. Pulsa Continuar para reanudar el tiempo.";
    else updatePrompt();
    setActionButtonsDisabled(paused);
  }

  function enterTurn() {
    if (!newChallenge()) return;
    paused = false;
    remainingMs = 0;
    endsAt = 0;
    updatePrompt();
    renderScore();
    showScreen("bp-scr-game");
    startTimer();
    renderTurnState();
    save();
  }

  function startGame() {
    mode = document.querySelector("#bp-modes .selected")?.dataset.mode || mode;
    rounds = Number($("bp-rounds").value);
    time = Number($("bp-time").value);
    goal = Number($("bp-goal").value);
    categoryFilter = $("bp-category-filter").value || "Todas";
    const count = Number($("bp-teams").value);
    const pool = eligibleChallenges();
    if (!pool.length) {
      showError("No hay retos disponibles en esta categoría. Elige otra categoría.");
      return;
    }

    teams = Array.from({ length: count }, (_, index) =>
      $("bp-team-" + index)?.value.trim() || "Equipo " + (index + 1));
    score = Array(count).fill(0);
    round = 1;
    active = 0;
    turnsPlayed = 0;
    lastAnswer = "";
    challengeDeck = [];
    lastChallengeKey = "";
    paused = false;
    showError("");
    enterTurn();
  }

  function advanceTurn() {
    if (goal > 0 && score[active] >= goal) {
      finish();
      return;
    }
    clearInterval(timer);
    timer = null;
    endsAt = 0;
    remainingMs = 0;
    if (active === teams.length - 1) {
      if (round >= rounds) {
        finish();
        return;
      }
      active = 0;
      round += 1;
    } else {
      active += 1;
    }
    enterTurn();
  }

  function completeTurn(correct) {
    if (currentScreen !== "bp-scr-game" || paused) return;
    let answer = "";
    if (correct && mode === "cadena") {
      answer = $("bp-chain-answer").value.trim();
      if (!answer) {
        $("bp-chain-error").textContent = "Escribe la palabra válida para preparar la siguiente cadena.";
        $("bp-chain-error").hidden = false;
        return;
      }
      lastAnswer = answer;
    }

    clearInterval(timer);
    timer = null;
    endsAt = 0;
    turnsPlayed += 1;

    if (correct) {
      score[active] = (score[active] || 0) + 1;
      window.emitSound?.(700, 0.08, "triangle");
    } else if (mode === "supervivencia") {
      score[active] = (score[active] || 0) - 1;
      window.emitSound?.(240, 0.12, "sawtooth");
    }
    advanceTurn();
  }

  function timeExpired() {
    if (currentScreen !== "bp-scr-game" || paused) return;
    clearInterval(timer);
    timer = null;
    endsAt = 0;
    turnsPlayed += 1;
    if (mode === "supervivencia") score[active] = (score[active] || 0) - 1;
    window.emitSound?.(180, 0.3, "sawtooth");
    advanceTurn();
  }

  function finish() {
    clearInterval(timer);
    timer = null;
    endsAt = 0;
    paused = false;
    if (!teams.length) return;
    const max = Math.max(...score);
    const winners = teams.filter((team, index) => score[index] === max);
    const totalTurns = rounds * teams.length;
    $("bp-result-body").innerHTML =
      '<div class="bp-verdict"><strong>' + (winners.length > 1 ? "¡Empate!" : "¡Ganó " + esc(winners[0]) + "!") +
      '</strong><p class="muted">Turnos completados: ' + turnsPlayed + " de " + totalTurns +
      " · Ronda " + Math.min(round, rounds) + " de " + rounds + '.</p></div>' +
      '<div class="bp-team-list">' + teams.map((team, index) =>
        '<div class="bp-team-row"><span>' + esc(team) + "</span><strong>" + score[index] + " pts</strong></div>"
      ).join("") + "</div>";
    showScreen("bp-scr-result");
  }

  function togglePause() {
    if (currentScreen !== "bp-scr-game") return;
    if (!paused) {
      remainingMs = Math.max(0, endsAt - Date.now());
      clearInterval(timer);
      timer = null;
      paused = true;
    } else {
      if (remainingMs <= 0) {
        paused = false;
        timeExpired();
        return;
      }
      paused = false;
      endsAt = Date.now() + remainingMs;
      startTimer(endsAt);
    }
    renderTurnState();
    save();
  }

  function syncConfig() {
    $("bp-teams").value = String(teams.length || 2);
    $("bp-rounds").value = String(rounds);
    $("bp-time").value = String(time);
    $("bp-goal").value = String(goal);
    $("bp-category-filter").value = categoryFilter;
    renderTeamInputs();
  }

  function newGame() {
    clearInterval(timer);
    timer = null;
    window.GameSession?.clear("batalla");
    round = 1;
    active = 0;
    turnsPlayed = 0;
    paused = false;
    endsAt = 0;
    score = [];
    current = null;
    currentScreen = "bp-scr-lobby";
    showError("");
    showScreen("bp-scr-lobby");
  }

  function restore(state) {
    if (!state?.teams?.length) return false;
    mode = modes.some(item => item.id === state.mode) ? state.mode : "normal";
    teams = state.teams.map((team, index) => String(team || "Equipo " + (index + 1)));
    round = Math.max(1, Number(state.round || 1));
    rounds = Number(state.rounds || 10);
    time = Number(state.time || 30);
    goal = Number(state.goal || 0);
    active = Math.max(0, Math.min(teams.length - 1, Number(state.active || 0)));
    score = Array.isArray(state.score) && state.score.length === teams.length
      ? state.score.map(Number)
      : Array(teams.length).fill(0);
    turnsPlayed = Number.isFinite(Number(state.turnsPlayed))
      ? Number(state.turnsPlayed)
      : (round - 1) * teams.length + active;
    current = state.current || null;
    lastAnswer = String(state.lastAnswer || "");
    categoryFilter = state.categoryFilter === "Todas" || categories.includes(state.categoryFilter) ? state.categoryFilter : "Todas";
    challengeDeck = Array.isArray(state.challengeDeck) ? state.challengeDeck.filter(entry => entry && categories.includes(entry.category) && typeof entry.word === "string" && (categoryFilter === "Todas" || entry.category === categoryFilter)) : [];
    lastChallengeKey = String(state.lastChallengeKey || "");
    endsAt = Number(state.endsAt || 0);
    remainingMs = Number(state.remainingMs || 0);
    paused = Boolean(state.paused);
    currentScreen = state.screen || "bp-scr-lobby";

    renderModes();
    renderCategories();
    syncConfig();
    if (currentScreen === "bp-scr-game") {
      if (!current) {
        enterTurn();
        return true;
      }
      showScreen("bp-scr-game");
      $("bp-category").textContent = current.category || "";
      $("bp-letter").textContent = mode === "normal" ? "" : current.letter || "";
      $("bp-letter").style.display = mode === "normal" ? "none" : "block";
      $("bp-active").textContent = teams[active];
      $("bp-chain-wrap").hidden = mode !== "cadena";
      $("bp-chain-answer").value = "";
      updatePrompt();
      renderScore();
      if (paused) renderTurnState();
      else startTimer(endsAt, remainingMs);
    } else if (currentScreen === "bp-scr-result") {
      finish();
    } else {
      showScreen("bp-scr-lobby");
    }
    return true;
  }

  function openEndConfirm() {
    $("bp-end-confirm").classList.add("active");
    $("bp-end-cancel").focus();
  }

  function closeEndConfirm() {
    $("bp-end-confirm").classList.remove("active");
    $("bp-end").focus();
  }

  function bind() {
    renderModes();
    renderTeamInputs();
    renderCategories();
    $("bp-modes").onclick = event => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;
      mode = button.dataset.mode;
      renderModes();
      save();
    };
    $("bp-teams").onchange = () => { renderTeamInputs(); save(); };
    $("bp-team-inputs").oninput = save;
    ["bp-rounds", "bp-time", "bp-goal"].forEach(id => $(id).onchange = save);
    $("bp-category-filter").onchange = event => {
      categoryFilter = event.target.value;
      challengeDeck = [];
      save();
    };
    $("bp-start").onclick = startGame;
    $("bp-pause").onclick = togglePause;
    $("bp-correct").onclick = () => completeTurn(true);
    $("bp-wrong").onclick = () => completeTurn(false);
    $("bp-next").onclick = () => completeTurn(false);
    $("bp-end").onclick = openEndConfirm;
    $("bp-end-cancel").onclick = closeEndConfirm;
    $("bp-end-confirm-submit").onclick = () => { closeEndConfirm(); finish(); };
    window.addEventListener("keydown", event => {
      if (event.key === "Escape" && $("bp-end-confirm").classList.contains("active")) closeEndConfirm();
    });
    $("bp-new").onclick = newGame;
  }

  function init() {
    bind();
    window.GameSession?.register(save);
    const saved = window.GameSession?.load?.("batalla");
    if (!restore(saved)) showScreen("bp-scr-lobby");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  return { startGame, finish };
})();
