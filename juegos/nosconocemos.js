const NosConocemosGame = (() => {
  const STORAGE_KEY = "avila_mora_players"; // Llave compartida
  let players = [];
  let pool = [];
  let currentMainIndex = 0;
  let currentQuestion = null;
  let mainAnswer = "";
  
  let guesserQueue = [];
  let currentGuesser = "";
  let guesses = {}; 

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

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "nc-scr-lobby");
  }

  function renderPlayers() {
    const list = $("nc-uiPlayerList");
    if (players.length === 0) {
      list.innerHTML = '<div class="muted center full-width">Agrega mínimo 3 jugadores.</div>';
      return;
    }
    list.innerHTML = players.map((p, i) => `
      <div class="player-tag">👤 ${window.Utils.escapeHTML(p)} <button type="button" class="delete-btn" data-remove="${i}" aria-label="Eliminar ${window.Utils.escapeHTML(p)}">×</button></div>
    `).join("");
  }

  function addPlayer() {
    const name = $("nc-inpName").value.trim().toUpperCase();
    if (!name || players.includes(name)) return;
    players.push(name);
    $("nc-inpName").value = "";
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
    if (players.length < 3) return alert("Se necesitan al menos 3 jugadores.");
    
    const limit = $("nc-selLimit").value;
    const shuffled = window.Utils.shuffleArray([...DB_NOS_CONOCEMOS]);
    pool = limit === "all" ? shuffled : shuffled.slice(0, parseInt(limit));
    
    if(pool.length === 0) return;
    currentMainIndex = 0;
    startTurn();
  }

  function startTurn() {
    if (pool.length === 0) {
      alert("¡Se acabaron las preguntas!");
      changeScreen("nc-scr-lobby");
      return;
    }
    
    currentQuestion = pool.pop();
    guesses = {};
    const mainPlayer = players[currentMainIndex];
    
    $("nc-txtMainPlayer").textContent = mainPlayer;
    $("nc-txtQuestionMain").textContent = currentQuestion.q;
    
    guesserQueue = players.filter((_, i) => i !== currentMainIndex);
    changeScreen("nc-scr-pass-main");
  }

  function showMainSecret() {
    const optsContainer = $("nc-uiOptionsMain");
    optsContainer.innerHTML = "";
    
    currentQuestion.opts.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.onclick = () => saveMainAnswer(opt);
      optsContainer.appendChild(btn);
    });
    
    window.emitSound(800, 0.08, "triangle");
    changeScreen("nc-scr-secret");
  }

  function saveMainAnswer(opt) {
    mainAnswer = opt;
    window.emitSound(600, 0.1, "triangle");
    nextGuesser();
  }

  function nextGuesser() {
    if (guesserQueue.length === 0) {
      showResults();
      return;
    }
    
    currentGuesser = guesserQueue.shift();
    $("nc-txtGuesser").textContent = currentGuesser;
    changeScreen("nc-scr-pass-guess");
  }

  function showGuessOptions() {
    $("nc-guessSubtitle").textContent = `¿Qué crees que eligió ${players[currentMainIndex]}?`;
    $("nc-txtQuestionGuess").textContent = currentQuestion.q;
    
    const optsContainer = $("nc-uiOptionsGuess");
    optsContainer.innerHTML = "";
    
    currentQuestion.opts.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.onclick = () => saveGuess(opt);
      optsContainer.appendChild(btn);
    });

    window.emitSound(800, 0.08, "triangle");
    changeScreen("nc-scr-guess");
  }

  function saveGuess(opt) {
    guesses[currentGuesser] = opt;
    window.emitSound(600, 0.1, "triangle");
    nextGuesser();
  }

  function showResults() {
    $("nc-resName").textContent = players[currentMainIndex];
    $("nc-txtAnswer").textContent = mainAnswer;
    
    const resultsContainer = $("nc-uiGuessResults");
    resultsContainer.innerHTML = "";
    
    for (const [name, guess] of Object.entries(guesses)) {
      const isCorrect = guess === mainAnswer;
      resultsContainer.innerHTML += `
        <div class="res-item ${isCorrect ? 'correct' : 'incorrect'}">
          <span>${window.Utils.escapeHTML(name)}</span>
          <span>${isCorrect ? '✔️ Acertó' : '❌ Falló'}</span>
        </div>
      `;
    }
    
    window.emitSound(1000, 0.3, "triangle");
    changeScreen("nc-scr-result");
  }

  function init() {
    loadPlayers(); // Cargar globales
    $("nc-btnAddPlayer").onclick = addPlayer;
    $("nc-btnClearPlayers").onclick = clearPlayers;
    $("nc-inpName").onkeydown = (e) => { if (e.key === "Enter") addPlayer(); };
    
    $("nc-uiPlayerList").onclick = (e) => {
      if (e.target.closest("[data-remove]")) {
        players.splice(e.target.dataset.remove, 1);
        savePlayers();
        renderPlayers();
      }
    };

    $("nc-btnStart").onclick = startGame;
    $("nc-btnSeeOptions").onclick = showMainSecret;
    $("nc-btnSeeGuess").onclick = showGuessOptions;
    
    $("nc-btnNextTurn").onclick = () => {
      currentMainIndex = (currentMainIndex + 1) % players.length;
      startTurn();
    };
    
    const endFn = () => changeScreen("nc-scr-lobby");
    $("nc-btnEnd").onclick = endFn;
    $("nc-btnEndSecret").onclick = endFn;
    
    renderPlayers();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", NosConocemosGame.init);