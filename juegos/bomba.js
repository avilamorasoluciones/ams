const BombaGame = (() => {
  let pool = [];
  let bombTimer = null;
  let tickInterval = null;
  let roundEndsAt = 0;
  let timeRemaining = 0;

  function saveSession(screen = document.querySelector(".im-screen.active")?.id || "b-scr-lobby") {
    window.GameSession?.save("bomba", { pool, word: $("b-txtWord")?.textContent || "", screen, timeRemaining, roundEndsAt });
  }

  function $(id) { return document.getElementById(id); }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "b-scr-lobby");
    saveSession(id);
  }

  function startGame() {
    const limit = $("b-selLimit").value;
    // Solución al bug de mezcla
    const shuffled = window.Utils.shuffleArray([...DB_BOMBA]);
    
    pool = limit === "all" ? shuffled : shuffled.slice(0, parseInt(limit));
    if (pool.length === 0) return alert("Error cargando palabras");
    
    nextRound();
  }

  function startTicks(totalTime, initialElapsed = 0) {
    let elapsed = initialElapsed;
    const bombEmoji = $("b-bombEmoji");
    
    tickInterval = setInterval(() => {
      elapsed += 500;
      timeRemaining = Math.max(0, totalTime - elapsed);
      saveSession("b-scr-game");
      let freq = 400 + (elapsed / totalTime) * 500;
      window.emitSound(freq, 0.05, "square", 0.3);
      
      bombEmoji.style.transform = elapsed % 1000 === 0 ? "scale(1.15)" : "scale(1)";
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
    saveSession("b-scr-game");
    
    const timeToBoom = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
    timeRemaining = timeToBoom;
    roundEndsAt = Date.now() + timeToBoom;
    
    clearTimeout(bombTimer);
    clearInterval(tickInterval);
    
    startTicks(timeToBoom);
    bombTimer = setTimeout(explode, timeToBoom);
    
    changeScreen("b-scr-game");
  }

  function skipWord() {
    if (pool.length > 0) {
      $("b-txtWord").textContent = pool.pop();
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
    const remaining = Math.max(0, Number(saved.timeRemaining || 0) - Math.floor((Date.now() - Number(saved.savedAt || Date.now())) / 1000) * 1000);
    timeRemaining = remaining;
    roundEndsAt = Date.now() + remaining;
    changeScreen("b-scr-game");
    if (remaining > 0) {
      clearTimeout(bombTimer);
      clearInterval(tickInterval);
      startTicks(Math.max(remaining, 1000), 0);
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
    if (!restoreSession(window.GameSession?.load("bomba"))) changeScreen("b-scr-lobby");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", BombaGame.init);