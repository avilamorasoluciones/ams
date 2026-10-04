const TabuGame = (() => {
  const STORAGE_KEY = "avila_mora_players"; // Llave compartida
  let players = [];
  let teams = [];
  let pool = [];
  let usedWords = [];
  
  let currentRound = 1;
  let maxRounds = 3;
  let activeTeamIndex = 0;
  let timePerTurn = 60;
  
  let timerId = null;
  let secondsLeft = 0;
  let timerEndsAt = 0;
  let currentWord = null;
  let turnStats = { correct: 0, taboo: 0, skip: 0 };

  function $(id) { return document.getElementById(id); }

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); players = Array.isArray(parsed) ? parsed : []; }
    } catch(e) { players = []; }
  }

  function savePlayers() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); } catch(e) {}
  }

  function normalizeWord(word) {
    return String(word || "").trim().toLocaleLowerCase("es");
  }

  function saveSession(screen = document.querySelector(".im-screen.active")?.id || "t-scr-lobby") {
    window.GameSession?.save("tabu", { players, teams, pool, usedWords, currentRound, maxRounds, activeTeamIndex, timePerTurn, secondsLeft, timerEndsAt, currentWord, turnStats, screen, savedAt: Date.now() });
  }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "t-scr-lobby" && id !== "t-scr-teams");
    saveSession(id);
  }

  function renderPlayers() {
    const list = $("t-uiPlayerList");
    if (players.length === 0) {
      list.innerHTML = '<div class="muted center full-width">Añade los jugadores.</div>';
      return;
    }
    list.innerHTML = players.map((p, i) => `
      <div class="player-tag">${window.uiIcon("user")} ${window.Utils.escapeHTML(p)} <button type="button" class="delete-btn" data-remove="${i}" aria-label="Eliminar ${window.Utils.escapeHTML(p)}">×</button></div>
    `).join("");
  }

  function addPlayer() {
    const name = $("t-inpName").value.trim().toUpperCase();
    if (!name || players.includes(name)) return;
    players.push(name);
    $("t-inpName").value = "";
    savePlayers();
    renderPlayers();
    window.emitSound(560, 0.08, "triangle");
  }

  function clearPlayers() {
    if (!confirm("¿Seguro que deseas borrar todos los jugadores? Esto afectará a los demás juegos.")) return;
    players = []; 
    savePlayers();
    renderPlayers();
    window.emitSound(250, 0.12, "sawtooth");
  }

  function startGame() {
    const numTeams = parseInt($("t-selTeams").value);
    if (players.length < numTeams * 2) {
      return alert(`Para ${numTeams} equipos, necesitas al menos ${numTeams * 2} jugadores.`);
    }

    maxRounds = parseInt($("t-selRounds").value);
    timePerTurn = parseInt($("t-selTime").value);
    
    const limit = $("t-selLimit").value;

    // El mazo es único para toda la partida: ningún equipo puede volver
    // a recibir una palabra que ya haya salido en una ronda anterior.
    const seenWords = new Set();
    const uniqueCards = DB_TABU.filter(card => {
      const key = normalizeWord(card?.word);
      if (!key || seenWords.has(key)) return false;
      seenWords.add(key);
      return true;
    });
    const shuffledPool = window.Utils.shuffleArray(uniqueCards);
    pool = limit === "all" ? shuffledPool : shuffledPool.slice(0, parseInt(limit));
    usedWords = [];

    if (pool.length === 0) return alert("Error cargando palabras.");

    const shuffledPlayers = window.Utils.shuffleArray([...players]);
    teams = Array.from({length: numTeams}, (_, i) => ({
      name: `Equipo ${i + 1}`,
      defaultName: `Equipo ${i + 1}`,
      members: [],
      speakerIdx: 0,
      stats: { score: 0, correct: 0, taboo: 0, skip: 0 }
    }));

    shuffledPlayers.forEach((p, i) => teams[i % numTeams].members.push(p));

    $("t-uiTeamsList").innerHTML = teams.map((t, i) => `
      <div class="team-card">
        <div class="team-name">Equipo ${i + 1}</div>
        <input class="team-name-input" id="t-teamName-${i}" type="text" maxlength="24" autocomplete="off" placeholder="Nombre del equipo..." aria-label="Nombre del equipo ${i + 1}" />
        <div class="team-members">${t.members.map(window.Utils.escapeHTML).join(" · ")}</div>
      </div>
    `).join("");

    currentRound = 1;
    activeTeamIndex = 0;

    changeScreen("t-scr-teams");
  }

  function confirmTeamNames() {
    teams.forEach((team, i) => {
      const input = $(`t-teamName-${i}`);
      const name = input?.value.trim();
      team.name = name || team.defaultName || ("Equipo " + (i + 1));
    });
    setupTurn();
  }

  function updateLiveStats() {
    $("t-liveCorrect").textContent = turnStats.correct;
    $("t-liveTaboo").textContent = turnStats.taboo;
    $("t-liveSkip").textContent = turnStats.skip;
  }

  function setActionFeedback(button) {
    if (!button) return;
    button.classList.remove("tabu-action-feedback");
    void button.offsetWidth;
    button.classList.add("tabu-action-feedback");
    setTimeout(() => button.classList.remove("tabu-action-feedback"), 140);
  }

  function getNextTurnLabel() {
    const nextTeamIndex = (activeTeamIndex + 1) % teams.length;
    const nextRound = activeTeamIndex === teams.length - 1 ? currentRound + 1 : currentRound;
    if (nextRound > maxRounds) return "¡La partida termina después de este turno!";
    const nextTeam = teams[nextTeamIndex];
    const nextSpeaker = nextTeam?.members[nextTeam?.speakerIdx] || "";
    return "Siguiente: " + (nextTeam?.name || "Equipo") + (nextSpeaker ? " · habla " + nextSpeaker : "");
  }

  function setupTurn() {
    if (currentRound > maxRounds || pool.length === 0) {
      endGame();
      return;
    }

    turnStats = { correct: 0, taboo: 0, skip: 0 };
    updateLiveStats();
    
    const activeTeam = teams[activeTeamIndex];
    const watcherTeamIndex = (activeTeamIndex + 1) % teams.length;
    const watcherTeam = teams[watcherTeamIndex];
    const speaker = activeTeam.members[activeTeam.speakerIdx];

    $("t-txtTurnRound").textContent = `Ronda ${currentRound} de ${maxRounds}`;
    $("t-txtActiveTeam").textContent = activeTeam.name;
    $("t-txtSpeaker").textContent = speaker;
    $("t-txtWatcher").textContent = watcherTeam.name;
    $("t-txtWatcherMembers").textContent = watcherTeam.members.join(" · ");

    changeScreen("t-scr-preturn");
  }

  function startTimer(resume = false) {
    if (!resume) {
      if (!loadWord()) return;
      secondsLeft = timePerTurn;
      timerEndsAt = Date.now() + (timePerTurn * 1000);
    } else if (!timerEndsAt) {
      timerEndsAt = Date.now() + (Math.max(0, secondsLeft) * 1000);
    }

    clearInterval(timerId);
    updateTimerUI();
    $("t-liveTeam").textContent = teams[activeTeamIndex]?.name || "Equipo";
    $("t-liveRound").textContent = "Ronda " + currentRound + " de " + maxRounds;
    changeScreen("t-scr-game");

    timerId = setInterval(() => {
      const remaining = Math.max(0, timerEndsAt - Date.now());
      secondsLeft = Math.ceil(remaining / 1000);
      updateTimerUI();

      if (secondsLeft > 0 && secondsLeft <= 10) {
        window.emitSound(1000, 0.03, "sine");
      }

      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        secondsLeft = 0;
        updateTimerUI();
        saveSession("t-scr-game");
        finishTurn();
      } else {
        saveSession("t-scr-game");
      }
    }, 250);
  }

  function updateTimerUI() {
    const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const secs = (secondsLeft % 60).toString().padStart(2, "0");
    const timerEl = $("t-uiTimer");
    timerEl.textContent = `${mins}:${secs}`;

    if (secondsLeft <= 10) timerEl.classList.add("blinking");
    else timerEl.classList.remove("blinking");
  }

  function loadWord() {
    let nextWord = null;

    // Buscar explícitamente una palabra que jamás haya salido en esta partida.
    while (pool.length > 0 && !nextWord) {
      const candidate = pool.pop();
      const key = normalizeWord(candidate?.word);
      if (!key || usedWords.includes(key)) continue;
      nextWord = candidate;
      usedWords.push(key);
    }

    if (!nextWord) {
      clearInterval(timerId);
      alert("¡Se acabaron las palabras nuevas del mazo!");
      finishTurn();
      return false;
    }

    currentWord = nextWord;
    $("t-catBadge").textContent = currentWord.cat.toUpperCase();
    $("t-txtMainWord").textContent = currentWord.word;
    $("t-uiForbiddenList").innerHTML = currentWord.forbidden.map(w => `<li>${w}</li>`).join("");
    return true;
  }

  function recordAction(type) {
    if (type === 'correct') {
      turnStats.correct++;
      window.emitSound(600, 0.1, "triangle");
    } else if (type === 'taboo') {
      turnStats.taboo++;
      window.emitSound(200, 0.2, "sawtooth");
    } else {
      turnStats.skip++;
      window.emitSound(400, 0.1, "sine");
    }
    updateLiveStats();
    loadWord();
    saveSession("t-scr-game");
  }

  function finishTurn() {
    window.emitSound(220, 0.4, "sawtooth");
    const activeTeam = teams[activeTeamIndex];
    const pointsEarned = turnStats.correct - turnStats.taboo;
    
    activeTeam.stats.correct += turnStats.correct;
    activeTeam.stats.taboo += turnStats.taboo;
    activeTeam.stats.skip += turnStats.skip;
    activeTeam.stats.score += pointsEarned;
    activeTeam.speakerIdx = (activeTeam.speakerIdx + 1) % activeTeam.members.length;

    $("t-txtSummaryTeam").textContent = "Puntaje de " + activeTeam.name;
    $("t-txtNextTurn").textContent = getNextTurnLabel();
    $("t-statCorrect").textContent = turnStats.correct;
    $("t-statTaboo").textContent = turnStats.taboo;
    $("t-statPoints").textContent = pointsEarned > 0 ? `+${pointsEarned}` : pointsEarned;

    const isLastTurn = (currentRound === maxRounds && activeTeamIndex === teams.length - 1);
    $("t-btnNextTurn").innerHTML = isLastTurn ? window.uiIcon("crown") + " Ver Resultados" : "Siguiente Turno " + window.uiIcon("next");

    changeScreen("t-scr-turn-summary");
  }

  function advanceNextTurn() {
    activeTeamIndex++;
    if (activeTeamIndex >= teams.length) {
      activeTeamIndex = 0;
      currentRound++;
    }
    
    if (currentRound > maxRounds) {
      endGame();
    } else {
      setupTurn();
    }
  }

  function endGame() {
    teams.sort((a, b) => b.stats.score - a.stats.score);
    const topScore = teams[0]?.stats.score ?? 0;
    const winners = teams.filter(t => t.stats.score === topScore);
    $("t-scr-result").querySelector(".winner-title").textContent = winners.length > 1 ? "¡Empate!" : "¡Tenemos ganador!";
    $("t-uiFinalResults").innerHTML = teams.map((t, i) => `
      <div class="team-card" style="${i === 0 ? 'border-color:var(--warning); background: rgba(245,158,11,0.1);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="team-name" style="${t.stats.score === topScore ? 'color:var(--warning); font-size:1.5rem;' : ''}">
            ${t.stats.score === topScore ? window.uiIcon("crown") + " " : ""}${t.name}
          </h2>
          <div class="giant-score" style="font-size:2rem; margin-top:0;">${t.stats.score} pts</div>
        </div>
        <p class="muted" style="font-size:0.9rem; margin-top:4px;">
          ${window.uiIcon("check")} Aciertos: ${t.stats.correct} | ${window.uiIcon("close")} Tabús: ${t.stats.taboo} |  Saltos: ${t.stats.skip}
        </p>
      </div>
    `).join("");

    window.emitSound(800, 0.1, "triangle");
    setTimeout(() => window.emitSound(1000, 0.2, "triangle"), 150);
    setTimeout(() => window.emitSound(1200, 0.4, "triangle"), 350);

    changeScreen("t-scr-result");
  }

  function init() {
    loadPlayers(); // Cargar globales
    $("t-btnAddPlayer").onclick = addPlayer;
    $("t-btnClearPlayers").onclick = clearPlayers;
    $("t-inpName").onkeydown = (e) => { if (e.key === "Enter") addPlayer(); };
    
    $("t-uiPlayerList").onclick = (e) => {
      if (e.target.closest("[data-remove]")) {
        players.splice(e.target.dataset.remove, 1);
        savePlayers();
        renderPlayers();
      }
    };

    $("t-btnStart").onclick = startGame;
    $("t-btnConfirmTeams").onclick = confirmTeamNames;
    $("t-btnStartTurn").onclick = () => startTimer();
    
    $("t-btnCorrect").onclick = () => { setActionFeedback($("t-btnCorrect")); recordAction("correct"); };
    $("t-btnTaboo").onclick = () => { setActionFeedback($("t-btnTaboo")); recordAction("taboo"); };
    $("t-btnSkip").onclick = () => { setActionFeedback($("t-btnSkip")); recordAction("skip"); };
    
    $("t-btnNextTurn").onclick = advanceNextTurn;
    $("t-btnRestart").onclick = () => { clearInterval(timerId); window.GameSession?.clear("tabu"); changeScreen("t-scr-lobby"); };
    
    renderPlayers();
    window.GameSession?.register(saveSession);
    const saved = window.GameSession?.load("tabu");
    if (saved && saved.screen !== "t-scr-lobby" && Array.isArray(saved.teams) && saved.teams.length) {
      players = Array.isArray(saved.players) ? saved.players : players;
      teams = saved.teams;
      pool = Array.isArray(saved.pool) ? saved.pool : [];
      usedWords = Array.isArray(saved.usedWords) ? saved.usedWords.map(normalizeWord).filter(Boolean) : [];
      currentRound = Number(saved.currentRound || 1);
      maxRounds = Number(saved.maxRounds || 3);
      activeTeamIndex = Number(saved.activeTeamIndex || 0);
      timePerTurn = Number(saved.timePerTurn || 60);
      secondsLeft = Number(saved.secondsLeft || 0);
      timerEndsAt = Number(saved.timerEndsAt || 0);
      currentWord = saved.currentWord || null;
      // Compatibilidad con partidas guardadas antes de añadir usedWords:
      // la carta actualmente visible queda marcada como utilizada.
      if (currentWord?.word) {
        const currentKey = normalizeWord(currentWord.word);
        if (currentKey && !usedWords.includes(currentKey)) usedWords.push(currentKey);
      }
      turnStats = saved.turnStats || { correct: 0, taboo: 0, skip: 0 };
      renderPlayers();
      $("t-uiTeamsList").innerHTML = teams.map((t, i) => `
        <div class="team-card">
          <div class="team-name">${window.Utils.escapeHTML(t.name || t.defaultName || ("Equipo " + (i + 1)))}</div>
          <div class="team-members">${t.members.map(window.Utils.escapeHTML).join(" · ")}</div>
        </div>
      `).join("");
      if (currentWord) {
        $("t-catBadge").textContent = currentWord.cat?.toUpperCase() || "";
        $("t-txtMainWord").textContent = currentWord.word || "";
        $("t-uiForbiddenList").innerHTML = (currentWord.forbidden || []).map(w => `<li>${w}</li>`).join("");
      }
      updateLiveStats();
      if (saved.screen === "t-scr-preturn") {
        setupTurn();
      } else if (saved.screen === "t-scr-game") {
        if (!timerEndsAt) {
          const elapsed = Math.max(0, Math.floor((Date.now() - Number(saved.savedAt || Date.now())) / 1000));
          secondsLeft = Math.max(0, secondsLeft - elapsed);
          timerEndsAt = Date.now() + (secondsLeft * 1000);
        } else {
          secondsLeft = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
        }
        updateTimerUI();
        if (secondsLeft > 0) startTimer(true); else finishTurn();
      } else if (saved.screen === "t-scr-turn-summary") {
        const activeTeam = teams[activeTeamIndex];
        $("t-txtSummaryTeam").textContent = "Puntaje de " + (activeTeam?.name || "");
        $("t-txtNextTurn").textContent = getNextTurnLabel();
        $("t-statCorrect").textContent = turnStats.correct;
        $("t-statTaboo").textContent = turnStats.taboo;
        $("t-statPoints").textContent = turnStats.correct - turnStats.taboo > 0 ? `+${turnStats.correct - turnStats.taboo}` : turnStats.correct - turnStats.taboo;
        changeScreen(saved.screen);
      } else if (saved.screen === "t-scr-result") {
        endGame();
      } else {
        changeScreen(saved.screen);
      }
    } else {
      changeScreen("t-scr-lobby");
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", TabuGame.init);