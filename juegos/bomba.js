const BombaGame = (() => {
  let pool = [];
  let bombTimer = null;
  let tickInterval = null;
  let roundEndsAt = 0;
  let timeRemaining = 0;
  let roundTotalTime = 0;
  let halfWarningPlayed = false;

  function saveSession(screen = document.querySelector(".im-screen.active")?.id || "b-scr-lobby") {
    window.GameSession?.save("bomba", { pool, word: $("b-txtWord")?.textContent || "", screen, timeRemaining, roundEndsAt, roundTotalTime, halfWarningPlayed });
  }

  function $(id) { return document.getElementById(id); }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "b-scr-lobby");
    saveSession(id);
  }

  function startGame() {
    // Solución al bug de mezcla
    const shuffled = window.Utils.shuffleArray([...DB_BOMBA]);
    
    pool = shuffled;
    if (pool.length === 0) return alert("Error cargando palabras");
    
    nextRound();
  }

  function playHalfwayWarning() {
    if (halfWarningPlayed) return;
    halfWarningPlayed = true;

    // Sirena de alerta: dos tonos alternados que suben y bajan rápidamente.
    const sirenSteps = [
      [700, 0.16], [1050, 0.16], [700, 0.16], [1050, 0.16],
      [700, 0.16], [1050, 0.16], [700, 0.16], [1050, 0.16]
    ];

    sirenSteps.forEach(([frequency, duration], index) => {
      setTimeout(() => window.emitSound(frequency, duration, "sawtooth", 0.65), index * 180);
    });

    saveSession("b-scr-game");
  }

  function startTicks(totalTime) {
    const bombEmoji = $("b-bombEmoji");
    
    tickInterval = setInterval(() => {
      const remaining = Math.max(0, roundEndsAt - Date.now());
      timeRemaining = remaining;
      const elapsed = Math.max(0, totalTime - remaining);

      if (!halfWarningPlayed && roundTotalTime > 0 && remaining <= roundTotalTime / 2) {
        playHalfwayWarning();
      }

      if (remaining <= 0) {
        clearInterval(tickInterval);
        tickInterval = null;
        clearTimeout(bombTimer);
        timeRemaining = 0;
        explode();
        return;
      }

      saveSession("b-scr-game");
      const progress = Math.min(1, elapsed / totalTime);
      const freq = 400 + progress * 500;
      window.emitSound(freq, 0.05, "square", 0.3);
      
      bombEmoji.style.transform = Math.floor(elapsed / 1000) % 2 === 0 ? "scale(1.15)" : "scale(1)";
    }, 500);
  }

  function nextRound() {
    if (pool.length === 0) {
      alert("¡Se acabaron las categorías! Volviendo al menú.");
      stopGame();
      return;
    }

    $("b-txtWord").textContent = pool.pop();
    $("b-bombEmoji").innerHTML = window.uiIcon("bomb");
    $("b-bombEmoji").style.transform = "scale(1)";
    const possibleTimes = [30, 60, 120, 180];
    const timeToBoom = possibleTimes[Math.floor(Math.random() * possibleTimes.length)] * 1000;
    timeRemaining = timeToBoom;
    roundTotalTime = timeToBoom;
    halfWarningPlayed = false;
    roundEndsAt = Date.now() + timeToBoom;
    
    clearTimeout(bombTimer);
    clearInterval(tickInterval);
    
    startTicks(timeToBoom);
    bombTimer = setTimeout(explode, timeToBoom);
    saveSession("b-scr-game");
    
    changeScreen("b-scr-game");
  }

  function skipWord() {
    if (pool.length > 0) {
      $("b-txtWord").textContent = pool.pop();
      saveSession("b-scr-game");
      window.emitSound(600, 0.1, "triangle");
    } else {
      alert("¡No hay más categorías!");
    }
  }

  function explode() {
    clearInterval(tickInterval);
    window.emitSound(150, 0.5, "sawtooth", 0.8);
    setTimeout(() => window.emitSound(100, 0.8, "sawtooth", 1), 100);
    changeScreen("b-scr-boom");
  }

  function stopGame() {
    clearTimeout(bombTimer);
    clearInterval(tickInterval);
    window.GameSession?.clear("bomba");
    changeScreen("b-scr-lobby");
  }

  function restoreSession(saved) {
    if (!saved || !saved.screen || saved.screen === "b-scr-lobby" || !saved.word) return false;
    pool = Array.isArray(saved.pool) ? saved.pool : [];
    $("b-txtWord").textContent = saved.word;
    if (saved.screen === "b-scr-boom") {
      changeScreen("b-scr-boom");
      return true;
    }
    roundTotalTime = Number(saved.roundTotalTime || 0);
    halfWarningPlayed = Boolean(saved.halfWarningPlayed);
    const savedEndsAt = Number(saved.roundEndsAt || 0);
    const savedAt = Number(saved.savedAt || Date.now());
    const fallbackRemaining = Math.max(0, Number(saved.timeRemaining || 0) - Math.max(0, Date.now() - savedAt));
    const remaining = savedEndsAt > 0
      ? Math.max(0, savedEndsAt - Date.now())
      : fallbackRemaining;
    timeRemaining = remaining;
    roundEndsAt = Date.now() + remaining;
    changeScreen("b-scr-game");
    if (remaining > 0) {
      clearTimeout(bombTimer);
      clearInterval(tickInterval);
      startTicks(roundTotalTime > 0 ? roundTotalTime : Math.max(remaining, 1000));
      bombTimer = setTimeout(explode, remaining);
    } else {
      explode();
    }
    return true;
  }

  function init() {
    $("b-btnStart").onclick = startGame;
    $("b-btnSkip").onclick = skipWord;
    $("b-btnStop").onclick = stopGame;
    $("b-btnNext").onclick = nextRound;
    window.GameSession?.register(saveSession);
    if (!restoreSession(window.GameSession?.load("bomba"))) changeScreen("b-scr-lobby");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", BombaGame.init);