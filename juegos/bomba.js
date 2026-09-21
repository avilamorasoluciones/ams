const BombaGame = (() => {
  let pool = [];
  let bombTimer = null;
  let tickInterval = null;

  function $(id) { return document.getElementById(id); }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "b-scr-lobby");
  }

  function startGame() {
    const limit = $("b-selLimit").value;
    // Solución al bug de mezcla
    const shuffled = window.Utils.shuffleArray([...DB_BOMBA]);
    
    pool = limit === "all" ? shuffled : shuffled.slice(0, parseInt(limit));
    if (pool.length === 0) return alert("Error cargando palabras");
    
    nextRound();
  }

  function startTicks(totalTime) {
    let elapsed = 0;
    const bombEmoji = $("b-bombEmoji");
    
    tickInterval = setInterval(() => {
      elapsed += 500;
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
    $("b-bombEmoji").textContent = "💣";
    $("b-bombEmoji").style.transform = "scale(1)";
    
    const timeToBoom = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
    
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
    changeScreen("b-scr-lobby");
  }

  function init() {
    $("b-btnStart").onclick = startGame;
    $("b-btnSkip").onclick = skipWord;
    $("b-btnStop").onclick = stopGame;
    $("b-btnNext").onclick = nextRound;
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", BombaGame.init);