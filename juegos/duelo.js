/* Duelo: enfrentamientos aleatorios, respuesta oral y puntuación arbitral. */
const Duelo = (() => {
  const $ = id => document.getElementById(id);
  const DB = window.AMS_NEW_GAMES_DB?.duelo?.questions || [];
  const ranges = [
    ["Cultura general", 0, 10],
    ["Colombia", 10, 15],
    ["Entretenimiento", 15, 25],
    ["Ciencia", 25, 30]
  ];

  let format = "individual";
  let rosterSize = 4;
  let time = 12;
  let currentCategory = "Todas";
  let teamNames = ["Equipo 1", "Equipo 2"];
  let rosterNames = { individual: [], teams: [[], []] };
  let participants = [];
  let matches = [];
  let matchIndex = 0;
  let teamScores = [0, 0];
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

  function renderSizeOptions() {
    const options = format === "individual" ? [2, 4, 6, 8, 10, 12] : [1, 2, 3, 4, 5, 6];
    const oldSize = rosterSize;
    $("du-size").innerHTML = options.map(value => {
      const label = format === "individual"
        ? value + " jugadores · " + (value / 2) + " duelos"
        : value + (value === 1 ? " jugador" : " jugadores") + " por equipo · " + value + " duelos";
      return '<option value="' + value + '">' + label + "</option>";
    }).join("");
    rosterSize = options.includes(oldSize)
      ? oldSize
      : (format === "individual" ? 4 : 2);
    $("du-size").value = String(rosterSize);
    $("du-size-label").firstChild.textContent = format === "individual"
      ? "Cantidad de jugadores"
      : "Integrantes por equipo";
    $("du-team-config").hidden = format !== "teams";
    $("du-match-count").textContent = format === "individual"
      ? "Cada jugador tendrá un duelo. Se enfrentarán " + (rosterSize / 2) + " parejas."
      : "Cada integrante de ambos equipos juega una vez contra un rival aleatorio.";
    $("du-format-help").textContent = format === "individual"
      ? "La cantidad debe ser par. La app mezcla los nombres y forma las parejas al azar."
      : "La app empareja al azar a una persona de cada equipo. Los compañeros que esperan hacen de árbitros.";
  }

  function defaultPlayerName(index, teamIndex) {
    return format === "individual"
      ? "Jugador " + (index + 1)
      : "Jugador " + (teamIndex === 0 ? "A" : "B") + (index + 1);
  }

  function renderRosterInputs() {
    if (format === "individual") {
      const names = rosterNames.individual;
      $("du-roster-inputs").innerHTML = Array.from({ length: rosterSize }, (_, index) =>
        '<label>Jugador ' + (index + 1) + '<input id="du-player-' + index +
        '" maxlength="24" value="' + esc(names[index] || defaultPlayerName(index, 0)) +
        '" autocomplete="off" placeholder="Nombre del jugador"></label>'
      ).join("");
      return;
    }

    $("du-team-name-0").value = teamNames[0] || "Equipo 1";
    $("du-team-name-1").value = teamNames[1] || "Equipo 2";
    $("du-roster-inputs").innerHTML = [0, 1].map(teamIndex =>
      '<section class="du-team-roster"><h3>' + esc(teamNames[teamIndex] || ("Equipo " + (teamIndex + 1))) +
      '</h3><div class="stack">' + Array.from({ length: rosterSize }, (_, index) =>
        '<label>Integrante ' + (index + 1) + '<input id="du-player-' + teamIndex + "-" + index +
        '" maxlength="24" value="' + esc(rosterNames.teams[teamIndex][index] || defaultPlayerName(index, teamIndex)) +
        '" autocomplete="off" placeholder="Nombre del jugador"></label>'
      ).join("") + "</div></section>"
    ).join("");
  }

  function captureRosterInputs(targetFormat = format, targetSize = rosterSize) {
    const fieldValue = id => $(id)?.value.trim() || "";
    if (targetFormat === "individual") {
      rosterNames.individual = Array.from({ length: targetSize }, (_, index) =>
        fieldValue("du-player-" + index) || defaultPlayerName(index, 0));
      return;
    }
    teamNames = [
      fieldValue("du-team-name-0") || "Equipo 1",
      fieldValue("du-team-name-1") || "Equipo 2"
    ];
    rosterNames.teams = [0, 1].map(teamIndex =>
      Array.from({ length: targetSize }, (_, index) =>
        fieldValue("du-player-" + teamIndex + "-" + index) || defaultPlayerName(index, teamIndex))
    );
  }

  function captureLobbyConfig() {
    format = $("du-format").value === "teams" ? "teams" : "individual";
    rosterSize = Number($("du-size").value || rosterSize);
    time = Number($("du-time").value || 12);
    currentCategory = $("du-cat").value || "Todas";
    captureRosterInputs(format, rosterSize);
  }

  function save() {
    if (currentScreen === "du-scr-lobby") captureLobbyConfig();
    window.GameSession?.save("duelo", {
      schemaVersion: 2, format, rosterSize, time, currentCategory, teamNames, rosterNames,
      participants, matches, matchIndex, teamScores, playerScores, current, questionDeck,
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
    $("du-format").value = format;
    $("du-time").value = String(time);
    renderCategories();
    renderSizeOptions();
    renderRosterInputs();
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
    if (format === "teams") {
      $("du-scoreboard").innerHTML = [0, 1].map(teamIndex =>
        '<div class="du-score-row' + (pair && (pair.a?.team === teamIndex || pair.b?.team === teamIndex) ? " active" : "") +
        '"><span>' + esc(teamNames[teamIndex]) + '</span><strong>' + (teamScores[teamIndex] || 0) + " pts</strong></div>"
      ).join("");
      return;
    }
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
    $("du-team-a-label").textContent = format === "teams" && pair?.a ? teamNames[pair.a.team] : "Participante";
    $("du-team-b-label").textContent = format === "teams" && pair?.b ? teamNames[pair.b.team] : "Participante";
    $("du-question").textContent = current?.text || "";
    $("du-point-a").textContent = pair?.a ? "Punto para " + pair.a.name : "Punto para jugador 1";
    $("du-point-b").textContent = pair?.b ? "Punto para " + pair.b.name : "Punto para jugador 2";
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
        ? "Punto para " + (getParticipant(item.winner)?.name || "el participante elegido") + "."
        : "Se acabó el tiempo. Nadie suma este duelo.";
      $("du-status").textContent = item?.winner
        ? "Punto anotado."
        : "Se acabó el tiempo.";
    } else $("du-status").textContent = "";
    renderScoreboard(pair);
  }

  function startTimer(deadline = 0, remaining = 0) {
    clearInterval(timer);
    timer = null;
    if (paused || phase !== "answer") return;
    timerEndsAt = deadline || (Date.now() + (remaining || time * 1000));
    if (timerEndsAt <= Date.now()) {
      resolve(null);
      return;
    }
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
    if (format === "individual") {
      return rosterNames.individual.slice(0, rosterSize).map((name, index) => ({
        id: "p" + index, name: name || ("Jugador " + (index + 1)), team: -1
      }));
    }
    return [0, 1].flatMap(teamIndex =>
      rosterNames.teams[teamIndex].slice(0, rosterSize).map((name, index) => ({
        id: (teamIndex === 0 ? "a" : "b") + index,
        name: name || defaultPlayerName(index, teamIndex),
        team: teamIndex
      }))
    );
  }

  function buildMatches() {
    if (format === "individual") {
      const pool = shuffle([...participants]);
      return Array.from({ length: pool.length / 2 }, (_, index) => ({
        a: pool[index * 2].id, b: pool[index * 2 + 1].id
      }));
    }
    const first = shuffle(participants.filter(player => player.team === 0));
    const second = shuffle(participants.filter(player => player.team === 1));
    return first.map((player, index) => ({ a: player.id, b: second[index].id }));
  }

  function beginMatch() {
    if (matchIndex >= matches.length) {
      finish();
      return;
    }
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
    const candidates = candidateIndices();
    if (!candidates.length) {
      showError("No hay preguntas para esa categoría. Prueba otra.");
      return;
    }
    const names = format === "individual"
      ? rosterNames.individual.slice(0, rosterSize)
      : [...rosterNames.teams[0].slice(0, rosterSize), ...rosterNames.teams[1].slice(0, rosterSize)];
    const cleanNames = names.map(name => String(name || "").trim());
    const unique = new Set(cleanNames.map(name => name.toLocaleLowerCase("es")));
    if (unique.size !== cleanNames.length) {
      showError("Usa nombres distintos para identificar a cada jugador.");
      return;
    }
    if (format === "teams") {
      const normalizedTeams = teamNames.map(name => String(name || "").trim().toLocaleLowerCase("es"));
      if (!normalizedTeams[0] || normalizedTeams[0] === normalizedTeams[1]) {
        showError("Pon un nombre distinto a cada equipo.");
        return;
      }
    }
    if (format === "individual" && (rosterSize < 2 || rosterSize % 2 !== 0)) {
      showError("Elige una cantidad par de jugadores.");
      return;
    }

    participants = buildParticipants();
    matches = buildMatches();
    if (!matches.length || matches.some(match => !match.a || !match.b)) {
      showError("No pudimos crear la partida. Revisa los nombres.");
      return;
    }
    teamScores = [0, 0];
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
      if (format === "teams") teamScores[winner.team] += 1;
      else playerScores[winner.id] = (playerScores[winner.id] || 0) + 1;
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
    if (format === "teams") {
      const high = Math.max(...teamScores);
      const winners = [0, 1].filter(index => teamScores[index] === high).map(index => teamNames[index]);
      const title = winners.length > 1 ? "¡Empate entre ambos equipos!" : "¡Ganó " + esc(winners[0]) + "!";
      return '<div class="du-help"><strong>' + title + '</strong><p class="muted">' +
        teamScores[0] + " a " + teamScores[1] + " · " + history.length + " duelos jugados.</p></div>" +
        [0, 1].map(index => '<div class="du-result-row"><span>' + esc(teamNames[index]) +
          '</span><strong>' + teamScores[index] + " pts</strong></div>").join("");
    }
    const high = Math.max(0, ...participants.map(player => playerScores[player.id] || 0));
    const winners = participants.filter(player => (playerScores[player.id] || 0) === high);
    const title = winners.length > 1 ? "¡Empate entre " + winners.map(player => esc(player.name)).join(", ") + "!" :
      "¡Ganó " + esc(winners[0]?.name || "el duelo") + "!";
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
        const a = getParticipant(item.a)?.name || "Participante";
        const b = getParticipant(item.b)?.name || "Participante";
        const winner = item.winner ? (getParticipant(item.winner)?.name || "Participante") : "Nadie sumó";
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
      if (remainingMs <= 0) {
        resolve(null);
        return;
      }
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
    teamScores = [0, 0];
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
    if (!state || state.schemaVersion !== 2) return false;
    format = state.format === "teams" ? "teams" : "individual";
    rosterSize = Number(state.rosterSize || (format === "teams" ? 2 : 4));
    rosterSize = Math.max(format === "teams" ? 1 : 2, Math.min(format === "teams" ? 6 : 12, rosterSize));
    time = Number(state.time || 12);
    currentCategory = state.currentCategory === "Todas" || ranges.some(range => range[0] === state.currentCategory)
      ? state.currentCategory : "Todas";
    teamNames = Array.isArray(state.teamNames) ? state.teamNames.slice(0, 2) : ["Equipo 1", "Equipo 2"];
    rosterNames = state.rosterNames && Array.isArray(state.rosterNames.teams)
      ? state.rosterNames : { individual: [], teams: [[], []] };
    participants = Array.isArray(state.participants) ? state.participants : [];
    matches = Array.isArray(state.matches) ? state.matches : [];
    matchIndex = Math.max(0, Number(state.matchIndex || 0));
    teamScores = Array.isArray(state.teamScores) && state.teamScores.length === 2 ? state.teamScores : [0, 0];
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
    $("du-format").onchange = () => {
      captureRosterInputs(format, rosterSize);
      format = $("du-format").value === "teams" ? "teams" : "individual";
      rosterSize = format === "individual" ? 4 : 2;
      renderSizeOptions();
      renderRosterInputs();
      save();
    };
    $("du-size").onchange = () => {
      captureRosterInputs(format, rosterSize);
      rosterSize = Number($("du-size").value || (format === "individual" ? 4 : 2));
      renderRosterInputs();
      save();
    };
    $("du-roster-inputs").oninput = () => save();
    ["du-team-name-0", "du-team-name-1"].forEach(id => $(id).oninput = () => save());
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

  return { startGame, finish };
})();