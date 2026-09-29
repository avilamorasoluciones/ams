(function () {
  "use strict";

  // Legacy GitHub Pages project URL -> official AMS domain.
  // Keeps the same section/path, query string and hash.
  var legacyHost = "avilamorasoluciones.github.io";
  if (window.location.hostname.toLowerCase() !== legacyHost) return;

  var official = new URL(window.location.href);
  var path = official.pathname;
  var projectPrefix = "/ams";

  if (path === projectPrefix) {
    path = "/";
  } else if (path.indexOf(projectPrefix + "/") === 0) {
    path = path.slice(projectPrefix.length) || "/";
  }

  official.protocol = "https:";
  official.hostname = "avilamorasoluciones.com";
  official.port = "";
  official.pathname = path;

  window.location.replace(official.href);
})();