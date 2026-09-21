const ImpostorGame = (() => {
  const STORAGE_PLAYERS = "impostor_players_v1";
  const STORAGE_USED = "impostor_used_words_final_ok";

  let players = [];
  let usedWords = [];
  let roles = [];
  let selectedCard = null;

  let currentIndex = 0;
  let starterIndex = 0;
  let secondsLeft = 300;

  let timerId = null;
  let timerRunning = false;
  let initialized = false;

  function $(id) {
    return document.getElementById(id);
  }

  function safeSound(freq, duration, type) {
    if (typeof window.emitSound === "function") {
      window.emitSound(freq, duration, type || "triangle");
    }
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function shuffle(array) {
    const copy = array.slice();

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }

    return copy;
  }

  function getDB() {
    if (typeof DB_IMPOSTOR !== "undefined") {
      return DB_IMPOSTOR;
    }

    if (typeof window.DB_IMPOSTOR !== "undefined") {
      return window.DB_IMPOSTOR;
    }

    return null;
  }

  function getAllCards() {
    const db = getDB();

    if (!db) {
      return [];
    }

    const cards = [];

    Object.keys(db).forEach((category) => {
      const group = db[category];

      if (!Array.isArray(group)) {
        return;
      }

      group.forEach((item) => {
        if (!Array.isArray(item)) {
          return;
        }

        if (item.length < 2) {
          return;
        }

        cards.push({
          category: category,
          emoji: item[0],
          word: item[1]
        });
      });
    });

    return cards;
  }

  function savePlayers() {
    try {
      localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(players));
    } catch (error) {}
  }

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(STORAGE_PLAYERS);
      const parsed = raw ? JSON.parse(raw) : [];

      players = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      players = [];
    }
  }

  function saveUsedWords() {
    try {
      sessionStorage.setItem(STORAGE_USED, JSON.stringify(usedWords));
    } catch (error) {}
  }

  function loadUsedWords() {
    try {
      const raw = sessionStorage.getItem(STORAGE_USED);
      const parsed = raw ? JSON.parse(raw) : [];

      usedWords = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      usedWords = [];
    }
  }

  function renderPlayers() {
    const list = $("i-uiPlayerList");

    if (!list) {
      return;
    }

    if (players.length === 0) {
      list.innerHTML = '<div class="muted center full-width">Agrega mínimo 3 jugadores.</div>';
      return;
    }

    list.innerHTML = players
      .map((player, index) => {
        return `
          <div class="player-tag">
            👤 ${escapeHTML(player)}
            <span class="delete-btn" data-remove="${index}">×</span>
          </div>
        `;
      })
      .join("");
  }

  function addPlayer() {
    const input = $("i-inpName");

    if (!input) {
      alert("No encontré el input de jugadores: i-inpName");
      return;
    }

    const name = input.value.trim().toUpperCase();

    if (!name) {
      return;
    }

    const exists = players.some((player) => {
      return player.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
      input.value = "";
      return;
    }

    players.push(name);
    input.value = "";

    savePlayers();
    renderPlayers();
    safeSound(560, 0.08, "triangle");
  }

  function removePlayer(index) {
    const realIndex = Number(index);

    if (Number.isNaN(realIndex)) {
      return;
    }

    players.splice(realIndex, 1);
    savePlayers();
    renderPlayers();
    safeSound(320, 0.08, "triangle");
  }

  function clearPlayers() {
    if (!confirm("¿Borrar jugadores?")) {
      return;
    }

    players = [];

    try {
      localStorage.removeItem(STORAGE_PLAYERS);
    } catch (error) {}

    renderPlayers();
    safeSound(250, 0.12, "sawtooth");
  }

  function changeScreen(screenId) {
    document.querySelectorAll(".im-screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const target = $(screenId);

    if (target) {
      target.classList.add("active");
    }

    const playing = !["i-scr-lobby", "i-scr-result"].includes(screenId);
    document.body.classList.toggle("playing", playing);

    window.scrollTo(0, 0);
  }

  function pickCard() {
    const allCards = getAllCards();

    if (allCards.length === 0) {
      alert("No encontré la base DB_IMPOSTOR en datos.js o está vacía.");
      return null;
    }

    let available = allCards.filter((card) => {
      return !usedWords.includes(card.word);
    });

    if (available.length === 0) {
      usedWords = [];
      available = allCards;
    }

    const card = available[Math.floor(Math.random() * available.length)];

    usedWords.push(card.word);
    saveUsedWords();

    return card;
  }

  function getMinimumPlayers(impostors) {
    return impostors + 2;
  }

  function createRoles(totalPlayers, totalImpostors) {
    const newRoles = Array(totalPlayers).fill("civil");
    const indexes = shuffle([...Array(totalPlayers).keys()]);

    for (let i = 0; i < totalImpostors; i++) {
      newRoles[indexes[i]] = "impostor";
    }

    return newRoles;
  }

  function startGame() {
    const impostorsSelect = $("i-selImposters");
    const timeSelect = $("i-selTime");

    if (!impostorsSelect) {
      alert("No encontré el selector i-selImposters.");
      return;
    }

    if (!timeSelect) {
      alert("No encontré el selector i-selTime.");
      return;
    }

    const impostors = parseInt(impostorsSelect.value, 10);
    const debateTime = parseInt(timeSelect.value, 10);
    const minimum = getMinimumPlayers(impostors);

    if (players.length < minimum) {
      alert(`Con ${impostors} impostor(es), necesitas mínimo ${minimum} jugadores.`);
      return;
    }

    selectedCard = pickCard();

    if (!selectedCard) {
      return;
    }

    roles = createRoles(players.length, impostors);
    currentIndex = 0;
    starterIndex = Math.floor(Math.random() * players.length);
    secondsLeft = debateTime;
    timerRunning = false;

    clearInterval(timerId);

    safeSound(450, 0.12, "square");
    setTimeout(() => safeSound(700, 0.18, "square"), 120);

    showPassScreen();
  }

  function showPassScreen() {
    const passName = $("i-txtPassName");

    if (passName) {
      passName.textContent = players[currentIndex];
    }

    changeScreen("i-scr-pass");
  }

  function revealRole() {
    const playerName = players[currentIndex];
    const role = roles[currentIndex];
    const starts = currentIndex === starterIndex;

    const revealName = $("i-txtRevealPlayer");
    const area = $("i-uiSecretArea");

    if (revealName) {
      revealName.textContent = playerName;
    }

    if (!area) {
      alert("No encontré el contenedor i-uiSecretArea.");
      return;
    }

    if (role === "impostor") {
      area.innerHTML = `
        <div class="emoji-display">😈</div>
        <div class="badge badge-pink">Rol secreto</div>
        <h2 class="game-title" style="margin-top:6px;color:var(--danger);">ERES EL IMPOSTOR</h2>
        <p class="muted strong-copy">No conoces la palabra exacta.</p>
        <p class="muted strong-copy">Categoría: <strong>${escapeHTML(selectedCard.category)}</strong></p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Tu misión</div>
          <p class="muted strong-copy">Escucha las pistas, improvisa y trata de parecer inocente.</p>
        </div>
        ${
          starts
            ? `
              <div class="box panel-soft full-width">
                <div class="label-muted color-warning">⚠️ Empiezas tú</div>
                <p class="muted strong-copy">Habla con seguridad y da una pista creíble.</p>
              </div>
            `
            : ""
        }
      `;
    } else {
      area.innerHTML = `
        <div class="emoji-display">${escapeHTML(selectedCard.emoji)}</div>
        <div class="badge badge-cyan">Palabra secreta</div>
        <h2 class="game-title" style="margin-top:6px;">${escapeHTML(selectedCard.word)}</h2>
        <p class="muted strong-copy">Todos los inocentes comparten esta palabra.</p>
        <p class="muted strong-copy">Categoría: <strong>${escapeHTML(selectedCard.category)}</strong></p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Tu misión</div>
          <p class="muted strong-copy">Da una pista corta y descubre quién está fingiendo.</p>
        </div>
        ${
          starts
            ? `
              <div class="box panel-soft full-width">
                <div class="label-muted color-warning">⚠️ Empiezas tú</div>
                <p class="muted strong-copy">No reveles demasiado la palabra.</p>
              </div>
            `
            : ""
        }
      `;
    }

    safeSound(800, 0.08, "triangle");
    changeScreen("i-scr-reveal");
  }

  function hideRole() {
    currentIndex++;
    safeSound(280, 0.05, "triangle");

    if (currentIndex < players.length) {
      showPassScreen();
      return;
    }

    startDebate();
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  function updateTimer() {
    const timer = $("i-uiTimer");

    if (!timer) {
      return;
    }

    timer.textContent = formatTime(secondsLeft);

    if (secondsLeft <= 15) {
      timer.classList.add("blinking");
    } else {
      timer.classList.remove("blinking");
    }
  }

  function startDebate() {
    const speaker = $("i-txtSpeaker");
    const pauseBtn = $("i-btnPause");

    if (speaker) {
      speaker.textContent = players[starterIndex];
    }

    if (pauseBtn) {
      pauseBtn.textContent = "⏸ Pausar";
    }

    updateTimer();
    changeScreen("i-scr-game");
    startTimer();
  }

  function startTimer() {
    clearInterval(timerId);
    timerRunning = true;

    timerId = setInterval(() => {
      secondsLeft--;
      updateTimer();

      if (secondsLeft > 0 && secondsLeft <= 10) {
        safeSound(1000, 0.03, "sine");
      }

      if (secondsLeft <= 0) {
        clearInterval(timerId);
        timerRunning = false;

        const timer = $("i-uiTimer");

        if (timer) {
          timer.textContent = "¡TIEMPO!";
          timer.classList.remove("blinking");
        }

        safeSound(220, 0.25, "sawtooth");

        setTimeout(() => {
          showVoteScreen();
        }, 700);
      }
    }, 1000);
  }

  function toggleTimer() {
    const btn = $("i-btnPause");

    if (timerRunning) {
      clearInterval(timerId);
      timerRunning = false;

      if (btn) {
        btn.textContent = "▶️ Reanudar";
      }

      safeSound(380, 0.08, "triangle");
      return;
    }

    if (btn) {
      btn.textContent = "⏸ Pausar";
    }

    safeSound(620, 0.08, "triangle");
    startTimer();
  }

  function showVoteScreen() {
    clearInterval(timerId);
    timerRunning = false;

    const list = $("i-uiVoteList");

    if (!list) {
      alert("No encontré el contenedor i-uiVoteList.");
      return;
    }

    list.innerHTML = players
      .map((player, index) => {
        return `
          <button class="vote-btn" type="button" data-vote="${index}">
            👤 ${escapeHTML(player)}
          </button>
        `;
      })
      .join("");

    safeSound(340, 0.14, "triangle");
    changeScreen("i-scr-vote");
  }

  function finishGame(index) {
    const votedPlayer = players[index];
    const votedRole = roles[index];

    const impostors = players.filter((player, playerIndex) => {
      return roles[playerIndex] === "impostor";
    });

    const title = $("i-txtResultTitle");
    const area = $("i-uiResultArea");

    if (!title || !area) {
      alert("No encontré el área de resultado.");
      return;
    }

    if (votedRole === "impostor") {
      title.textContent = "¡ATRAPARON AL IMPOSTOR! 🎉";
      title.style.color = "var(--success)";

      area.innerHTML = `
        <div class="emoji-display">😈</div>
        <h2 class="big-player-name" style="font-size:1.9rem;">${escapeHTML(votedPlayer)}</h2>
        <p class="muted strong-copy">Sí era impostor.</p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Palabra real</div>
          <div class="big-player-name" style="font-size:1.8rem;">
            ${escapeHTML(selectedCard.emoji)} ${escapeHTML(selectedCard.word)}
          </div>
          <p class="muted">Categoría: ${escapeHTML(selectedCard.category)}</p>
        </div>
        <div class="box panel-soft full-width">
          <div class="label-muted">Impostor(es)</div>
          <p class="muted strong-copy">${impostors.map(escapeHTML).join(" · ")}</p>
        </div>
      `;

      safeSound(520, 0.08, "square");
      setTimeout(() => safeSound(760, 0.12, "square"), 120);
    } else {
      title.textContent = "¡GANÓ EL IMPOSTOR! 😈";
      title.style.color = "var(--danger)";

      area.innerHTML = `
        <div class="emoji-display">🤡</div>
        <h2 class="big-player-name" style="font-size:1.9rem;">${escapeHTML(votedPlayer)}</h2>
        <p class="muted strong-copy">Era inocente.</p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Impostor(es)</div>
          <p class="muted strong-copy">${impostors.map(escapeHTML).join(" · ")}</p>
        </div>
        <div class="box panel-soft full-width">
          <div class="label-muted">Palabra real</div>
          <div class="big-player-name" style="font-size:1.8rem;">
            ${escapeHTML(selectedCard.emoji)} ${escapeHTML(selectedCard.word)}
          </div>
          <p class="muted">Categoría: ${escapeHTML(selectedCard.category)}</p>
        </div>
      `;

      safeSound(300, 0.25, "sawtooth");
    }

    changeScreen("i-scr-result");
  }

  function restartGame() {
    clearInterval(timerId);

    roles = [];
    selectedCard = null;
    currentIndex = 0;
    timerRunning = false;

    document.body.classList.remove("playing");
    changeScreen("i-scr-lobby");
  }

  function bindEvents() {
    const addBtn = $("i-btnAddPlayer");
    const clearBtn = $("i-btnClearPlayers");
    const startBtn = $("i-btnStartGame");
    const revealBtn = $("i-btnReveal");
    const hideBtn = $("i-btnHide");
    const pauseBtn = $("i-btnPause");
    const voteBtn = $("i-btnVoteNow");
    const restartBtn = $("i-btnRestart");
    const input = $("i-inpName");
    const playerList = $("i-uiPlayerList");
    const voteList = $("i-uiVoteList");

    if (addBtn) {
      addBtn.onclick = addPlayer;
    }

    if (clearBtn) {
      clearBtn.onclick = clearPlayers;
    }

    if (startBtn) {
      startBtn.onclick = startGame;
    }

    if (revealBtn) {
      revealBtn.onclick = revealRole;
    }

    if (hideBtn) {
      hideBtn.onclick = hideRole;
    }

    if (pauseBtn) {
      pauseBtn.onclick = toggleTimer;
    }

    if (voteBtn) {
      voteBtn.onclick = showVoteScreen;
    }

    if (restartBtn) {
      restartBtn.onclick = restartGame;
    }

    if (input) {
      input.onkeydown = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addPlayer();
        }
      };
    }

    if (playerList) {
      playerList.onclick = (event) => {
        const btn = event.target.closest("[data-remove]");

        if (!btn) {
          return;
        }

        const index = parseInt(btn.getAttribute("data-remove"), 10);
        removePlayer(index);
      };
    }

    if (voteList) {
      voteList.onclick = (event) => {
        const btn = event.target.closest("[data-vote]");

        if (!btn) {
          return;
        }

        const index = parseInt(btn.getAttribute("data-vote"), 10);
        finishGame(index);
      };
    }
  }

  function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    loadPlayers();
    loadUsedWords();
    renderPlayers();
    bindEvents();
    changeScreen("i-scr-lobby");

    console.log("ImpostorGame listo ✅");
  }

  return {
    init: init,
    addPlayer: addPlayer,
    removePlayer: removePlayer,
    clearPlayers: clearPlayers,
    startGame: startGame,
    revealRole: revealRole,
    hideRole: hideRole,
    toggleTimer: toggleTimer,
    showVoteScreen: showVoteScreen,
    finishGame: finishGame,
    restartGame: restartGame
  };
})();

window.ImpostorGame = ImpostorGame;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ImpostorGame.init();
  });
} else {
  ImpostorGame.init();
}