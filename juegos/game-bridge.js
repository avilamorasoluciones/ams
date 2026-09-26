/* Juegos AMS — puente para cargar jugadores globales en juegos compatibles */
(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("global") !== "1") {
    // Aunque no haya jugadores globales, el puente también instala las
    // correcciones comunes de interacción de los juegos.
    installInteractionFixes();
    return;
  }

  const players = params.getAll("player")
    .map(name => name.trim().slice(0, 18))
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .slice(0, 24);

  function load() {
    const MAP = [
      { input: "i-inpName", button: "i-btnAddPlayer" },
      { input: "nc-inpName", button: "nc-btnAddPlayer" },
      { input: "t-inpName", button: "t-btnAddPlayer" },
      { input: "vr-inpName", button: "vr-btnAddPlayer" }
    ];
    const target = MAP.find(item => document.getElementById(item.input) && document.getElementById(item.button));
    if (!target || !players.length) return;

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

  installInteractionFixes();

  function installInteractionFixes() {
    /*
     * DADO: el botón original queda sustituido por uno limpio para eliminar
     * cualquier listener anterior. La tirada siempre produce un resultado
     * visible, incluso si Android tiene "reducir movimiento" activado.
     */
    const rollButtons = document.querySelectorAll("[data-tool-roll]");
    rollButtons.forEach(original => {
      const button = original.cloneNode(true);
      original.replaceWith(button);
      button.addEventListener("click", () => {
        const resultEl = document.getElementById("dice-result");
        const cube = resultEl?.querySelector(".dice-cube");
        if (!resultEl || !cube || cube.dataset.busy === "1") return;

        cube.dataset.busy = "1";
        cube.classList.remove("dice-rolling", "dice-settled");

        const finalFace = Math.floor(Math.random() * 6) + 1;
        const rotations = {
          1: [720, 1080],
          2: [990, 1080],
          3: [720, 990],
          4: [720, 1170],
          5: [810, 1080],
          6: [720, 1260]
        }[finalFace];

        cube.style.setProperty("--spin-x", rotations[0] + "deg");
        cube.style.setProperty("--spin-y", rotations[1] + "deg");
        cube.classList.add("dice-rolling");
        resultEl.setAttribute("aria-label", "El dado está rodando");

        if (typeof window.emitSound === "function") {
          window.emitSound(240, 0.05, "square", 0.18);
          setTimeout(() => window.emitSound(330, 0.05, "square", 0.16), 150);
          setTimeout(() => window.emitSound(440, 0.06, "square", 0.14), 300);
        }

        setTimeout(() => {
          cube.classList.remove("dice-rolling");
          cube.classList.add("dice-settled");

          // El frente muestra el resultado inequívocamente, incluso sin CSS animation.
          const front = cube.querySelector(".dice-front");
          if (front) front.textContent = String(finalFace);
          resultEl.setAttribute("aria-label", "Resultado del dado: " + finalFace);

          const existing = resultEl.querySelector(".dice-final-result");
          existing?.remove();
          const label = document.createElement("div");
          label.className = "dice-final-result";
          label.textContent = "Salió " + finalFace;
          resultEl.appendChild(label);

          if (typeof window.emitSound === "function") {
            window.emitSound(760, 0.08, "triangle", 0.28);
            setTimeout(() => window.emitSound(980, 0.12, "triangle", 0.22), 90);
          }
          cube.dataset.busy = "0";
        }, 1100);
      });
    });
  }
})();