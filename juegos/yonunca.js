const YoNuncaGame = (() => {
  let pool = [];

  function $(id) { return document.getElementById(id); }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "yn-scr-lobby");
  }

  function startGame() {
    const limit = $("yn-selLimit").value;
    const shuffled = window.Utils.shuffleArray([...DB_YONUNCA]);
    
    pool = limit === "all" ? shuffled : shuffled.slice(0, parseInt(limit));
    if(pool.length === 0) return;
    
    window.emitSound(450, 0.1, "square");
    nextTurn();
  }

  function nextTurn() {
    if (pool.length === 0) {
      alert("¡Se acabaron las frases! Volviendo al menú.");
      changeScreen("yn-scr-lobby");
      return;
    }
    
    $("yn-txtPrompt").textContent = pool.pop();
    window.emitSound(600, 0.1, "triangle");
    changeScreen("yn-scr-game");
  }

  function init() {
    $("yn-btnStart").onclick = startGame;
    $("yn-btnNext").onclick = nextTurn;
    $("yn-btnEnd").onclick = () => changeScreen("yn-scr-lobby");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", YoNuncaGame.init);