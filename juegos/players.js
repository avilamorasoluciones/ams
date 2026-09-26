/* Juegos AMS — jugadores globales */
(() => {
  const KEY = "ams_global_players_v1";

  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data.filter(Boolean).map(String).slice(0, 24) : [];
    } catch {
      return [];
    }
  }

  function write(players) {
    const clean = [...new Set(players.map(p => String(p).trim()).filter(Boolean))].slice(0, 24);
    localStorage.setItem(KEY, JSON.stringify(clean));
    return clean;
  }

  function add(name) {
    const clean = String(name || "").trim().slice(0, 18);
    if (!clean) return read();
    return write([...read(), clean]);
  }

  function remove(name) {
    return write(read().filter(p => p !== name));
  }

  function clear() {
    localStorage.removeItem(KEY);
    return [];
  }

  function encodePlayers(url) {
    const list = read();
    if (!list.length) return url;
    const target = new URL(url, window.location.href);
    target.searchParams.delete("global");
    target.searchParams.delete("player");
    target.searchParams.set("global", "1");
    list.forEach(name => target.searchParams.append("player", name));
    return target.href;
  }

  function render() {
    const list = read();
    const chips = document.getElementById("globalPlayersList");
    const count = document.getElementById("globalPlayersCount");
    const empty = document.getElementById("globalPlayersEmpty");
    if (count) count.textContent = list.length + " jugador" + (list.length === 1 ? "" : "es");
    if (empty) empty.hidden = list.length !== 0;
    if (!chips) return;
    chips.innerHTML = list.map(name =>
      '<button type="button" class="player-chip" data-player-remove="' + escapeAttr(name) + '" title="Quitar ' + escapeAttr(name) + '">' +
        '<span class="player-chip-avatar">' + escapeHtml(name.charAt(0).toUpperCase()) + '</span>' +
        '<span>' + escapeHtml(name) + '</span>' +
        '<span class="player-chip-x" aria-hidden="true">×</span>' +
      '</button>'
    ).join("");
  }

  function escapeHtml(value) {
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'","&#039;");
  }

  function initUI() {
    if (!document.getElementById("globalPlayersSection")) return;

    const input = document.getElementById("globalPlayerInput");
    const addButton = document.getElementById("globalPlayerAdd");
    const clearButton = document.getElementById("globalPlayersClear");
    const chips = document.getElementById("globalPlayersList");

    const addCurrent = () => {
      const value = input?.value?.trim();
      if (!value) return;
      add(value);
      if (input) input.value = "";
      render();
      if (input) window.setTimeout(() => input.blur(), 0);
    };

    addButton?.addEventListener("click", addCurrent);
    input?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        addCurrent();
      }
    });

    chips?.addEventListener("click", event => {
      const chip = event.target.closest("[data-player-remove]");
      if (!chip) return;
      remove(chip.dataset.playerRemove);
      render();
    });

    clearButton?.addEventListener("click", () => {
      if (!read().length) return;
      clear();
      render();
    });

    document.querySelectorAll("[data-game-link]").forEach(link => {
      link.addEventListener("click", event => {
        const needsPlayers = link.dataset.needsPlayers === "true";
        if (!needsPlayers || !read().length) return;
        event.preventDefault();
        window.location.href = encodePlayers(link.href);
      });
    });

    render();
  }

  window.AMSPlayers = { read, add, remove, clear, encodePlayers, render };
  document.addEventListener("DOMContentLoaded", initUI);

  /*
   * Android: no permitimos que el guard global de scripts.js haga un
   * scrollIntoView suave al enfocar este campo. El propio navegador/teclado
   * se encarga de mantener el input visible. Capturamos solo este focus y
   * dejamos intactos los demás campos de la aplicación.
   */
  document.addEventListener("focus", event => {
    if (event.target?.id === "globalPlayerInput") {
      event.stopImmediatePropagation();
    }
  }, true);
})();