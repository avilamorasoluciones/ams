/* Juegos AMS — puente para cargar jugadores globales en juegos compatibles */
(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("global") !== "1") return;

  const players = params.getAll("player")
    .map(name => name.trim().slice(0, 18))
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .slice(0, 24);

  if (!players.length) return;

  const MAP = [
    { input: "i-inpName", button: "i-btnAddPlayer" },
    { input: "nc-inpName", button: "nc-btnAddPlayer" },
    { input: "t-inpName", button: "t-btnAddPlayer" },
    { input: "vr-inpName", button: "vr-btnAddPlayer" }
  ];

  function load() {
    const target = MAP.find(item => document.getElementById(item.input) && document.getElementById(item.button));
    if (!target) return;

    const input = document.getElementById(target.input);
    const button = document.getElementById(target.button);

    players.forEach((name, index) => {
      setTimeout(() => {
        input.value = name;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        button.click();
      }, 60 * index);
    });

    setTimeout(() => {
      const note = document.createElement("div");
      note.className = "global-players-loaded";
      note.innerHTML =
        '<strong>👥 Lista global cargada</strong>' +
        '<span>' + players.length + ' jugador' + (players.length === 1 ? "" : "es") + ' listo' + (players.length === 1 ? "" : "s") + ' para esta partida.</span>';
      const lobby = input.closest(".box")?.parentElement || input.parentElement;
      lobby?.prepend(note);
    }, 80 * players.length + 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(load, 120), { once: true });
  } else {
    setTimeout(load, 120);
  }
})();