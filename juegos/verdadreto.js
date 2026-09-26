const VerdadRetoGame = (() => {
  const STORAGE_KEY = "avila_mora_players"; // Llave compartida
  let players = [];
  let poolVerdad = [];
  let poolReto = [];
  let currentPlayerIndex = 0;
  let turnsPlayed = 0;
  let maxTurns = 0;

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

  function saveSession(screen = document.querySelector(".im-screen.active")?.id || "vr-scr-lobby") {
    window.GameSession?.save("verdadreto", { players, poolVerdad, poolReto, currentPlayerIndex, turnsPlayed, maxTurns, screen, actionText: $("vr-txtAction")?.textContent || "", actionBadge: $("vr-catBadge")?.textContent || "" });
  }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "vr-scr-lobby");
    saveSession(id);
  }

  function renderPlayers() {
    const list = $("vr-uiPlayerList");
    if (players.length === 0) {
      list.innerHTML = '<div class="muted center full-width">Agrega mínimo 2 jugadores.</div>';
      return;
    }
    list.innerHTML = players.map((p, i) => `
      <div class="player-tag">${window.uiIcon("user")} ${window.Utils.escapeHTML(p)} <button type="button" class="delete-btn" data-remove="${i}" aria-label="Eliminar ${window.Utils.escapeHTML(p)}">×</button></div>
    `).join("");
  }

  function addPlayer() {
    const name = $("vr-inpName").value.trim().toUpperCase();
    if (!name || players.includes(name)) return;
    players.push(name);
    $("vr-inpName").value = "";
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
    if (players.length < 2) return alert("Se necesitan al menos 2 jugadores.");
    
    const limit = $("vr-selLimit").value;
    maxTurns = limit === "all" ? 9999 : parseInt(limit);
    turnsPlayed = 0;
    currentPlayerIndex = 0;

    poolVerdad = window.Utils.shuffleArray([...DB_VERDADRETO.Verdad]);
    poolReto = window.Utils.shuffleArray([...DB_VERDADRETO.Reto]);
    
    startTurn();
  }

  function startTurn() {
    if (turnsPlayed >= maxTurns || (poolVerdad.length === 0 && poolReto.length === 0)) {
      alert("¡El juego ha terminado!");
      changeScreen("vr-scr-lobby");
      return;
    }
    
    $("vr-txtCurrentPlayer").textContent = players[currentPlayerIndex];
    window.emitSound(450, 0.1, "square");
    changeScreen("vr-scr-choose");
  }

  function pickAction(type) {
    let text = "";
    let colorClass = "";
    let badge = "";

    if (type === "verdad") {
      if (poolVerdad.length === 0) return alert("¡Ya no quedan verdades!");
      text = poolVerdad.pop();
      badge = "${window.uiIcon("question")} Verdad";
      colorClass = "color-primary";
    } else {
      if (poolReto.length === 0) return alert("¡Ya no quedan retos!");
      text = poolReto.pop();
      badge = "${window.uiIcon("flame")} Reto";
      colorClass = "color-danger";
    }

    $("vr-catBadge").textContent = badge;
    $("vr-txtAction").textContent = text;
    saveSession("vr-scr-action");
    $("vr-txtAction").className = `prompt-main ${colorClass}`;
    
    window.emitSound(800, 0.1, "triangle");
    changeScreen("vr-scr-action");
  }

  function init() {
    loadPlayers(); // Cargar globales
    $("vr-btnAddPlayer").onclick = addPlayer;
    $("vr-btnClearPlayers").onclick = clearPlayers;
    $("vr-inpName").onkeydown = (e) => { if (e.key === "Enter") addPlayer(); };
    
    $("vr-uiPlayerList").onclick = (e) => {
      if (e.target.closest("[data-remove]")) {
        players.splice(e.target.dataset.remove, 1);
        savePlayers();
        renderPlayers();
      }
    };

    $("vr-btnStart").onclick = startGame;
    $("vr-btnEndChoose").onclick = () => { window.GameSession?.clear("verdadreto"); changeScreen("vr-scr-lobby"); };
    
    $("vr-btnVerdad").onclick = () => pickAction("verdad");
    $("vr-btnReto").onclick = () => pickAction("reto");

    $("vr-btnNextTurn").onclick = () => {
      turnsPlayed++;
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      startTurn();
    };

    renderPlayers();
    window.GameSession?.register(saveSession);
    const saved = window.GameSession?.load("verdadreto");
    if (saved && saved.screen !== "vr-scr-lobby") {
      players = Array.isArray(saved.players) ? saved.players : players;
      poolVerdad = Array.isArray(saved.poolVerdad) ? saved.poolVerdad : [];
      poolReto = Array.isArray(saved.poolReto) ? saved.poolReto : [];
      currentPlayerIndex = Number(saved.currentPlayerIndex || 0);
      turnsPlayed = Number(saved.turnsPlayed || 0);
      maxTurns = Number(saved.maxTurns || 0);
      renderPlayers();
      if (saved.screen === "vr-scr-action") {
        $("vr-txtCurrentPlayer").textContent = players[currentPlayerIndex] || "";
        $("vr-catBadge").textContent = saved.actionBadge || "";
        $("vr-txtAction").textContent = saved.actionText || "";
      } else {
        $("vr-txtCurrentPlayer").textContent = players[currentPlayerIndex] || "";
      }
      changeScreen(saved.screen);
    } else {
      changeScreen("vr-scr-lobby");
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", VerdadRetoGame.init);