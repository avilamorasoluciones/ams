/* Duelo: jugadores, parejas aleatorias, preguntas y puntuación. */
const Duelo = (() => {
  const $ = id => document.getElementById(id);
  const DB = window.AMS_NEW_GAMES_DB?.duelo?.questions || [];
  const STORAGE_PLAYERS = "duelo_players_v1";
  const ranges = [
    ["Cultura general", 0, 10],
    ["Colombia", 10, 15],
    ["Entretenimiento", 15, 25],
    ["Ciencia", 25, 30]
  ];

  let players = [];
  let time = 12;
  let currentCategory = "Todas";
  let participants = [];
  let matches = [];
  let matchIndex = 0;
  let playerScores = {};
  let current = null;
  let questionDeck = [];
  let lastQuestionIndex = -1;
  let timer = null;
  let timerEndsAt = 0;
  let remainingMs = 0;
  let paused = false;
  let phase = "idle";
  let history = [];
  let currentScreen = "du-scr-lobby";

  const esc = value => window.Utils?.escapeHTML
    ? window.Utils.escapeHTML(value)
    : String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));

  function categoryOf(index) {
    return ranges.find(range => index >= range[1] && index < range[2])?.[0] || "General";
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function validQuestion(question) {
    return Array.isArray(question)
      && typeof question[0] === "string"
      && Array.isArray(question[1])
      && question[1].length > 0
      && Number.isInteger(question[2])
      && question[2] >= 0
      && question[2] < question[1].length;
  }

  function candidateIndices() {
    return DB.map((question, index) => ({ question, index }))
      .filter(item => validQuestion(item.question)
        && (currentCategory === "Todas" || categoryOf(item.index) === currentCategory))
      .map(item => item.index);
  }

  function renderCategories() {
    $("du-cat").innerHTML = '<option value="Todas">Todas las categorías</option>' +
      ranges.map(range => '<option value="' + esc(range[0]) + '">' + esc(range[0]) + "</option>").join("");
    $("du-cat").value = currentCategory;
  }

  function savePlayers() {
    try { localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(players)); } catch (error) {}
  }

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(STORAGE_PLAYERS);
      const parsed = raw ? JSON.parse(raw) : [];
      players = Array.isArray(parsed) ? parsed.filter(name => typeof name === "string" && name.trim()) : [];
    } catch (error) {
      players = [];
    }
  }

  function renderPlayers() {
    const list = $("du-uiPlayerList");
    if (!list) return;
    if (!players.length) {
      list.innerHTML = '<div class="muted center full-width">Agrega mínimo 2 jugadores.</div>';
      return;
    }
    list.innerHTML = players.map((player, index) =>
      '<div class="player-tag">' + window.uiIcon?.("user") + " " + esc(player) +
      '<span class="delete-btn" data-remove="' + index + '" role="button" tabindex="0" aria-label="Quitar ' + esc(player) + '">×</span></div>'
    ).join("");
  }

  function addPlayer() {
    const input = $("du-inpName");
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    if (players.some(player => player.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))) {
      input.value = "";
      return;
    }
    players.push(name);
    input.value = "";
    savePlayers();
    renderPlayers();
    window.emitSound?.(560, 0.08, "triangle");
    input.focus();
  }

  function removePlayer(index) {
    const realIndex = Number(index);
    if (!Number.isInteger(realIndex) || realIndex < 0 || realIndex >= players.length) return;
    players.splice(realIndex, 1);
    savePlayers();
    renderPlayers();
    window.emitSound?.(320, 0.08, "triangle");
  }

  function clearPlayers() {
    if (!players.length) return;
    if (!confirm("¿Borrar jugadores?")) return;
    players = [];
    try { localStorage.removeItem(STORAGE_PLAYERS); } catch (error) {}
    renderPlayers();
    window.emitSound?.(250, 0.12, "sawtooth");
  }

  function captureLobbyConfig() {
    time = Number($("du-time").value || 12);
    currentCategory = $("du-cat").value || "Todas";
  }

  function save() {
    if (currentScreen === "du-scr-lobby") captureLobbyConfig();
    window.GameSession?.save("duelo", {
      schemaVersion: 3, players, time, currentCategory,
      participants, matches, matchIndex, playerScores, current, questionDeck,
      lastQuestionIndex, timerEndsAt, remainingMs, paused, phase, history, screen: currentScreen
    });
  }

  function showScreen(id) {
    currentScreen = id;
    ["du-scr-lobby", "du-scr-game", "du-scr-result"].forEach(screenId => {
      $(screenId).hidden = screenId !== id;
    });
    save();
  }

  function showError(message) {
    const node = $("du-data-error");
    node.textContent = message || "";
    node.hidden = !message;
  }

  function syncConfig() {
    $("du-time").value = String(time);
    renderCategories();
    renderPlayers();
  }

  function getParticipant(id) {
    return participants.find(player => player.id === id) || null;
  }

  function currentMatch() {
    const match = matches[matchIndex];
    if (!match) return null;
    return { a: getParticipant(match.a), b: getParticipant(match.b) };
  }

  function renderScoreboard(pair) {
    $("du-scoreboard").innerHTML = participants.map(player =>
      '<div class="du-score-row' + (pair && (pair.a?.id === player.id || pair.b?.id === player.id) ? " active" : "") +
      '"><span>' + esc(player.name) + '</span><strong>' + (playerScores[player.id] || 0) + " pts</strong></div>"
    ).join("");
  }

  function answerText(index) {
    const source = DB[index];
    return source && source[1] ? String(source[1][source[2]] || "") : "";
  }

  function render() {
    const pair = currentMatch();
    $("du-round-label").textContent = "Duelo " + Math.min(matchIndex + 1, matches.length) + " de " + matches.length;
    $("du-cat-label").textContent = current?.category || "Categoría";
    $("du-name-a").textContent = pair?.a?.name || "";
    $("du-name-b").textContent = pair?.b?.name || "";
    $("du-team-a-label").textContent = "Jugador";
    $("du-team-b-label").textContent = "Jugador";
    $("du-question").textContent = current?.text || "";
    $("du-point-a").textContent = pair?.a ? "Punto para " + pair.a.name : "";
    $("du-point-b").textContent = pair?.b ? "Punto para " + pair.b.name : "";
    $("du-point-actions").hidden = phase !== "answer" || paused;
    $("du-point-a").disabled = phase !== "answer" || paused;
    $("du-point-b").disabled = phase !== "answer" || paused;
    $("du-result-message").hidden = phase !== "done";
    $("du-official-answer").hidden = phase !== "done";
    $("du-official-answer").textContent = phase === "done" && current
      ? "Respuesta de referencia: " + answerText(current.index)
      : "";
    $("du-pause-banner").hidden = !paused;
    $("du-pause").hidden = phase !== "answer";
    $("du-pause").textContent = paused ? "Continuar" : "Pausar";
    $("du-pause").setAttribute("aria-pressed", String(paused));
    $("du-timer").textContent = paused
      ? String(Math.ceil(remainingMs / 1000))
      : (timerEndsAt && phase === "answer"
        ? String(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)))
        : "");
    $("du-next").hidden = phase !== "done";
    $("du-next").textContent = matchIndex >= matches.length - 1 ? "Ver resultado final" : "Siguiente duelo";
    if (paused) $("du-status").textContent = "Pausa.";
    else if (phase === "answer") $("du-status").textContent = "¿Quién respondió primero y bien?";
    else if (phase === "done") {
      const item = history[history.length - 1];
      $("du-result-message").textContent = item?.winner
        ? "Punto para " + (getParticipant(item.winner)?.name || "el jugador elegido") + "."
        : "Se acabó el tiempo. Nadie suma este duelo.";
      $("du-status").textContent = item?.winner ? "Punto anotado." : "Se acabó el tiempo.";
    } else $("du-status").textContent = "";
    renderScoreboard(pair);
  }

  function startTimer(deadline = 0, remaining = 0) {
    clearInterval(timer);
    timer = null;
    if (paused || phase !== "answer") return;
    timerEndsAt = deadline || (Date.now() + (remaining || time * 1000));
    if (timerEndsAt <= Date.now()) { resolve(null); return; }
    updateTimer();
    if (phase === "answer") timer = setInterval(updateTimer, 100);
  }

  function updateTimer() {
    if (paused || phase !== "answer") return;
    const left = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    $("du-timer").textContent = String(left);
    if (left <= 0) resolve(null);
  }

  function pickQuestion() {
    if (!questionDeck.length) {
      questionDeck = shuffle(candidateIndices());
      if (questionDeck.length > 1 && questionDeck[questionDeck.length - 1] === lastQuestionIndex) {
        [questionDeck[0], questionDeck[questionDeck.length - 1]] =
          [questionDeck[questionDeck.length - 1], questionDeck[0]];
      }
    }
    const index = questionDeck.pop();
    const source = DB[index];
    if (!source) return null;
    lastQuestionIndex = index;
    return { index, text: source[0], category: categoryOf(index) };
  }

  function buildParticipants() {
    return players.map((name, index) => ({
      id: "p" + index,
      name,
      team: -1
    }));
  }

  function buildMatches() {
    const pool = shuffle([...participants]);
    return Array.from({ length: pool.length / 2 }, (_, index) => ({
      a: pool[index * 2].id, b: pool[index * 2 + 1].id
    }));
  }

  function beginMatch() {
    if (matchIndex >= matches.length) { finish(); return; }
    current = pickQuestion();
    if (!current) {
      showError("No hay preguntas para esa categoría. Prueba otra.");
      showScreen("du-scr-lobby");
      return;
    }
    phase = "answer";
    paused = false;
    remainingMs = 0;
    timerEndsAt = Date.now() + time * 1000;
    render();
    showScreen("du-scr-game");
    startTimer(timerEndsAt);
  }

  function startGame() {
    captureLobbyConfig();
    const cleanNames = players.map(name => String(name || "").trim()).filter(Boolean);
    if (cleanNames.length < 2) {
      showError("Agrega mínimo 2 jugadores para empezar.");
      return;
    }
    if (cleanNames.length % 2 !== 0) {
      showError("Agrega un jugador más para que todos tengan pareja.");
      return;
    }
    const unique = new Set(cleanNames.map(name => name.toLocaleLowerCase("es")));
    if (unique.size !== cleanNames.length) {
      showError("Usa nombres distintos para identificar a cada jugador.");
      return;
    }
    players = cleanNames;
    savePlayers();
    participants = buildParticipants();
    matches = buildMatches();
    if (!matches.length || matches.some(match => !match.a || !match.b)) {
      showError("No pudimos crear la partida. Revisa los jugadores.");
      return;
    }
    playerScores = Object.fromEntries(participants.map(player => [player.id, 0]));
    matchIndex = 0;
    history = [];
    current = null;
    questionDeck = [];
    lastQuestionIndex = -1;
    showError("");
    window.emitSound?.(440, 0.03, "sine", 0.035);
    beginMatch();
  }

  function resolve(winnerId) {
    if (phase !== "answer") return;
    clearInterval(timer);
    timer = null;
    timerEndsAt = 0;
    paused = false;
    remainingMs = 0;

    const pair = currentMatch();
    if (winnerId) {
      const winner = getParticipant(winnerId);
      if (!winner || (winner.id !== pair?.a?.id && winner.id !== pair?.b?.id)) return;
      playerScores[winner.id] = (playerScores[winner.id] || 0) + 1;
    }
    history.push({
      match: matchIndex + 1,
      a: pair?.a?.id || "",
      b: pair?.b?.id || "",
      winner: winnerId || "",
      question: current?.text || "",
      category: current?.category || "",
      answer: answerText(current?.index)
    });
    phase = "done";
    window.emitSound?.(winnerId ? 720 : 220, 0.1, winnerId ? "triangle" : "sawtooth");
    render();
    save();
  }

  function advance() {
    if (phase !== "done") return;
    matchIndex += 1;
    beginMatch();
  }

  function resultSummary() {
    const high = Math.max(0, ...participants.map(player => playerScores[player.id] || 0));
    const winners = participants.filter(player => (playerScores[player.id] || 0) === high);
    const title = winners.length > 1
      ? "¡Empate entre " + winners.map(player => esc(player.name)).join(", ") + "!"
      : "¡Ganó " + esc(winners[0]?.name || "el duelo") + "!";
    return '<div class="du-help"><strong>' + title + '</strong><p class="muted">' +
      history.length + " duelos jugados.</p></div>" +
      participants.map(player => '<div class="du-result-row"><span>' + esc(player.name) +
        '</span><strong>' + (playerScores[player.id] || 0) + " pts</strong></div>").join("");
  }

  function finish() {
    clearInterval(timer);
    timer = null;
    paused = false;
    phase = "result";
    $("du-result-body").innerHTML = resultSummary() +
      '<div class="du-history"><strong>Preguntas jugadas</strong>' +
      (history.length ? history.map(item => {
        const a = getParticipant(item.a)?.name || "Jugador";
        const b = getParticipant(item.b)?.name || "Jugador";
        const winner = item.winner ? (getParticipant(item.winner)?.name || "Jugador") : "Nadie sumó";
        return '<div><strong>Duelo ' + item.match + " · " + esc(winner) + '</strong><br>' +
          '<small>' + esc(a) + " vs. " + esc(b) + " · " + esc(item.category) +
          "<br>" + esc(item.question) + " · respuesta: " + esc(item.answer) + "</small></div>";
      }).join("") : '<p class="muted">No hay duelos registrados.</p>') + "</div>";
    showScreen("du-scr-result");
  }

  function togglePause() {
    if (phase !== "answer") return;
    if (!paused) {
      remainingMs = Math.max(0, timerEndsAt - Date.now());
      clearInterval(timer);
      timer = null;
      paused = true;
    } else {
      if (remainingMs <= 0) { resolve(null); return; }
      paused = false;
      timerEndsAt = Date.now() + remainingMs;
      startTimer(timerEndsAt);
    }
    render();
    save();
  }

  function newGame() {
    clearInterval(timer);
    timer = null;
    window.GameSession?.clear("duelo");
    participants = [];
    matches = [];
    matchIndex = 0;
    playerScores = {};
    current = null;
    phase = "idle";
    history = [];
    questionDeck = [];
    paused = false;
    timerEndsAt = 0;
    remainingMs = 0;
    syncConfig();
    showError("");
    showScreen("du-scr-lobby");
  }

  function restore(state) {
    if (!state || state.schemaVersion !== 3) return false;
    players = Array.isArray(state.players) ? state.players.filter(name => typeof name === "string" && name.trim()) : players;
    time = Number(state.time || 12);
    currentCategory = state.currentCategory === "Todas" || ranges.some(range => range[0] === state.currentCategory)
      ? state.currentCategory : "Todas";
    participants = Array.isArray(state.participants) ? state.participants : [];
    matches = Array.isArray(state.matches) ? state.matches : [];
    matchIndex = Math.max(0, Number(state.matchIndex || 0));
    playerScores = state.playerScores && typeof state.playerScores === "object" ? state.playerScores : {};
    current = state.current && typeof state.current.text === "string" ? state.current : null;
    questionDeck = Array.isArray(state.questionDeck)
      ? state.questionDeck.filter(index => Number.isInteger(index) && validQuestion(DB[index])
        && (currentCategory === "Todas" || categoryOf(index) === currentCategory))
      : [];
    lastQuestionIndex = Number.isInteger(state.lastQuestionIndex) ? state.lastQuestionIndex : -1;
    timerEndsAt = Number(state.timerEndsAt || 0);
    remainingMs = Number(state.remainingMs || 0);
    paused = Boolean(state.paused);
    phase = state.phase || "idle";
    history = Array.isArray(state.history) ? state.history : [];
    currentScreen = state.screen || "du-scr-lobby";
    syncConfig();

    if (!participants.length || !matches.length) {
      showScreen("du-scr-lobby");
      return true;
    }
    if (currentScreen === "du-scr-game" && current) {
      render();
      showScreen("du-scr-game");
      if (phase === "answer" && !paused) startTimer(timerEndsAt, remainingMs);
      return true;
    }
    if (currentScreen === "du-scr-result") {
      finish();
      return true;
    }
    showScreen("du-scr-lobby");
    return true;
  }

  function openExitConfirm() {
    $("du-end-confirm").classList.add("active");
    $("du-end-cancel").focus();
  }

  function closeExitConfirm() {
    $("du-end-confirm").classList.remove("active");
    $("du-menu-game").focus();
  }

  function exitToMenu() {
    clearInterval(timer);
    timer = null;
    window.GameSession?.clear("duelo");
    window.location.href = "index.html";
  }

  function bind() {
    syncConfig();
    $("du-inpName").onkeydown = event => {
      if (event.key === "Enter") {
        event.preventDefault();
        addPlayer();
      }
    };
    $("du-btnAddPlayer").onclick = addPlayer;
    $("du-uiPlayerList").onclick = event => {
      const btn = event.target.closest("[data-remove]");
      if (btn) removePlayer(btn.getAttribute("data-remove"));
    };
    $("du-time").onchange = () => save();
    $("du-cat").onchange = event => {
      currentCategory = event.target.value;
      questionDeck = [];
      save();
    };
    $("du-start").onclick = startGame;
    $("du-point-a").onclick = () => {
      const pair = currentMatch();
      if (pair?.a) resolve(pair.a.id);
    };
    $("du-point-b").onclick = () => {
      const pair = currentMatch();
      if (pair?.b) resolve(pair.b.id);
    };
    $("du-pause").onclick = togglePause;
    $("du-next").onclick = advance;
    $("du-menu-game").onclick = openExitConfirm;
    $("du-end-cancel").onclick = closeExitConfirm;
    $("du-end-confirm-submit").onclick = exitToMenu;
    $("du-top-menu").onclick = event => {
      if (currentScreen === "du-scr-game") {
        event.preventDefault();
        openExitConfirm();
      }
    };
    window.addEventListener("keydown", event => {
      if (event.key === "Escape" && $("du-end-confirm").classList.contains("active")) closeExitConfirm();
    });
    $("du-new").onclick = newGame;
  }

  function init() {
    loadPlayers();
    bind();
    window.GameSession?.register(save);
    const saved = window.GameSession?.load?.("duelo");
    if (!restore(saved)) {
      window.GameSession?.clear("duelo");
      syncConfig();
      showScreen("du-scr-lobby");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  return { startGame, finish, addPlayer, removePlayer, clearPlayers };
})();