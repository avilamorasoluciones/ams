const TabuGame = (() => {
  const STORAGE_KEY = "avila_mora_players"; // Llave compartida
  let players = [];
  let teams = [];
  let pool = [];
  
  let currentRound = 1;
  let maxRounds = 3;
  let activeTeamIndex = 0;
  let timePerTurn = 60;
  
  let timerId = null;
  let secondsLeft = 0;
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

  function saveSession(screen = document.querySelector(".im-screen.active")?.id || "t-scr-lobby") {
    window.GameSession?.save("tabu", { players, teams, pool, currentRound, maxRounds, activeTeamIndex, timePerTurn, secondsLeft, currentWord, turnStats, screen, savedAt: Date.now() });
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
    const shuffledPool = window.Utils.shuffleArray([...DB_TABU]);
    pool = limit === "all" ? shuffledPool : shuffledPool.slice(0, parseInt(limit));
    
    if (pool.length === 0) return alert("Error cargando palabras.");

    const shuffledPlayers = window.Utils.shuffleArray([...players]);
    teams = Array.from({length: numTeams}, (_, i) => ({
      name: `Equipo ${i + 1}`,
      members: [],
      speakerIdx: 0,
      stats: { score: 0, correct: 0, taboo: 0, skip: 0 }
    }));

    shuffledPlayers.forEach((p, i) => teams[i % numTeams].members.push(p));

    $("t-uiTeamsList").innerHTML = teams.map(t => `
      <div class="team-card">
        <div class="team-name">${t.name}</div>
        <div class="team-members">${t.members.map(window.Utils.escapeHTML).join(" · ")}</div>
      </div>
    `).join("");

    currentRound = 1;
    activeTeamIndex = 0;
    
    changeScreen("t-scr-teams");
  }

  function updateLiveStats() {
    $("t-liveCorrect").textContent = turnStats.correct;
    $("t-liveTaboo").textContent = turnStats.taboo;
    $("t-liveSkip").textContent = turnStats.skip;
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

    changeScreen("t-scr-preturn");
  }

  function startTimer(resume = false) {
    if (!resume) {
      loadWord();
      secondsLeft = timePerTurn;
    }
    updateTimerUI();
    
    clearInterval(timerId);
    timerId = setInterval(() => {
      secondsLeft--;
      saveSession("t-scr-game");
      updateTimerUI();
      
      if (secondsLeft > 0 && secondsLeft <= 10) {
        window.emitSound(1000, 0.03, "sine");
      }
      if (secondsLeft <= 0) {
        clearInterval(timerId);
        finishTurn();
      }
    }, 1000);
    
    changeScreen("t-scr-game");
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
    if (pool.length === 0) {
      clearInterval(timerId);
      alert("¡Se acabaron las palabras del mazo!");
      finishTurn();
      return;
    }
    
    currentWord = pool.pop();
    $("t-catBadge").textContent = currentWord.cat.toUpperCase();
    $("t-txtMainWord").textContent = currentWord.word;
    $("t-uiForbiddenList").innerHTML = currentWord.forbidden.map(w => `<li>${w}</li>`).join("");
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

    $("t-txtSummaryTeam").textContent = `Puntaje de ${activeTeam.name}`;
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
    $("t-uiFinalResults").innerHTML = teams.map((t, i) => `
      <div class="team-card" style="${i === 0 ? 'border-color:var(--warning); background: rgba(245,158,11,0.1);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="team-name" style="${i===0 ? 'color:var(--warning); font-size:1.5rem;' : ''}">
            ${i===0 ? window.uiIcon("crown") + " " : ""}${t.name}
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
    $("t-btnConfirmTeams").onclick = setupTurn;
    $("t-btnStartTurn").onclick = startTimer;
    
    $("t-btnCorrect").onclick = () => recordAction('correct');
    $("t-btnTaboo").onclick = () => recordAction('taboo');
    $("t-btnSkip").onclick = () => recordAction('skip');
    
    $("t-btnNextTurn").onclick = advanceNextTurn;
    $("t-btnRestart").onclick = () => { clearInterval(timerId); window.GameSession?.clear("tabu"); changeScreen("t-scr-lobby"); };
    
    renderPlayers();
    window.GameSession?.register(saveSession);
    const saved = window.GameSession?.load("tabu");
    if (saved && saved.screen !== "t-scr-lobby" && Array.isArray(saved.teams) && saved.teams.length) {
      players = Array.isArray(saved.players) ? saved.players : players;
      teams = saved.teams;
      pool = Array.isArray(saved.pool) ? saved.pool : [];
      currentRound = Number(saved.currentRound || 1);
      maxRounds = Number(saved.maxRounds || 3);
      activeTeamIndex = Number(saved.activeTeamIndex || 0);
      timePerTurn = Number(saved.timePerTurn || 60);
      secondsLeft = Number(saved.secondsLeft || 0);
      currentWord = saved.currentWord || null;
      turnStats = saved.turnStats || { correct: 0, taboo: 0, skip: 0 };
      renderPlayers();
      $("t-uiTeamsList").innerHTML = teams.map(t => `
        <div class="team-card"><div class="team-name">${t.name}</div><div class="team-members">${t.members.map(window.Utils.escapeHTML).join(" · ")}</div></div>
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
        updateTimerUI();
        changeScreen("t-scr-game");
        const elapsed = Math.max(0, Math.floor((Date.now() - Number(saved.savedAt || Date.now())) / 1000));
        secondsLeft = Math.max(0, secondsLeft - elapsed);
        updateTimerUI();
        if (secondsLeft > 0) startTimer(true); else finishTurn();
      } else if (saved.screen === "t-scr-turn-summary") {
        const activeTeam = teams[activeTeamIndex];
        $("t-txtSummaryTeam").textContent = `Puntaje de ${activeTeam?.name || ""}`;
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