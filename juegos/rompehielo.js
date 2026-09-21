const RompehieloGame = (() => {
  let pool = [];

  function $(id) { return document.getElementById(id); }

  function changeScreen(id) {
    document.querySelectorAll(".im-screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    document.body.classList.toggle("playing", id !== "r-scr-lobby");
  }

  function startGame() {
    const limit = $("r-selLimit").value;
    const shuffled = window.Utils.shuffleArray([...DB_ROMPEHIELO]);
    
    pool = limit === "all" ? shuffled : shuffled.slice(0, parseInt(limit));
    if(pool.length === 0) return;
    
    window.emitSound(450, 0.1, "square");
    nextQuestion();
    changeScreen("r-scr-game");
  }

  function nextQuestion() {
    if (pool.length === 0) {
      alert("¡Se acabaron las preguntas!");
      changeScreen("r-scr-lobby");
      return;
    }
    const q = pool.pop();
    $("r-catBadge").textContent = q.cat;
    $("r-txtQuestion").textContent = q.q;
    window.emitSound(600, 0.1, "triangle");
  }

  function init() {
    $("r-btnStart").onclick = startGame;
    $("r-btnNext").onclick = nextQuestion;
    $("r-btnEnd").onclick = () => changeScreen("r-scr-lobby");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", RompehieloGame.init);