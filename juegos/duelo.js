/* Duelo: modos, cruces aleatorios, preguntas y puntuación. */
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
  let mode = "all";
  let time = 12;
  let targetPoints = 10;
  let currentCategory = "Todas";
  let teamNames = ["Equipo 1", "Equipo 2"];
  let participants = [];
  let matches = [];
  let matchIndex = 0;
  let playerScores = {};
  let teamScores = {0: 0, 1: 0};
  let tournamentRound = 1;
  let current = null;
  let questionDeck = [];
  let lastQuestionIndex = -1;
  let timer = null;
  let countdownTimer = null;
  let countdownActive = false;
  let countdownSeconds = 5;
  let currentMatchPoints = {a: 0, b: 0};
  let timerEndsAt = 0;
  let remainingMs = 0;
  let paused = false;
  let phase = "idle";
  let history = [];
  let currentScreen = "du-scr-lobby";
  let eliminated = [];
  let teamMatchFinished = false;

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
    for (let i = result.length - 1; i > 0; i -= 1) {
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

  function normalizeTargetPoints(value) {
    const points = Number(value);
    return Math.min(1000, Math.max(1, Number.isFinite(points) ? Math.round(points) : 10));
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
      '<button type="button" class="delete-btn" data-remove="' + index + '" aria-label="Quitar ' + esc(player) + '">×</button></div>'
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
    mode = $("du-mode")?.value || "all";
    time = Number($("du-time")?.value || 12);
    const targetSelect = $("du-target")?.value || "10";
    const customTarget = Number($("du-custom-target")?.value || 10);
    targetPoints = targetSelect === "custom" ? customTarget : Number(targetSelect);
    targetPoints = normalizeTargetPoints(targetPoints);
    currentCategory = $("du-cat")?.value || "Todas";
    teamNames = [
      ($("du-team-name-a")?.value || "Equipo 1").trim() || "Equipo 1",
      ($("du-team-name-b")?.value || "Equipo 2").trim() || "Equipo 2"
    ];
  }

  function save() {
    if (currentScreen === "du-scr-lobby") captureLobbyConfig();
    window.GameSession?.save("duelo", {
      schemaVersion: 8,
      players, mode, time, targetPoints, currentCategory, teamNames,
      currentMatchPoints, participants, matches, matchIndex, playerScores, teamScores,
      tournamentRound, current, questionDeck, lastQuestionIndex, timerEndsAt,
      remainingMs, paused, phase, history, eliminated, teamMatchFinished,
      screen: currentScreen
    });
  }

  function showScreen(id) {
    currentScreen = id;
    ["du-scr-lobby", "du-scr-preturn", "du-scr-game", "du-scr-result"].forEach(screenId => {
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
    if ($("du-time")) $("du-time").value = String(time);
    if ($("du-target")) $("du-target").value = [5, 10, 20].includes(targetPoints) ? String(targetPoints) : "custom";
    if ($("du-custom-target")) $("du-custom-target").value = String(targetPoints);
    if ($("du-custom-target-wrap")) $("du-custom-target-wrap").hidden = $("du-target")?.value !== "custom";
    if ($("du-team-name-a")) $("du-team-name-a").value = teamNames[0] || "Equipo 1";
    if ($("du-team-name-b")) $("du-team-name-b").value = teamNames[1] || "Equipo 2";
    updateModeUI();
    renderCategories();
    renderPlayers();
  }

  function updateModeUI() {
    const teamMode = mode === "teams" || mode === "teamTournament";
    const names = $("du-team-names");
    if (names) names.hidden = !teamMode;
    const help = $("du-mode-help");
    if (!help) return;
    const copy = {
      all: "Todos contra todos: todos los jugadores se enfrentan entre sí una vez. Los puntos se acumulan por jugador y al final se muestran oro, plata y bronce.",
      tournament: "Torneo contra todos: eliminación directa. Los cruces son aleatorios; si el número es impar, un jugador pasa de ronda automáticamente. Al final se reconocen oro, plata y bronce.",
      teams: "Equipos: los jugadores se reparten al azar en dos equipos lo más equilibrados posible. Los puntos son del equipo, no de cada jugador.",
      teamTournament: "Torneo por equipos: se forman dos equipos al azar y juegan por eliminación. Los puntos pertenecen al equipo."
    };
    help.textContent = copy[mode] || copy.all;
  }

  function getParticipant(id) {
    return participants.find(player => player.id === id) || null;
  }

  function getSideMembers(ids) {
    return (Array.isArray(ids) ? ids : [ids]).map(getParticipant).filter(Boolean);
  }

  function sideLabel(match, side) {
    const members = getSideMembers(match?.[side]);
    if (isTeamMode()) {
      const teamIndex = side === "a" ? 0 : 1;
      return teamNames[teamIndex] || "Equipo " + (teamIndex + 1);
    }
    return members.map(player => player.name).join(" y ") || "Jugador";
  }

  function sideSubLabel(match, side) {
    const members = getSideMembers(match?.[side]);
    if (isTeamMode()) {
      return "Juega: " + (members.map(player => player.name).join(" y ") || "sin jugadores");
    }
    return "Jugador";
  }

  function isTeamMode() {
    return mode === "teams" || mode === "teamTournament";
  }

  function currentMatch() {
    return matches[matchIndex] || null;
  }

  function answerText(index) {
    const source = DB[index];
    return source && source[1] ? String(source[1][source[2]] || "") : "";
  }

  function render() {
    const match = currentMatch();
    $("du-round-label").textContent = mode === "all"
      ? "Todos contra todos · " + Math.min(matchIndex + 1, matches.length) + " de " + matches.length
      : mode === "tournament"
        ? "Ronda " + tournamentRound + " · " + Math.min(matchIndex + 1, matches.length) + " de " + matches.length
        : mode === "teamTournament"
          ? "Torneo por equipos · Ronda " + tournamentRound
          : "Equipos";
    $("du-cat-label").textContent = current?.category || "Categoría";
    $("du-name-a").textContent = sideLabel(match, "a");
    $("du-name-b").textContent = sideLabel(match, "b");
    $("du-team-a-label").textContent = sideSubLabel(match, "a");
    $("du-team-b-label").textContent = sideSubLabel(match, "b");
    $("du-question").textContent = current?.text || "";
    $("du-point-a").textContent = isTeamMode()
      ? "Punto para " + sideLabel(match, "a")
      : "Punto para " + sideLabel(match, "a");
    $("du-point-b").textContent = isTeamMode()
      ? "Punto para " + sideLabel(match, "b")
      : "Punto para " + sideLabel(match, "b");
    $("du-point-a").setAttribute("aria-label", "Dar punto a " + sideLabel(match, "a"));
    $("du-point-b").setAttribute("aria-label", "Dar punto a " + sideLabel(match, "b"));

    const isAnswer = phase === "answer" && !paused;
    $("du-point-actions").hidden = !isAnswer;
    $("du-point-a").disabled = !isAnswer;
    $("du-point-b").disabled = !isAnswer;
    $("du-result-message").hidden = true;
    $("du-official-answer").hidden = !current;
    $("du-official-answer").textContent = current ? "Respuesta correcta: " + answerText(current.index) : "";
    $("du-countdown").hidden = !countdownActive;
    $("du-countdown-number").textContent = String(Math.max(0, countdownActive ? countdownSeconds : 0));
    $("du-countdown").querySelector("small").textContent = "Prepárense. Empieza el duelo.";
    $("du-pause-banner").hidden = !paused;
    $("du-pause").hidden = phase !== "answer";
    $("du-pause").textContent = paused ? "Continuar" : "Pausar";
    $("du-pause").setAttribute("aria-pressed", String(paused));
    $("du-timer").textContent = paused
      ? String(Math.ceil(remainingMs / 1000))
      : (timerEndsAt && phase === "answer"
        ? String(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)))
        : "");

    if (countdownActive) $("du-status").textContent = "Prepárense…";
    else if (paused) $("du-status").textContent = "Duelo en pausa.";
    else if (phase === "answer") $("du-status").textContent = isTeamMode()
      ? "Lee la pregunta y pulsa el equipo que respondió primero y bien."
      : "Lee la pregunta y pulsa al jugador que respondió primero y bien.";
    else $("du-status").textContent = "";
  }

  function renderPreturn() {
    const match = currentMatch();
    const first = history.length === 0 && tournamentRound === 1;
    $("du-preturn-kicker").textContent = first
      ? "Primer enfrentamiento"
      : (mode === "tournament" ? "Siguiente cruce · Ronda " + tournamentRound
        : mode === "teamTournament" ? "Siguiente cruce · Torneo por equipos"
        : "Siguiente enfrentamiento");
    $("du-preturn-title").textContent = first ? "Prepárense para empezar" : "Los siguientes son…";
    $("du-preturn-round").textContent = mode === "all"
      ? "Todos contra todos · Enfrentamiento " + (matchIndex + 1) + " de " + matches.length
      : mode === "tournament"
        ? "Torneo · Ronda " + tournamentRound + " · Cruce " + (matchIndex + 1) + " de " + matches.length
        : mode === "teamTournament"
          ? "Torneo por equipos · Ronda " + tournamentRound
          : "Equipos · Enfrentamiento";
    $("du-preturn-a").textContent = sideLabel(match, "a");
    $("du-preturn-b").textContent = sideLabel(match, "b");
    $("du-preturn-team-a").textContent = sideSubLabel(match, "a");
    $("du-preturn-team-b").textContent = sideSubLabel(match, "b");
    $("du-preturn-info").textContent = isTeamMode()
      ? "Cuando los equipos estén listos, pulsa Siguiente. Después habrá 5 segundos de cuenta regresiva y el puntaje será para el equipo."
      : "Cuando estén listos, pulsa Siguiente. Después habrá 5 segundos de cuenta regresiva y comenzarán las preguntas.";
  }

  function showNextMatchScreen() {
    clearInterval(countdownTimer);
    clearInterval(timer);
    timer = null;
    countdownTimer = null;
    countdownActive = false;
    current = null;
    timerEndsAt = 0;
    remainingMs = 0;
    paused = false;
    phase = "preturn";

    if (mode === "tournament" || mode === "teamTournament") {
      while (matches[matchIndex] && !matches[matchIndex].b) {
        const bracketMatch = matches[matchIndex];
        bracketMatch.winner = bracketMatch.a;
        history.push({
          match: matchIndex + 1,
          round: tournamentRound,
          bye: true,
          a: bracketMatch.a,
          b: [],
          winner: bracketMatch.a,
          question: "",
          category: "",
          answer: ""
        });
        eliminated.push({ ids: bracketMatch.b || [], round: tournamentRound, bye: true });
        matchIndex += 1;
      }
      if (matchIndex >= matches.length) {
        prepareNextTournamentRound();
        return;
      }
    }

    renderPreturn();
    showScreen("du-scr-preturn");
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    clearInterval(timer);
    timer = null;
    countdownActive = true;
    countdownSeconds = 5;
    phase = "countdown";
    current = null;
    timerEndsAt = 0;
    render();
    showScreen("du-scr-game");
    window.emitSound?.(620, 0.08, "sine", 0.16);
    countdownTimer = setInterval(() => {
      countdownSeconds -= 1;
      if (countdownSeconds <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        countdownActive = false;
        window.emitSound?.(880, 0.16, "sine", 0.2);
        beginMatch();
        save();
        return;
      }
      window.emitSound?.(620 + (5 - countdownSeconds) * 55, 0.08, "sine", 0.16);
      render();
      save();
    }, 1000);
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
    return players.map((name, index) => ({
      id: "p" + index,
      name,
      team: -1
    }));
  }

  function splitTeams() {
    const shuffled = shuffle(participants);
    const half = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, half);
    const teamB = shuffled.slice(half);
    participants.forEach(player => {
      player.team = teamA.some(member => member.id === player.id) ? 0 : 1;
    });
    return [teamA.map(player => player.id), teamB.map(player => player.id)];
  }

  function buildAllMatches() {
    const shuffled = shuffle(participants);
    const result = [];
    for (let i = 0; i < shuffled.length; i += 1) {
      for (let j = i + 1; j < shuffled.length; j += 1) {
        result.push({ a: [shuffled[i].id], b: [shuffled[j].id], winner: null });
      }
    }
    return shuffle(result);
  }

  function buildTournamentMatches(poolIds) {
    const shuffled = shuffle(poolIds.map(id => getParticipant(id)).filter(Boolean));
    const result = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      result.push({
        a: shuffled[i] ? [shuffled[i].id] : [],
        b: shuffled[i + 1] ? [shuffled[i + 1].id] : [],
        winner: null
      });
    }
    return result;
  }

  function buildTeamMatch(teamA, teamB) {
    return {
      a: [...teamA],
      b: [...teamB],
      winner: null,
      teamMatch: true
    };
  }

  function buildInitialMatches() {
    if (mode === "all") return buildAllMatches();
    if (mode === "tournament") return buildTournamentMatches(participants.map(player => player.id));
    const [teamA, teamB] = splitTeams();
    return [buildTeamMatch(teamA, teamB)];
  }

  function beginMatch() {
    if (matchIndex >= matches.length) {
      if (mode === "tournament" || mode === "teamTournament") prepareNextTournamentRound();
      else finish();
      return;
    }

    const match = currentMatch();
    if (!match?.a?.length || !match?.b?.length) {
      matchIndex += 1;
      beginMatch();
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
    countdownActive = false;
    timerEndsAt = Date.now() + time * 1000;
    render();
    showScreen("du-scr-game");
    startTimer(timerEndsAt);
  }

  function startGame() {
    captureLobbyConfig();
    const cleanNames = players.map(name => String(name || "").trim()).filter(Boolean);
    const minimum = isTeamMode() ? 4 : 2;
    if (cleanNames.length < minimum) {
      showError("Agrega mínimo " + minimum + " jugadores para este modo.");
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
    matches = [];
    matchIndex = 0;
    playerScores = Object.fromEntries(participants.map(player => [player.id, 0]));
    teamScores = {0: 0, 1: 0};
    currentMatchPoints = {a: 0, b: 0};
    tournamentRound = 1;
    history = [];
    eliminated = [];
    current = null;
    countdownActive = false;
    countdownSeconds = 5;
    questionDeck = [];
    lastQuestionIndex = -1;
    teamMatchFinished = false;
    showError("");

    if (mode === "all") {
      matches = buildAllMatches();
    } else if (mode === "tournament") {
      matches = buildTournamentMatches(participants.map(player => player.id));
    } else {
      const [teamA, teamB] = splitTeams();
      matches = [buildTeamMatch(teamA, teamB)];
    }

    if (!matches.length) {
      showError("No pudimos crear los enfrentamientos. Revisa los jugadores.");
      return;
    }

    window.emitSound?.(440, 0.03, "sine", 0.035);
    showNextMatchScreen();
  }

  function awardPoint(side) {
    const match = currentMatch();
    if (!match) return;

    if (isTeamMode()) {
      const team = side === "a" ? 0 : 1;
      teamScores[team] = (teamScores[team] || 0) + 1;
      currentMatchPoints[side] = Math.min(targetPoints, (currentMatchPoints[side] || 0) + 1);
      if (currentMatchPoints[side] >= targetPoints) {
        match.winner = side === "a" ? [...match.a] : [...match.b];
        teamMatchFinished = true;
      }
    } else {
      const id = side === "a" ? match.a[0] : match.b[0];
      playerScores[id] = (playerScores[id] || 0) + 1;
      currentMatchPoints[side] = Math.min(targetPoints, (currentMatchPoints[side] || 0) + 1);
      if (currentMatchPoints[side] >= targetPoints) {
        match.winner = [id];
      }
    }
  }

  function resolve(winnerSide) {
    if (phase !== "answer") return;
    clearInterval(timer);
    timer = null;
    timerEndsAt = 0;
    paused = false;
    remainingMs = 0;

    const match = currentMatch();
    const pointWinner = winnerSide ? (winnerSide === "a" ? [...match.a] : [...match.b]) : [];
    if (winnerSide) awardPoint(winnerSide);

    history.push({
      match: matchIndex + 1,
      round: tournamentRound,
      a: [...(match?.a || [])],
      b: [...(match?.b || [])],
      winner: match?.winner ? [...match.winner] : [],
      pointWinner,
      question: current?.text || "",
      category: current?.category || "",
      answer: answerText(current?.index),
      teamMode: isTeamMode()
    });

    window.emitSound?.(winnerSide ? 720 : 220, 0.06, winnerSide ? "triangle" : "sawtooth");

    if (match?.winner) {
      if (mode === "all") {
        matchIndex += 1;
        currentMatchPoints = {a: 0, b: 0};
        showNextMatchScreen();
        return;
      }

      if (mode === "tournament" || mode === "teamTournament") {
        matchIndex += 1;
        currentMatchPoints = {a: 0, b: 0};
        if (matchIndex >= matches.length) {
          prepareNextTournamentRound();
        } else {
          showNextMatchScreen();
        }
        return;
      }

      if (mode === "teams") {
        finish();
        return;
      }
    }

    beginMatch();
  }

  function prepareNextTournamentRound() {
    if (mode !== "tournament" && mode !== "teamTournament") {
      finish();
      return;
    }

    const winners = matches.map(match => Array.isArray(match.winner) ? match.winner : []).filter(ids => ids.length);
    if (winners.length <= 1) {
      finish();
      return;
    }

    if (mode === "teamTournament") {
      // Este modo usa dos equipos: la final se resuelve en un solo enfrentamiento.
      const teamA = participants.filter(player => player.team === 0).map(player => player.id);
      const teamB = participants.filter(player => player.team === 1).map(player => player.id);
      if (winners.length >= 2) {
        matches = [buildTeamMatch(teamA, teamB)];
        matchIndex = 0;
        tournamentRound += 1;
        currentMatchPoints = {a: 0, b: 0};
        history.push({ round: tournamentRound, transition: true });
        showNextMatchScreen();
        return;
      }
    }

    const winnerIds = winners.flat();
    tournamentRound += 1;
    matches = buildTournamentMatches(winnerIds);
    matchIndex = 0;
    currentMatchPoints = {a: 0, b: 0};
    history.push({ round: tournamentRound, transition: true });
    showNextMatchScreen();
  }

  function getIndividualPlacements() {
    if (mode !== "tournament") return [];
    const finals = history.filter(item => item.question && item.winner?.length);
    const lastRound = Math.max(1, ...finals.map(item => item.round || 1));
    const finalMatch = finals.filter(item => item.round === lastRound).at(-1);
    const goldId = finalMatch?.winner?.[0] || null;
    const silverId = finalMatch?.pointWinner?.length
      ? null
      : null;

    const lastPlayed = finals.filter(item => item.round === lastRound);
    const runner = lastPlayed.length
      ? lastPlayed[lastPlayed.length - 1]
      : null;
    const finalWinner = runner?.winner?.[0] || goldId;
    const finalA = runner?.a?.[0] || null;
    const finalB = runner?.b?.[0] || null;
    const silver = finalWinner === finalA ? finalB : finalA;

    const bronze = [];
    if (lastRound <= 1) return placements;
    const semiRound = lastRound - 1;
    history.filter(item => item.question && item.round === semiRound && item.winner?.length).forEach(item => {
      const a = item.a?.[0];
      const b = item.b?.[0];
      const winner = item.winner[0];
      const loser = winner === a ? b : a;
      if (loser) bronze.push(loser);
    });

    const placements = [];
    if (finalWinner) placements.push({ medal: "🥇", label: "Oro", ids: [finalWinner] });
    if (silver) placements.push({ medal: "🥈", label: "Plata", ids: [silver] });
    if (bronze.length) placements.push({ medal: "🥉", label: "Bronce", ids: bronze });
    return placements;
  }

  function getPodiumByPoints() {
    const ranking = participants
      .map(player => ({ player, score: playerScores[player.id] || 0 }))
      .sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name, "es"));
    if (!ranking.length) return [];
    const result = [];
    if (ranking[0]) result.push({ medal: "🥇", label: "Oro", ids: [ranking[0].player.id], score: ranking[0].score });
    if (ranking[1]) result.push({ medal: "🥈", label: "Plata", ids: [ranking[1].player.id], score: ranking[1].score });
    if (ranking[2]) result.push({ medal: "🥉", label: "Bronce", ids: [ranking[2].player.id], score: ranking[2].score });
    return result;
  }

  function getTeamPlacements() {
    const winnerTeam = teamScores[0] >= teamScores[1] ? 0 : 1;
    const loserTeam = winnerTeam === 0 ? 1 : 0;
    if (mode === "teamTournament") {
      return [
        { medal: "🥇", label: "Oro", team: winnerTeam },
        { medal: "🥈", label: "Plata", team: loserTeam }
      ];
    }
    return [
      { medal: "🥇", label: "Oro", team: winnerTeam },
      { medal: "🥈", label: "Plata", team: loserTeam }
    ];
  }

  function renderPodium() {
    if (mode === "all") {
      return getPodiumByPoints().map(item => {
        const p = getParticipant(item.ids[0]);
        return '<div class="du-result-row"><span>' + item.medal + " " + item.label + " · " + esc(p?.name || "Jugador") +
          '</span><strong>' + item.score + " pts</strong></div>";
      }).join("");
    }

    if (mode === "tournament") {
      return getIndividualPlacements().map(item => {
        const names = item.ids.map(id => getParticipant(id)?.name || "Jugador").join(" y ");
        return '<div class="du-result-row"><span>' + item.medal + " " + item.label + " · " + esc(names) + "</span></div>";
      }).join("");
    }

    return getTeamPlacements().map(item => {
      const members = participants.filter(player => player.team === item.team).map(player => player.name).join(" y ");
      return '<div class="du-result-row"><span>' + item.medal + " " + item.label + " · " + esc(teamNames[item.team]) +
        '</span><strong>' + (teamScores[item.team] || 0) + " pts</strong></div>" +
        '<div class="muted">Juega: ' + esc(members) + "</div>";
    }).join("");
  }

  function resultSummary() {
    if (mode === "all") {
      return '<div class="du-help"><strong>Clasificación final</strong><p class="muted">Solo se muestran oro, plata y bronce.</p></div>' +
        renderPodium();
    }
    if (mode === "tournament") {
      return '<div class="du-help"><strong>Clasificación del torneo</strong><p class="muted">Eliminación directa. Solo se muestran oro, plata y bronce.</p></div>' +
        renderPodium();
    }
    return '<div class="du-help"><strong>Resultado por equipos</strong><p class="muted">El puntaje pertenece al equipo.</p></div>' +
      renderPodium();
  }

  function finish() {
    clearInterval(timer);
    clearInterval(countdownTimer);
    timer = null;
    countdownTimer = null;
    paused = false;
    phase = "result";

    const matchGroups = new Map();
    history.filter(item => item.question).forEach(item => {
      const key = item.round + ":" + item.match;
      if (!matchGroups.has(key)) {
        matchGroups.set(key, {
          round: item.round,
          match: item.match,
          a: item.a,
          b: item.b,
          aPoints: 0,
          bPoints: 0,
          questions: 0,
          winner: []
        });
      }
      const group = matchGroups.get(key);
      group.questions += 1;
      if (item.pointWinner?.length) {
        if (item.a?.includes(item.pointWinner[0]) || (item.teamMode && item.pointWinner[0] && item.a?.includes(item.pointWinner[0]))) group.aPoints += 1;
        else group.bPoints += 1;
      }
      if (item.winner?.length) group.winner = item.winner;
    });

    const compactHistory = Array.from(matchGroups.values()).map(group => {
      const match = {a: group.a, b: group.b};
      const a = sideLabel(match, "a");
      const b = sideLabel(match, "b");
      const winnerNames = getSideMembers(group.winner).map(player => player.name).join(" y ");
      const title = winnerNames ? "Ganó " + esc(isTeamMode() ? sideLabel({a: group.winner, b: []}, "a") : winnerNames) : "Enfrentamiento";
      return '<div><strong>Ronda ' + group.round + " · Duelo " + group.match + '</strong><br>' +
        '<span>' + esc(a) + " <strong>" + group.aPoints + " - " + group.bPoints + "</strong> " + esc(b) + '</span><br>' +
        '<small>' + title + " · " + group.questions + (group.questions === 1 ? " pregunta" : " preguntas") + "</small></div>";
    }).join("");

    $("du-result-body").innerHTML = resultSummary() +
      '<div class="du-history"><strong>Historial de enfrentamientos</strong>' +
      (compactHistory || '<p class="muted">No hay enfrentamientos registrados.</p>') + "</div>";
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
    clearInterval(countdownTimer);
    timer = null;
    countdownTimer = null;
    window.GameSession?.clear("duelo");
    participants = [];
    matches = [];
    tournamentRound = 1;
    teamScores = {0: 0, 1: 0};
    currentMatchPoints = {a: 0, b: 0};
    matchIndex = 0;
    playerScores = {};
    current = null;
    phase = "idle";
    countdownActive = false;
    countdownSeconds = 5;
    history = [];
    eliminated = [];
    questionDeck = [];
    paused = false;
    timerEndsAt = 0;
    remainingMs = 0;
    teamMatchFinished = false;
    syncConfig();
    showError("");
    showScreen("du-scr-lobby");
  }

  function restore(state) {
    if (!state || state.schemaVersion !== 8) return false;
    players = Array.isArray(state.players) ? state.players.filter(name => typeof name === "string" && name.trim()) : players;
    mode = ["all", "tournament", "teams", "teamTournament"].includes(state.mode) ? state.mode : "all";
    time = Number(state.time || 12);
    targetPoints = normalizeTargetPoints(state.targetPoints || 10);
    currentCategory = state.currentCategory === "Todas" || ranges.some(range => range[0] === state.currentCategory)
      ? state.currentCategory : "Todas";
    teamNames = Array.isArray(state.teamNames) && state.teamNames.length >= 2
      ? [String(state.teamNames[0] || "Equipo 1"), String(state.teamNames[1] || "Equipo 2")]
      : ["Equipo 1", "Equipo 2"];
    participants = Array.isArray(state.participants) ? state.participants : [];
    matches = Array.isArray(state.matches) ? state.matches : [];
    currentMatchPoints = state.currentMatchPoints && typeof state.currentMatchPoints === "object"
      ? state.currentMatchPoints : {a: 0, b: 0};
    matchIndex = Math.max(0, Number(state.matchIndex || 0));
    playerScores = state.playerScores && typeof state.playerScores === "object" ? state.playerScores : {};
    teamScores = state.teamScores && typeof state.teamScores === "object" ? state.teamScores : {0: 0, 1: 0};
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
    eliminated = Array.isArray(state.eliminated) ? state.eliminated : [];
    teamMatchFinished = Boolean(state.teamMatchFinished);
    currentScreen = state.screen || "du-scr-lobby";
    syncConfig();

    if (!participants.length || !matches.length) {
      showScreen("du-scr-lobby");
      return true;
    }
    if (currentScreen === "du-scr-preturn" || phase === "preturn") {
      showNextMatchScreen();
      return true;
    }
    if (currentScreen === "du-scr-game" && (current || phase === "countdown")) {
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
    $("du-end-cancel").focus();
  }

  function exitToMenu() {
    clearInterval(timer);
    clearInterval(countdownTimer);
    timer = null;
    countdownTimer = null;
    window.GameSession?.clear("duelo");
    participants = [];
    matches = [];
    matchIndex = 0;
    tournamentRound = 1;
    playerScores = {};
    teamScores = {0: 0, 1: 0};
    currentMatchPoints = {a: 0, b: 0};
    current = null;
    phase = "idle";
    countdownActive = false;
    countdownSeconds = 5;
    history = [];
    eliminated = [];
    questionDeck = [];
    paused = false;
    timerEndsAt = 0;
    remainingMs = 0;
    teamMatchFinished = false;
    syncConfig();
    showError("");
    showScreen("du-scr-lobby");
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function bind() {
    syncConfig();
    $("du-mode")?.addEventListener("change", event => {
      mode = event.target.value;
      updateModeUI();
      save();
    });
    $("du-target")?.addEventListener("change", () => { captureLobbyConfig(); syncConfig(); save(); });
    $("du-custom-target")?.addEventListener("input", () => { if ($("du-target")?.value === "custom") { captureLobbyConfig(); save(); } });
    $("du-team-name-a")?.addEventListener("input", () => { captureLobbyConfig(); save(); });
    $("du-team-name-b")?.addEventListener("input", () => { captureLobbyConfig(); save(); });
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
    $("du-start-next").onclick = startCountdown;
    $("du-preturn-exit").onclick = exitToMenu;
    $("du-point-a").onclick = () => resolve("a");
    $("du-point-b").onclick = () => resolve("b");
    $("du-pause").onclick = togglePause;
    $("du-menu-game").onclick = openExitConfirm;
    $("du-end-cancel").onclick = closeExitConfirm;
    $("du-end-confirm-submit").onclick = exitToMenu;
    $("du-top-menu").onclick = event => {
      if (currentScreen === "du-scr-game" || currentScreen === "du-scr-preturn") {
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