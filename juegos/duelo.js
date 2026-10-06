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
  let mode = "duel";
  let time = 12;
  let targetPoints = 10;
  let currentCategory = "Todas";
  let participants = [];
  let matches = [];
  let matchIndex = 0;
  let playerScores = {};
  let teamScores = {0:0,1:0};
  let tournamentRound = 1;
  let current = null;
  let questionDeck = [];
  let lastQuestionIndex = -1;
  let timer = null;
  let countdownTimer = null;
  let countdownActive = false;
  let countdownSeconds = 5;
  let currentMatchPoints = {a:0,b:0};
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
     mode = $("du-mode")?.value || "duel";
    time = Number($("du-time").value || 12);
    const targetSelect = $("du-target")?.value || "10";
    const customTarget = Number($("du-custom-target")?.value || 10);
    targetPoints = targetSelect === "custom" ? customTarget : Number(targetSelect);
    targetPoints = Math.min(1000, Math.max(1, Number.isFinite(targetPoints) ? targetPoints : 10));
    currentCategory = $("du-cat").value || "Todas";
  }

  function save() {
    if (currentScreen === "du-scr-lobby") captureLobbyConfig();
    window.GameSession?.save("duelo", {
      schemaVersion: 5, players, mode, time, targetPoints, currentCategory, currentMatchPoints,
      participants, matches, matchIndex, playerScores, teamScores, tournamentRound, current, questionDeck,
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
    if ($("du-mode")) $("du-mode").value = mode;
    $("du-time").value = String(time);
    if ($("du-target")) $("du-target").value = [5,10,20].includes(targetPoints) ? String(targetPoints) : "custom";
    if ($("du-custom-target")) $("du-custom-target").value = String(targetPoints);
    if ($("du-custom-target-wrap")) $("du-custom-target-wrap").hidden = $("du-target")?.value !== "custom";
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

  function answerText(index) {
    const source = DB[index];
    return source && source[1] ? String(source[1][source[2]] || "") : "";
  }

  function render() {
    const pair = currentMatch();
    $("du-round-label").textContent = mode === "tournament"
      ? "Ronda " + tournamentRound + " · Duelo " + Math.min(matchIndex + 1, matches.length) + " de " + matches.length
      : "Duelo";
    $("du-cat-label").textContent = current?.category || "Categoría";
    $("du-name-a").textContent = pair?.a?.name || "";
    $("du-name-b").textContent = pair?.b?.name || "";
    $("du-team-a-label").textContent = mode === "teams" ? "Equipo " + (pair?.a?.team === 0 ? "A" : "B") : "Jugador";
    $("du-team-b-label").textContent = mode === "teams" ? "Equipo " + (pair?.b?.team === 0 ? "A" : "B") : "Jugador";
    $("du-question").textContent = current?.text || "";
    $("du-point-a").textContent = pair?.a ? "Punto para " + pair.a.name : "";
    $("du-point-b").textContent = pair?.b ? "Punto para " + pair.b.name : "";

    const isAnswer = phase === "answer" && !paused;
    $("du-point-actions").hidden = !isAnswer;
    $("du-point-a").disabled = !isAnswer;
    $("du-point-b").disabled = !isAnswer;
    $("du-result-message").hidden = true;
    $("du-official-answer").hidden = !current;
    $("du-official-answer").textContent = current
      ? "Respuesta correcta: " + answerText(current.index)
      : "";
    $("du-countdown").hidden = !countdownActive;
    $("du-countdown-number").textContent = String(Math.max(0, countdownActive ? countdownSeconds : 0));
    $("du-pause-banner").hidden = !paused;
    $("du-pause").hidden = phase !== "answer";
    $("du-pause").textContent = paused ? "Continuar" : "Pausar";
    $("du-pause").setAttribute("aria-pressed", String(paused));
    $("du-timer").textContent = paused
      ? String(Math.ceil(remainingMs / 1000))
      : (timerEndsAt && phase === "answer"
        ? String(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)))
        : "");

    if (countdownActive) {
      $("du-status").textContent = "Prepárense…";
    } else if (paused) {
      $("du-status").textContent = "Duelo en pausa.";
    } else if (phase === "answer") {
      $("du-status").textContent = "Lee la pregunta y pulsa al jugador que respondió primero y bien.";
    } else {
      $("du-status").textContent = "";
    }
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    clearInterval(timer);
    timer = null;
    countdownActive = true;
    countdownSeconds = 5;
    phase = "countdown";
    render();
    showScreen("du-scr-game");
    countdownTimer = setInterval(() => {
      countdownSeconds -= 1;
      if (countdownSeconds <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        countdownActive = false;
        phase = "answer";
        timerEndsAt = Date.now() + time * 1000;
        render();
        startTimer(timerEndsAt);
        save();
        return;
      }
      render();
    }, 1000);
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
      team: mode === "teams" ? index % 2 : -1
    }));
  }

  function buildMatches(pool = participants) {
    if (mode === "teams") {
      const teamA = shuffle(pool.filter(player => player.team === 0));
      const teamB = shuffle(pool.filter(player => player.team === 1));
      if (!teamA.length || !teamB.length) return [];
      const count = Math.max(teamA.length, teamB.length);
      return Array.from({ length: count }, (_, index) => ({
        a: teamA[index % teamA.length].id,
        b: teamB[index % teamB.length].id
      }));
    }
    const shuffled = shuffle(pool);
    if (shuffled.length < 2) return [];
    const result = [];
    for (let index = 0; index < shuffled.length; index += 2) {
      result.push({
        a: shuffled[index].id,
        b: shuffled[index + 1]?.id || null
      });
    }
    return result;
  }

  function beginMatch() {
    if (matchIndex >= matches.length) { finish(); return; }
    const bracketMatch = matches[matchIndex];

    if (mode === "tournament" && !bracketMatch.b) {
      bracketMatch.winner = bracketMatch.a;
      history.push({
        match: matchIndex + 1, round: tournamentRound, bye: true,
        a: bracketMatch.a, b: "", winner: bracketMatch.a,
        question: "", category: "", answer: ""
      });
      matchIndex += 1;
      if (matchIndex >= matches.length) prepareNextTournamentRound();
      else beginMatch();
      return;
    }

    currentMatchPoints = {a:0,b:0};
    current = pickQuestion();
    if (!current) {
      showError("No hay preguntas para esa categoría. Prueba otra.");
      showScreen("du-scr-lobby");
      return;
    }

    phase = "answer";
    paused = false;
    remainingMs = 0;
    countdownActive = false;
    timerEndsAt = Date.now() + time * 1000;
    render();
    showScreen("du-scr-game");
    startTimer(timerEndsAt);
  }

  function startGame() {
    captureLobbyConfig();
    const cleanNames = players.map(name => String(name || "").trim()).filter(Boolean);
    const minimum = mode === "duel" ? 2 : 3;
    if (cleanNames.length < minimum) {
      showError("Agrega mínimo " + minimum + " jugadores para empezar.");
      return;
    }
    if (mode === "duel" && cleanNames.length % 2 !== 0) {
      showError("En 1 vs. 1 necesitas una cantidad par de jugadores. Para 5, 7 o cualquier grupo impar, elige Torneo o Equipos.");
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
    if (!matches.length || matches.some(match => !match.a)) {
      showError("No pudimos crear la partida. Revisa los jugadores.");
      return;
    }
    playerScores = Object.fromEntries(participants.map(player => [player.id, 0]));
    teamScores = {0:0,1:0};
    tournamentRound = 1;
    matchIndex = 0;
    history = [];
    current = null;
    countdownActive = false;
    countdownSeconds = 5;
    questionDeck = [];
    lastQuestionIndex = -1;
    showError("");
    window.emitSound?.(440, 0.03, "sine", 0.035);
    beginMatch();
    startCountdown();
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
      if (mode === "teams") teamScores[winner.team] = (teamScores[winner.team] || 0) + 1;

      const winnerSide = pair?.a?.id === winner.id ? "a" : "b";
      currentMatchPoints[winnerSide] = (currentMatchPoints[winnerSide] || 0) + 1;

      if (currentMatchPoints[winnerSide] >= targetPoints) {
        matches[matchIndex].winner = winner.id;
      }
    }

    history.push({
      match: matchIndex + 1,
      round: tournamentRound,
      a: pair?.a?.id || "",
      b: pair?.b?.id || "",
      winner: matches[matchIndex]?.winner || "",
      pointWinner: winnerId || "",
      question: current?.text || "",
      category: current?.category || "",
      answer: answerText(current?.index)
    });

    window.emitSound?.(winnerId ? 720 : 220, 0.06, winnerId ? "triangle" : "sawtooth");

    // No "Siguiente" button: every question advances automatically.
    if (matches[matchIndex]?.winner) {
      matchIndex += 1;
      if (mode === "tournament" && matchIndex >= matches.length) {
        prepareNextTournamentRound();
      } else {
        beginMatch();
      }
      return;
    }

    beginMatch();
  }

  function prepareNextTournamentRound() {
    if (mode !== "tournament") { finish(); return; }
    const winners = matches.map(match => match.winner).filter(Boolean);
    if (winners.length <= 1) {
      finish();
      return;
    }
    tournamentRound += 1;
    matches = buildMatches(winners.map(id => getParticipant(id)).filter(Boolean));
    matchIndex = 0;
    history.push({ round: tournamentRound, transition: true, winner: "" });
    beginMatch();
  }

  function advance() {
    // Kept only for saved sessions from older versions. New games advance automatically.
    if (phase === "done") beginMatch();
  }

  function resultSummary() {
    if (mode === "teams") {
      const high = Math.max(teamScores[0] || 0, teamScores[1] || 0);
      const winners = [0,1].filter(team => (teamScores[team] || 0) === high);
      const title = winners.length > 1 ? "¡Empate entre los equipos!" : "¡Ganó el Equipo " + (winners[0] === 0 ? "A" : "B") + "!";
      return '<div class="du-help"><strong>' + title + '</strong><p class="muted">' +
        history.filter(item => item.question || item.bye).length + " enfrentamientos jugados.</p></div>" +
        [0,1].map(team => '<div class="du-result-row"><span>Equipo ' + (team === 0 ? "A" : "B") + '</span><strong>' +
          (teamScores[team] || 0) + " pts</strong></div>").join("") +
        participants.map(player => '<div class="du-result-row"><span>' + esc(player.name) +
          ' · Equipo ' + (player.team === 0 ? "A" : "B") + '</span><strong>' + (playerScores[player.id] || 0) + " pts</strong></div>").join("");
    }
    const high = Math.max(0, ...participants.map(player => playerScores[player.id] || 0));
    const winners = mode === "tournament"
      ? participants.filter(player => player.id === history.filter(item => item.round === tournamentRound && item.winner).at(-1)?.winner)
      : participants.filter(player => (playerScores[player.id] || 0) === high);
    const title = winners.length > 1
      ? "¡Empate entre " + winners.map(player => esc(player.name)).join(", ") + "!"
      : (mode === "tournament" ? "🏆 ¡Campeón: " + esc(winners[0]?.name || "el torneo") + "!" : "¡Ganó " + esc(winners[0]?.name || "el duelo") + "!");
    return '<div class="du-help"><strong>' + title + '</strong><p class="muted">' +
      history.filter(item => item.question || item.bye).length + " duelos jugados.</p></div>" +
      participants.map(player => '<div class="du-result-row"><span>' + esc(player.name) +
        '</span><strong>' + (playerScores[player.id] || 0) + " pts</strong></div>").join("");
  }

  function finish() {
    clearInterval(timer);
    timer = null;
    paused = false;
    phase = "result";
    const playedHistory = history.filter(item => item.question);
    $("du-result-body").innerHTML = resultSummary() +
      '<div class="du-history"><strong>Preguntas jugadas</strong>' +
      (playedHistory.length ? playedHistory.map(item => {
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
    clearInterval(countdownTimer);
    timer = null;
    countdownTimer = null;
    window.GameSession?.clear("duelo");
    participants = [];
    matches = [];
    tournamentRound = 1;
    teamScores = {0:0,1:0};
    currentMatchPoints = {a:0,b:0};
    matchIndex = 0;
    playerScores = {};
    currentMatchPoints = {a:0,b:0};
    current = null;
    phase = "idle";
    countdownActive = false;
    countdownSeconds = 5;
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
    if (!state || ![3,4].includes(state.schemaVersion)) return false;
    players = Array.isArray(state.players) ? state.players.filter(name => typeof name === "string" && name.trim()) : players;
    mode = state.mode === "tournament" || state.mode === "teams" ? state.mode : "duel";
    time = Number(state.time || 12);
    targetPoints = Math.min(1000, Math.max(1, Number(state.targetPoints || 10)));
    currentCategory = state.currentCategory === "Todas" || ranges.some(range => range[0] === state.currentCategory)
      ? state.currentCategory : "Todas";
    participants = Array.isArray(state.participants) ? state.participants : [];
    matches = Array.isArray(state.matches) ? state.matches : [];
    currentMatchPoints = state.currentMatchPoints && typeof state.currentMatchPoints === "object" ? state.currentMatchPoints : {a:0,b:0};
    matchIndex = Math.max(0, Number(state.matchIndex || 0));
    playerScores = state.playerScores && typeof state.playerScores === "object" ? state.playerScores : {};
    teamScores = state.teamScores && typeof state.teamScores === "object" ? state.teamScores : {0:0,1:0};
    tournamentRound = Math.max(1, Number(state.tournamentRound || 1));
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
      countdownActive = phase === "countdown";
      render();
      showScreen("du-scr-game");
      if (phase === "answer" && !paused) startTimer(timerEndsAt, remainingMs);
      if (phase === "countdown") startCountdown();
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
    $("du-mode")?.addEventListener("change", event => { mode = event.target.value; save(); });
    $("du-target")?.addEventListener("change", () => { captureLobbyConfig(); syncConfig(); save(); });
    $("du-custom-target")?.addEventListener("input", () => { if ($("du-target")?.value === "custom") { captureLobbyConfig(); save(); } });
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