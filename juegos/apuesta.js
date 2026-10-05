/* Apuesta: trivia por turnos con riesgo y fichas. */
const Apuesta = (() => {
  const $ = id => document.getElementById(id);
  const DB = window.AMS_NEW_GAMES_DB?.apuesta?.questions || [];
  const ranges = [
    ["Colombia", 0, 7],
    ["Mundo", 7, 14],
    ["Ciencia", 14, 21],
    ["Entretenimiento", 21, 29],
    ["Cultura general", 29, 39]
  ];

  let names = [];
  let coins = [];
  let round = 1;
  let rounds = 10;
  let startCoins = 20;
  let active = 0;
  let current = null;
  let bet = 0;
  let choice = -1;
  let phase = "idle";
  let history = [];
  let category = "Todas";
  let questionDeck = [];
  let lastQuestionIndex = -1;
  let currentScreen = "ap-scr-lobby";

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
        && (category === "Todas" || categoryOf(index) === category))
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
      options: options.map(option => option.text),
      answer: options.findIndex(option => option.sourceIndex === source[2])
    };
  }

  function save() {
    if (currentScreen === "ap-scr-lobby") {
      const count = Number($("ap-count")?.value || 4);
      const draft = Array.from({ length: count }, (_, index) =>
        $("ap-name-" + index)?.value.trim() || "Jugador " + (index + 1));
      if (draft.length) names = draft;
      startCoins = Number($("ap-start-coins")?.value || startCoins);
      rounds = Number($("ap-rounds")?.value || rounds);
      category = $("ap-cat")?.value || category;
    }
    window.GameSession?.save("apuesta", {
      names, coins, round, rounds, startCoins, active, current, bet, choice, phase,
      history, category, questionDeck, lastQuestionIndex, screen: currentScreen
    });
  }

  function showScreen(id) {
    currentScreen = id;
    ["ap-scr-lobby", "ap-scr-game", "ap-scr-result"].forEach(screenId => {
      $(screenId).hidden = screenId !== id;
    });
    save();
  }

  function showError(message) {
    const error = $("ap-data-error");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  }

  function renderCategories() {
    $("ap-cat").innerHTML = '<option value="Todas">Todas</option>' +
      ranges.map(range => '<option value="' + esc(range[0]) + '">' + esc(range[0]) + '</option>').join("");
    $("ap-cat").value = category;
  }

  function renderInputs() {
    const count = Number($("ap-count").value);
    $("ap-player-inputs").innerHTML = Array.from({ length: count }, (_, index) => {
      const name = names[index] || "Jugador " + (index + 1);
      return '<label class="ap-player-input"><span class="ap-token">' + (index + 1) +
        '</span><input id="ap-name-' + index + '" maxlength="20" value="' + esc(name) +
        '" placeholder="Nombre del jugador" autocomplete="off"></label>';
    }).join("");
  }

  function renderBank() {
    $("ap-bank").innerHTML = names.map((name, index) =>
      '<span class="badge ' + (index === active ? "badge-indigo" : "") + '">' +
      esc(name) + ": " + (coins[index] ?? 0) + " 🪙</span>"
    ).join(" ");
  }

  function renderOptions() {
    const host = $("ap-options");
    if (!current) {
      host.innerHTML = "";
      return;
    }
    const showOptions = phase === "choose" || phase === "bet" || phase === "result";
    if (!showOptions) {
      host.innerHTML = "";
      return;
    }

    host.innerHTML = current.options.map((option, index) => {
      const isCorrect = phase === "result" && index === current.answer;
      const isSelected = index === choice;
      const style = isCorrect ? "success" : (phase === "result" && isSelected ? "danger" :
        (isSelected ? "primary" : "ghost"));
      const disabled = phase !== "choose" ? " disabled" : "";
      const label = esc(option) + (isCorrect ? " · Correcta" : (phase === "result" && isSelected ? " · Tu respuesta" : ""));
      return '<button class="btn ' + style + '" data-opt="' + index + '" type="button"' + disabled + '>' + label + '</button>';
    }).join("");
  }

  function renderBets() {
    const host = $("ap-bet-grid");
    const balance = Math.max(0, Number(coins[active] || 0));
    const amounts = [0];
    for (let amount = 1; amount <= Math.min(5, balance); amount++) amounts.push(amount);
    if (balance > 5) amounts.push(balance);

    host.innerHTML = amounts.map(amount => {
      let label = amount === 0 ? "Sin apostar" : amount === balance && balance > 5
        ? "Todo · " + amount + " 🪙"
        : amount + " 🪙";
      return '<button class="btn ' + (amount === 0 ? "ghost" : "primary") +
        '" data-bet="' + amount + '" type="button">' + label + '</button>';
    }).join("");
  }

  function render() {
    const question = current;
    $("ap-round-label").textContent = "Ronda " + round + " de " + rounds;
    $("ap-turn-label").textContent = "Turno: " + (names[active] || "");
    renderBank();

    if (phase === "choose") {
      $("ap-status").textContent = (names[active] || "Jugador") + ", elige una respuesta.";
    } else if (phase === "bet") {
      $("ap-status").textContent = "Elegiste: " + (question?.options[choice] || "") +
        ". Ahora decide cuántas fichas arriesgar.";
    } else if (phase === "result") {
      const correct = choice === question?.answer;
      const correctAnswer = question?.options[question.answer] || "";
      if (bet === 0) {
        $("ap-status").textContent = (correct ? "✓ Acertaste. " : "✕ La respuesta era ") +
          correctAnswer + ". No apostaste fichas.";
      } else {
        $("ap-status").textContent = correct
          ? "✓ ¡Acertaste! La respuesta era " + correctAnswer + ". Ganas " + bet + " fichas."
          : "✕ La respuesta era " + correctAnswer + ". Pierdes " + bet + " fichas.";
      }
    } else {
      $("ap-status").textContent = "";
    }

    $("ap-question").textContent = question?.text || "";
    renderOptions();
    $("ap-bet").hidden = phase !== "bet";
    if (phase === "bet") renderBets();
    $("ap-wait").hidden = phase !== "result";
    $("ap-wait").textContent = phase === "result"
      ? "Turno terminado. Pasen el celular a " + (names[(active + 1) % Math.max(1, names.length)] || "la siguiente persona") + "."
      : "";
    $("ap-next").hidden = phase !== "result";
  }

  function startGame() {
    category = $("ap-cat").value || "Todas";
    if (!candidateIndices().length) {
      showError("No hay preguntas disponibles en esta categoría. Elige otra categoría.");
      return;
    }
    showError("");
    const count = Number($("ap-count").value);
    names = Array.from({ length: count }, (_, index) =>
      $("ap-name-" + index)?.value.trim() || "Jugador " + (index + 1));
    startCoins = Number($("ap-start-coins").value);
    rounds = Number($("ap-rounds").value);
    coins = Array(count).fill(startCoins);
    round = 1;
    active = 0;
    history = [];
    questionDeck = [];
    lastQuestionIndex = -1;
    newTurn();
    showScreen("ap-scr-game");
  }

  function newTurn() {
    current = pick();
    if (!current) {
      showError("No se encontró una pregunta válida. Cambia la categoría e inténtalo de nuevo.");
      return false;
    }
    bet = 0;
    choice = -1;
    phase = "choose";
    render();
    save();
    return true;
  }

  function choose(index) {
    if (phase !== "choose" || !current || index < 0 || index >= current.options.length) return;
    choice = index;
    phase = "bet";
    render();
    save();
  }

  function wager(amount) {
    if (phase !== "bet" || !current || !Number.isInteger(amount) || amount < 0 || amount > coins[active]) return;
    bet = amount;
    const correct = choice === current.answer;
    const delta = correct ? amount : -amount;
    coins[active] += delta;
    history.push({
      round, player: active, question: current.text,
      choice: current.options[choice], answer: current.options[current.answer],
      correct, bet: amount, delta
    });
    phase = "result";
    window.emitSound?.(correct ? 760 : 220, correct ? 0.1 : 0.12, correct ? "triangle" : "sawtooth");
    render();
    save();
  }

  function next() {
    if (phase !== "result") return;
    const lastPlayer = active === names.length - 1;
    if (lastPlayer && round >= rounds) {
      finish();
      return;
    }
    active = (active + 1) % names.length;
    if (active === 0) round += 1;
    if (newTurn()) save();
  }

  function finish() {
    if (!names.length) return;
    const order = names.map((name, index) => ({ name, coins: Number(coins[index] || 0), index }))
      .sort((a, b) => b.coins - a.coins);
    const tied = order.length > 1 && order[0].coins === order[1].coins;
    $("ap-result-body").innerHTML =
      '<div class="bp-verdict"><strong>' + (tied ? "¡Empate!" : "¡Ganó " + esc(order[0].name) + "!") +
      '</strong><p class="muted">Cada jugador empezó con ' + startCoins + " fichas. Turnos jugados: " + history.length + " de " + (rounds * names.length) + '.</p></div>' +
      '<div class="ap-rank">' + order.map((player, index) =>
        '<div class="ap-rank-row"><span>#' + (index + 1) + " · " + esc(player.name) +
        '</span><strong>' + player.coins + " 🪙</strong></div>").join("") + '</div>' +
      '<div class="ap-history"><strong>Resumen de apuestas</strong>' +
      (history.length ? history.slice(-16).map(item =>
        '<div>R' + item.round + " · " + esc(names[item.player]) + " apostó " + item.bet +
        " 🪙 · " + (item.correct ? "acertó" : "falló") + " · respuesta: " + esc(item.answer) +
        '<br><small>' + esc(item.question) + '</small></div>').join("")
        : '<p class="muted">No hubo turnos registrados.</p>') + '</div>';
    showScreen("ap-scr-result");
  }

  function syncConfig() {
    $("ap-count").value = String(names.length || 4);
    $("ap-start-coins").value = String(startCoins);
    $("ap-rounds").value = String(rounds);
    $("ap-cat").value = category;
    renderInputs();
  }

  function newGame() {
    window.GameSession?.clear("apuesta");
    currentScreen = "ap-scr-lobby";
    phase = "idle";
    active = 0;
    renderInputs();
    showError("");
    showScreen("ap-scr-lobby");
  }

  function normalizeQuestion(question) {
    if (Array.isArray(question)) {
      const index = DB.findIndex(item => item[0] === question[0]);
      return {
        index,
        text: question[0],
        options: [...(question[1] || [])],
        answer: Number(question[2] || 0)
      };
    }
    if (question && typeof question.text === "string" && Array.isArray(question.options)) return question;
    return null;
  }

  function restore(state) {
    if (!state?.names?.length) return false;
    names = state.names.map(name => String(name || ""));
    coins = Array.isArray(state.coins) ? state.coins : Array(names.length).fill(20);
    if (coins.length !== names.length) coins = Array(names.length).fill(20);
    round = Math.max(1, Number(state.round || 1));
    rounds = Number(state.rounds || 10);
    startCoins = Number(state.startCoins || 20);
    active = Math.max(0, Math.min(names.length - 1, Number(state.active || 0)));
    current = normalizeQuestion(state.current);
    bet = Number(state.bet || 0);
    choice = Number.isInteger(state.choice) ? state.choice : -1;
    phase = state.phase || "choose";
    history = Array.isArray(state.history) ? state.history : [];
    category = ranges.some(range => range[0] === state.category) || state.category === "Todas" ? state.category : "Todas";
    questionDeck = Array.isArray(state.questionDeck) ? state.questionDeck.filter(index => Number.isInteger(index) && validQuestion(DB[index]) && (category === "Todas" || categoryOf(index) === category)) : [];
    lastQuestionIndex = Number.isInteger(state.lastQuestionIndex) ? state.lastQuestionIndex : current?.index ?? -1;
    currentScreen = state.screen || "ap-scr-lobby";

    renderCategories();
    syncConfig();
    if (currentScreen === "ap-scr-game" && current) {
      showScreen("ap-scr-game");
      render();
    } else if (currentScreen === "ap-scr-result") {
      finish();
    } else {
      showScreen("ap-scr-lobby");
    }
    return true;
  }

  function bind() {
    renderCategories();
    renderInputs();
    $("ap-count").onchange = () => { renderInputs(); save(); };
    $("ap-player-inputs").oninput = save;
    $("ap-start-coins").onchange = save;
    $("ap-rounds").onchange = save;
    $("ap-cat").onchange = event => {
      category = event.target.value;
      questionDeck = [];
      save();
    };
    $("ap-start").onclick = startGame;
    $("ap-options").onclick = event => {
      const button = event.target.closest("[data-opt]");
      if (button) choose(Number(button.dataset.opt));
    };
    $("ap-bet-grid").onclick = event => {
      const button = event.target.closest("[data-bet]");
      if (button) wager(Number(button.dataset.bet));
    };
    $("ap-next").onclick = next;
    $("ap-end").onclick = () => {
      if (window.confirm("¿Terminar la partida y ver el resultado?")) finish();
    };
    $("ap-new").onclick = newGame;
    $("ap-result-menu").onclick = () => save();
    $("ap-lobby-menu").onclick = () => save();
  }

  function init() {
    bind();
    window.GameSession?.register(save);
    const saved = window.GameSession?.load?.("apuesta");
    if (!restore(saved)) showScreen("ap-scr-lobby");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  return { startGame, finish };
})();
