/* Duelo: dos modos, categorías y turnos guardados entre visitas. */
const Duelo = (() => {
  const $ = id => document.getElementById(id);
  const DB = window.AMS_NEW_GAMES_DB?.duelo?.questions || [];
  const ranges = [
    ["Cultura general", 0, 10],
    ["Colombia", 10, 15],
    ["Entretenimiento", 15, 25],
    ["Ciencia", 25, 30]
  ];
  const modes = [
    { id: "reaccion", name: "⚡ Reacción", desc: "Esperen la señal. El primero en pulsar gana el derecho a responder." },
    { id: "quiz", name: "🧠 Quiz", desc: "Cada ronda le toca a uno de los jugadores responder." }
  ];

  let mode = "reaccion";
  let names = ["Jugador 1", "Jugador 2"];
  let round = 1;
  let rounds = 10;
  let time = 12;
  let scores = [0, 0];
  let current = null;
  let currentCategory = "Todas";
  let questionDeck = [];
  let lastQuestionIndex = -1;
  let claimed = -1;
  let selectedAnswer = -1;
  let timer = null;
  let readyTimer = null;
  let timerEndsAt = 0;
  let readyAt = 0;
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
      && question[1].length >= 2
      && Number.isInteger(question[2])
      && question[2] >= 0
      && question[2] < question[1].length;
  }

  function candidateIndices() {
    return DB
      .map((question, index) => ({ question, index }))
      .filter(({ question, index }) => validQuestion(question)
        && (currentCategory === "Todas" || categoryOf(index) === currentCategory))
      .map(({ index }) => index);
  }

  function refillDeck() {
    questionDeck = shuffle(candidateIndices());
    if (questionDeck.length > 1 && questionDeck[questionDeck.length - 1] === lastQuestionIndex) {
      [questionDeck[0], questionDeck[questionDeck.length - 1]] =
        [questionDeck[questionDeck.length - 1], questionDeck[0]];
    }
  }

  function pick() {
    if (!questionDeck.length) refillDeck();
    const index = questionDeck.pop();
    const source = DB[index];
    if (!source) return null;

    const options = shuffle(source[1].map((text, sourceIndex) => ({ text, sourceIndex })));
    lastQuestionIndex = index;
    return {
      index,
      text: source[0],
      category: categoryOf(index),
      options: options.map(option => option.text),
      answer: options.findIndex(option => option.sourceIndex === source[2])
    };
  }

  function stopTimers() {
    clearInterval(timer);
    clearTimeout(readyTimer);
    timer = null;
    readyTimer = null;
  }

  function save() {
    if (currentScreen === "du-scr-lobby") {
      names = [
        $("du-p1")?.value.trim() || "Jugador 1",
        $("du-p2")?.value.trim() || "Jugador 2"
      ];
      rounds = Number($("du-rounds")?.value || rounds);
      time = Number($("du-time")?.value || time);
      currentCategory = $("du-cat")?.value || currentCategory;
    }
    window.GameSession?.save("duelo", {
      mode, names, round, rounds, time, scores, current, currentCategory, questionDeck,
      lastQuestionIndex, claimed, selectedAnswer, phase, history, timerEndsAt, readyAt,
      remainingMs, paused, screen: currentScreen
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
    const error = $("du-data-error");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  }

  function renderModes() {
    $("du-modes").innerHTML = modes.map(item =>
      '<button class="du-mode ' + (item.id === mode ? "selected" : "") +
      '" type="button" data-mode="' + item.id + '" aria-pressed="' + (item.id === mode) +
      '"><strong>' + item.name + '</strong><small>' + esc(item.desc) + "</small></button>"
    ).join("");
  }

  function renderCategories() {
    $("du-cat").innerHTML = '<option value="Todas">Todas</option>' +
      ranges.map(range => '<option value="' + esc(range[0]) + '">' + esc(range[0]) + "</option>").join("");
    $("du-cat").value = currentCategory;
  }

  function renderOptions() {
    const host = $("du-options");
    if (!current || (phase !== "answer" && phase !== "done") || paused) {
      host.innerHTML = "";
      return;
    }

    host.innerHTML = current.options.map((option, index) => {
      const isCorrect = phase === "done" && index === current.answer;
      const isSelected = index === selectedAnswer;
      const style = isCorrect ? "success" : (phase === "done" && isSelected ? "danger" :
        (isSelected ? "primary" : "ghost"));
      const disabled = phase === "done" ? " disabled" : "";
      const suffix = isCorrect ? " · Correcta" : (phase === "done" && isSelected ? " · Elegida" : "");
      return '<button class="btn ' + style + '" data-opt="' + index + '" type="button"' +
        disabled + ">" + esc(option) + suffix + "</button>";
    }).join("");
  }

  function render() {
    $("du-round-label").textContent = "Ronda " + round + " de " + rounds;
    $("du-cat-label").textContent = current?.category || "Categoría";
    $("du-name-a").textContent = names[0] || "Jugador 1";
    $("du-name-b").textContent = names[1] || "Jugador 2";
    $("du-score-a").textContent = scores[0] || 0;
    $("du-score-b").textContent = scores[1] || 0;
    $("du-claim-a").textContent = names[0] || "Jugador 1";
    $("du-claim-b").textContent = names[1] || "Jugador 2";
    $("du-question").textContent = current?.text || "";

    const claimVisible = mode === "reaccion" && phase === "claim" && !paused;
    $("du-claim").hidden = !claimVisible;
    $("du-card-a").classList.toggle("active", claimed === 0);
    $("du-card-b").classList.toggle("active", claimed === 1);

    if (paused) {
      $("du-status").textContent = "Partida pausada. Pulsa Continuar para retomar el turno.";
      $("du-count").textContent = "PAUSA";
    } else if (phase === "waiting") {
      $("du-status").textContent = "No pulsen todavía…";
      $("du-count").textContent = "…";
    } else if (phase === "claim") {
      $("du-status").textContent = "¡Listos! Pulsen su lado cuando estén preparados.";
      $("du-count").textContent = "¡YA!";
    } else if (phase === "answer" && mode === "quiz") {
      $("du-status").textContent = "Turno de " + names[claimed] + ". Elige una respuesta.";
      $("du-count").textContent = "";
    } else if (phase === "answer") {
      $("du-status").textContent = names[claimed] + " responde.";
      $("du-count").textContent = "";
    } else if (phase === "done") {
      const result = history[history.length - 1];
      $("du-status").textContent = result?.correct
        ? "✓ " + names[result.winner] + " acertó."
        : "✕ Nadie suma esta ronda. Respuesta: " + (current?.options[current?.answer] || "");
      $("du-count").textContent = "";
    } else {
      $("du-status").textContent = "";
      $("du-count").textContent = "";
    }

    $("du-pause").hidden = phase !== "answer";
    $("du-pause").textContent = paused ? "Continuar" : "Pausar";
    $("du-pause").setAttribute("aria-pressed", String(paused));
    $("du-pause-banner").hidden = !paused;
    $("du-timer").textContent = paused
      ? String(Math.ceil(remainingMs / 1000))
      : timerEndsAt && phase === "answer"
        ? String(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)))
        : "";
    $("du-next").hidden = phase !== "done";
    renderOptions();
  }

  function updateTimer() {
    if (paused || phase !== "answer") return;
    const left = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    $("du-timer").textContent = String(left);
    if (left <= 0) resolve(-1, false);
  }

  function startAnswerTimer(deadline = 0, remaining = 0) {
    clearInterval(timer);
    timer = null;
    if (paused || phase !== "answer") return;
    timerEndsAt = deadline || (Date.now() + (remaining || time * 1000));
    if (timerEndsAt <= Date.now()) {
      resolve(-1, false);
      return;
    }
    updateTimer();
    if (phase === "answer") timer = setInterval(updateTimer, 100);
  }

  function activateReady() {
    if (phase !== "waiting") return;
    readyAt = 0;
    phase = "claim";
    $("du-count").textContent = "¡YA!";
    window.emitSound?.(850, 0.16, "square");
    render();
    save();
  }

  function scheduleReady() {
    clearTimeout(readyTimer);
    if (phase !== "waiting") return;
    const wait = readyAt - Date.now();
    if (wait <= 0) {
      activateReady();
      return;
    }
    readyTimer = setTimeout(activateReady, wait);
  }

  function newRound() {
    stopTimers();
    paused = false;
    remainingMs = 0;
    timerEndsAt = 0;
    readyAt = 0;
    current = pick();
    if (!current) {
      showError("No hay preguntas válidas para esta categoría. Elige otra e inténtalo de nuevo.");
      showScreen("du-scr-lobby");
      return;
    }
    selectedAnswer = -1;
    if (mode === "reaccion") {
      claimed = -1;
      phase = "waiting";
      readyAt = Date.now() + 1100 + Math.random() * 2200;
    } else {
      claimed = (round - 1) % 2;
      phase = "answer";
      timerEndsAt = Date.now() + time * 1000;
    }

    showError("");
    render();
    showScreen("du-scr-game");
    if (phase === "waiting") scheduleReady();
    else startAnswerTimer(timerEndsAt);
  }

  function startGame() {
    window.emitSound?.(440, 0.03, "sine", 0.035);
    names = [
      $("du-p1").value.trim() || "Jugador 1",
      $("du-p2").value.trim() || "Jugador 2"
    ];
    rounds = Number($("du-rounds").value);
    time = Number($("du-time").value);
    currentCategory = $("du-cat").value || "Todas";
    if (!candidateIndices().length) {
      showError("No hay preguntas válidas en esta categoría. Elige otra categoría.");
      return;
    }
    showError("");
    scores = [0, 0];
    round = 1;
    history = [];
    questionDeck = [];
    lastQuestionIndex = -1;
    newRound();
  }

  function claim(player) {
    if (phase !== "claim" || mode !== "reaccion" || claimed >= 0) return;
    claimed = player;
    selectedAnswer = -1;
    phase = "answer";
    remainingMs = time * 1000;
    timerEndsAt = Date.now() + remainingMs;
    window.emitSound?.(600, 0.1, "triangle");
    render();
    startAnswerTimer(timerEndsAt);
    save();
  }

  function answer(index) {
    if (phase !== "answer" || paused || !current || index < 0 || index >= current.options.length) return;
    selectedAnswer = index;
    resolve(index === current.answer ? claimed : -1, index === current.answer);
  }

  function resolve(winner, correct) {
    if (phase !== "answer") return;
    stopTimers();
    paused = false;
    remainingMs = 0;
    timerEndsAt = 0;
    readyAt = 0;
    if (winner >= 0 && correct) scores[winner] += 1;
    history.push({
      round,
      question: current.text,
      category: current.category,
      winner,
      correct,
      answer: current.options[current.answer],
      selected: selectedAnswer >= 0 ? current.options[selectedAnswer] : ""
    });
    phase = "done";
    window.emitSound?.(correct ? 720 : 220, 0.1, correct ? "triangle" : "sawtooth");
    render();
    save();
  }

  function advance() {
    if (phase !== "done") return;
    if (round >= rounds) {
      finish();
      return;
    }
    round += 1;
    newRound();
  }

  function finish() {
    stopTimers();
    paused = false;
    remainingMs = 0;
    if (!names.length) return;
    const winner = scores[0] === scores[1] ? "Empate" : names[scores[0] > scores[1] ? 0 : 1];
    $("du-result-body").innerHTML =
      '<div class="bp-verdict"><strong>' + (winner === "Empate" ? "¡Empate!" : "¡Ganó " + esc(winner) + "!") +
      '</strong><p class="muted">' + scores[0] + " a " + scores[1] + " · " + history.length + " rondas jugadas de " + rounds + '.</p></div>' +
      '<div class="du-result-row"><span>' + esc(names[0]) + "</span><strong>" + scores[0] + " pts</strong></div>" +
      '<div class="du-result-row"><span>' + esc(names[1]) + "</span><strong>" + scores[1] + " pts</strong></div>" +
      '<div class="du-history"><strong>Historia del duelo</strong>' +
      (history.length ? history.map(item =>
        '<div>R' + item.round + " · " + esc(item.winner >= 0 ? names[item.winner] : "Nadie") +
        " · " + (item.correct ? "Acertó" : "No sumó") + " · respuesta: " + esc(item.answer) +
        '<br><small>' + esc(item.question) + "</small></div>").join("")
        : '<p class="muted">No hubo rondas registradas.</p>') + "</div>";
    phase = "done";
    showScreen("du-scr-result");
  }

  function syncConfig() {
    $("du-p1").value = names[0] || "Jugador 1";
    $("du-p2").value = names[1] || "Jugador 2";
    $("du-rounds").value = String(rounds);
    $("du-time").value = String(time);
    $("du-cat").value = currentCategory;
    renderModes();
    renderCategories();
  }

  function togglePause() {
    if (phase !== "answer") return;
    if (!paused) {
      remainingMs = Math.max(0, timerEndsAt - Date.now());
      clearInterval(timer);
      timer = null;
      paused = true;
      render();
      save();
      return;
    }
    paused = false;
    if (remainingMs <= 0) {
      resolve(-1, false);
      return;
    }
    timerEndsAt = Date.now() + remainingMs;
    startAnswerTimer(timerEndsAt);
    render();
    save();
  }

  function newGame() {
    stopTimers();
    window.GameSession?.clear("duelo");
    round = 1;
    scores = [0, 0];
    history = [];
    current = null;
    currentScreen = "du-scr-lobby";
    phase = "idle";
    claimed = -1;
    selectedAnswer = -1;
    paused = false;
    questionDeck = [];
    renderModes();
    showError("");
    render();
    showScreen("du-scr-lobby");
  }

  function normalizeQuestion(question) {
    if (Array.isArray(question)) {
      const index = DB.findIndex(item => item[0] === question[0]);
      const options = [...(question[1] || [])];
      return { index, text: question[0], category: categoryOf(index), options, answer: Number(question[2] || 0) };
    }
    if (question && typeof question.text === "string" && Array.isArray(question.options)) return question;
    return null;
  }

  function restore(state) {
    if (!state?.names?.length) return false;
    mode = state.mode === "quiz" ? "quiz" : "reaccion";
    names = [String(state.names[0] || "Jugador 1"), String(state.names[1] || "Jugador 2")];
    round = Math.max(1, Number(state.round || 1));
    rounds = Number(state.rounds || 10);
    time = Number(state.time || 12);
    scores = Array.isArray(state.scores) && state.scores.length === 2 ? state.scores : [0, 0];
    current = normalizeQuestion(state.current);
    currentCategory = state.currentCategory === "Todas" || ranges.some(range => range[0] === state.currentCategory) ? state.currentCategory : "Todas";
    questionDeck = Array.isArray(state.questionDeck) ? state.questionDeck.filter(index => Number.isInteger(index) && validQuestion(DB[index]) && (currentCategory === "Todas" || categoryOf(index) === currentCategory)) : [];
    lastQuestionIndex = Number.isInteger(state.lastQuestionIndex) ? state.lastQuestionIndex : current?.index ?? -1;
    claimed = Number.isInteger(state.claimed) ? state.claimed : -1;
    selectedAnswer = Number.isInteger(state.selectedAnswer) ? state.selectedAnswer : -1;
    phase = state.phase || "idle";
    history = Array.isArray(state.history) ? state.history : [];
    timerEndsAt = Number(state.timerEndsAt || 0);
    readyAt = Number(state.readyAt || 0);
    remainingMs = Number(state.remainingMs || 0);
    paused = Boolean(state.paused);
    currentScreen = state.screen || "du-scr-lobby";

    syncConfig();
    if (currentScreen === "du-scr-game" && current) {
      showScreen("du-scr-game");
      render();
      if (phase === "waiting") scheduleReady();
      else if (phase === "answer" && !paused) startAnswerTimer(timerEndsAt, remainingMs);
    } else if (currentScreen === "du-scr-result") {
      finish();
    } else {
      showScreen("du-scr-lobby");
    }
    return true;
  }

  function openEndConfirm() {
    $("du-end-confirm").classList.add("active");
    $("du-end-cancel").focus();
  }

  function closeEndConfirm() {
    $("du-end-confirm").classList.remove("active");
    $("du-end").focus();
  }

  function bind() {
    renderModes();
    renderCategories();
    $("du-modes").onclick = event => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;
      mode = button.dataset.mode;
      renderModes();
      save();
    };
    $("du-cat").onchange = event => {
      currentCategory = event.target.value;
      questionDeck = [];
      save();
    };
    ["du-p1", "du-p2", "du-rounds", "du-time"].forEach(id => $(id).oninput = save);
    ["du-rounds", "du-time"].forEach(id => $(id).onchange = save);
    $("du-start").onclick = startGame;
    $("du-claim-a").onclick = () => claim(0);
    $("du-claim-b").onclick = () => claim(1);
    $("du-options").onclick = event => {
      const button = event.target.closest("[data-opt]");
      if (button) answer(Number(button.dataset.opt));
    };
    $("du-pause").onclick = togglePause;
    $("du-next").onclick = advance;
    $("du-end").onclick = openEndConfirm;
    $("du-end-cancel").onclick = closeEndConfirm;
    $("du-end-confirm-submit").onclick = () => { closeEndConfirm(); finish(); };
    window.addEventListener("keydown", event => {
      if (event.key === "Escape" && $("du-end-confirm").classList.contains("active")) closeEndConfirm();
    });
    $("du-new").onclick = newGame;
  }

  function init() {
    bind();
    window.GameSession?.register(save);
    const saved = window.GameSession?.load?.("duelo");
    if (!restore(saved)) showScreen("du-scr-lobby");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  return { startGame, finish };
})();
