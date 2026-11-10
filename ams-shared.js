/* AMS Unified Application Shell
   Shared visual system for Juegos, AyuKcal and Herramientas.
   Keeps each product's existing navigation actions and application logic.
*/
(function () {
  'use strict';

  var script = document.currentScript || document.querySelector('script[src*="ams-shared.js"]');
  var scriptUrl = script && script.src ? script.src : location.href;
  var root = new URL('.', scriptUrl).pathname;
  var pathname = location.pathname;

  // AMS Fly is an independent full-screen game. It deliberately receives no shell.
  if (/\/juegos\/ams-fly(?:\/|$)/i.test(pathname)) return;

  var app = /\/ayukcal(?:\/|$)/i.test(pathname) ? 'ayukcal' :
            /\/herramientas(?:\/|$)/i.test(pathname) ? 'herramientas' : 'juegos';
  var body = document.body;
  if (!body || body.dataset.amsShellReady === 'true') return;

  var GAME_ITEMS = [
    { id: 'impostor', label: 'El Impostor', href: 'impostor.html', icon: 'game-impostor.svg' },
    { id: 'bomba', label: 'La Bomba', href: 'bomba.html', icon: 'game-bomba.svg' },
    { id: 'nosconocemos', label: '¿Nos Conocemos?', href: 'nosconocemos.html', icon: 'game-nosconocemos.svg' },
    { id: 'rompehielo', label: 'Rompehielo', href: 'rompehielo.html', icon: 'game-rompehielo.svg' },
    { id: 'tabu', label: 'Tabú', href: 'tabu.html', icon: 'game-tabu.svg' },
    { id: 'verdadreto', label: 'Verdad o Reto', href: 'verdadreto.html', icon: 'game-verdadreto.svg' },
    { id: 'yonunca', label: 'Yo Nunca', href: 'yonunca.html', icon: 'game-yonunca.svg' },
    { id: 'duelo', label: 'Duelo', href: 'duelo.html', icon: 'game-duelo.svg' },
    { id: 'apuesta', label: 'Apuesta', href: 'apuesta.html', icon: 'game-apuesta.svg' }
  ];

  var META = {
    juegos: { brand: 'Juegos AMS', subtitle: 'ENTRETENIMIENTO · GRUPOS', eyebrow: 'JUEGOS · AVILA MORA SOLUCIONES' },
    ayukcal: { brand: 'AyuKcal', subtitle: 'BIENESTAR · HÁBITOS', eyebrow: 'AYUKCAL · BIENESTAR PERSONAL' },
    herramientas: { brand: 'Herramientas', subtitle: 'UTILIDADES · PRODUCTIVIDAD', eyebrow: 'HERRAMIENTAS · PRODUCTIVIDAD' }
  }[app];

  body.classList.add('ams-shared');
  body.dataset.amsApp = app;
  body.dataset.amsShellReady = 'true';

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function cleanText(node) {
    return (node ? node.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function activeGameId() {
    var match = pathname.match(/\/juegos\/([^/]+)\.html$/i);
    return match ? match[1].toLowerCase() : '';
  }

  function makeNavLink(group, item) {
    var link = item.href ? make('a', 'ams-nav-link') : make('button', 'ams-nav-link');
    if (!item.href) link.type = 'button';
    if (item.href) link.href = item.href;
    if (item.id) link.dataset.amsNavId = item.id;
    if (item.target) link.dataset.amsTarget = item.target;
    if (item.active) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    if (item.iconNode) {
      var icon = item.iconNode.cloneNode(true);
      icon.classList.add('ams-nav-icon-source');
      icon.setAttribute('aria-hidden', 'true');
      link.appendChild(icon);
    } else if (item.iconSrc) {
      var image = make('img', 'ams-nav-game-icon');
      image.src = item.iconSrc;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      link.appendChild(image);
    } else {
      link.appendChild(make('span', 'ams-nav-icon', item.icon || '•'));
    }
    link.appendChild(make('span', '', item.label));
    group.appendChild(link);
    return link;
  }

  function makeNavGroup(list, label) {
    var section = make('section', 'ams-nav-group');
    section.setAttribute('aria-label', label);
    section.appendChild(make('div', 'ams-nav-group-title', label));
    list.appendChild(section);
    return section;
  }

  var navData = [];
  var dynamicNav = [];

  function collectAyuNav() {
    var originals = Array.prototype.slice.call(document.querySelectorAll('header .nav-menu .nav-btn'));
    var items = originals.map(function (button) {
      return {
        id: button.getAttribute('data-nav') || '',
        label: cleanText(button.querySelector('span')) || cleanText(button),
        iconNode: button.querySelector('i'),
        active: button.classList.contains('active'),
        action: function () { button.click(); }
      };
    });
    navData = [{ label: 'TU ESPACIO', items: items }];
    dynamicNav = items;
  }

  function collectToolsNav() {
    var panel = document.querySelector('#menuHerramientas .offcanvas-body');
    if (!panel) return;
    var groupName = 'HERRAMIENTAS';
    var groups = [];
    var current = null;
    Array.prototype.forEach.call(panel.querySelectorAll('p, a.menu-link'), function (node) {
      if (node.matches('p')) {
        groupName = cleanText(node).replace(/^[^A-Za-zÁÉÍÓÚÜÑ0-9]+/, '').toUpperCase() || 'CATEGORÍA';
        current = { label: groupName, items: [] };
        groups.push(current);
      } else {
        if (!current) {
          current = { label: groupName, items: [] };
          groups.push(current);
        }
        var iconNode = node.querySelector('.menu-icon i');
        var label = cleanText(node);
        current.items.push({
          label: label,
          href: node.getAttribute('href') || '#',
          iconNode: iconNode,
          target: (node.getAttribute('href') || '').replace(/^#/, ''),
          active: (node.getAttribute('href') || '') === location.hash && !!location.hash
        });
      }
    });
    navData = groups.filter(function (group) { return group.items.length; });
  }

  function collectGamesNav() {
    var current = activeGameId();
    var items = [];
    items.push({ id: 'catalog', label: 'Catálogo de juegos', href: root + 'juegos/', icon: '⌂', active: !current });
    GAME_ITEMS.forEach(function (game) {
      items.push({
        id: game.id,
        label: game.label,
        href: root + 'juegos/' + game.href,
        iconSrc: game.id === 'apuesta' ? '' : root + 'juegos/' + game.icon,
        active: current === game.id
      });
    });
    navData = [
      { label: 'EXPLORAR', items: items.slice(0, 1) },
      { label: 'JUEGOS', items: items.slice(1) }
    ];
  }

  if (app === 'ayukcal') collectAyuNav();
  if (app === 'herramientas') collectToolsNav();
  if (app === 'juegos') collectGamesNav();

  var sidebar = make('aside', 'ams-nav');
  sidebar.id = 'ams-nav';
  sidebar.setAttribute('aria-label', 'Navegación principal de ' + META.brand);
  var sidebarInner = make('div', 'ams-nav-inner');
  var brand = make('a', 'ams-brand');
  brand.href = app === 'juegos' ? root + 'juegos/' : app === 'ayukcal' ? root + 'ayukcal/' : root + 'herramientas/';
  brand.setAttribute('aria-label', META.brand + ' · ' + META.subtitle);
  var brandSymbol = make('span', 'ams-brand-symbol');
  brandSymbol.setAttribute('aria-hidden', 'true');
  brand.appendChild(brandSymbol);
  var brandCopy = make('span', 'ams-brand-copy');
  brandCopy.appendChild(make('span', 'ams-brand-text', META.brand));
  brandCopy.appendChild(make('span', 'ams-brand-sub', META.subtitle));
  brand.appendChild(brandCopy);
  sidebarInner.appendChild(brand);

  var links = make('div', 'ams-nav-links');
  navData.forEach(function (groupData) {
    var group = makeNavGroup(links, groupData.label);
    groupData.items.forEach(function (item) {
      var link = makeNavLink(group, item);
      if (item.action) {
        link.addEventListener('click', function () {
          item.action();
          window.setTimeout(syncAyuNav, 0);
          setPageTitle(item.label);
          closeSidebar();
        });
      } else if (item.target) {
        link.addEventListener('click', function () {
          Array.prototype.forEach.call(sidebar.querySelectorAll('.ams-nav-link'), function (other) {
            var selected = other === link;
            other.classList.toggle('active', selected);
            if (selected) other.setAttribute('aria-current', 'page');
            else other.removeAttribute('aria-current');
          });
          setPageTitle(item.label);
          closeSidebar();
        });
      } else {
        link.addEventListener('click', closeSidebar);
      }
    });
  });
  sidebarInner.appendChild(links);
  var foot = make('div', 'ams-nav-footnote');
  foot.appendChild(make('span', 'ams-nav-footnote-dot'));
  foot.appendChild(make('span', '', 'Soluciones AMS · ' + META.brand));
  sidebarInner.appendChild(foot);
  sidebar.appendChild(sidebarInner);

  var overlay = make('button', 'ams-nav-overlay');
  overlay.type = 'button';
  overlay.setAttribute('aria-label', 'Cerrar menú de navegación');
  overlay.addEventListener('click', closeSidebar);

  var topbar = make('header', 'ams-topbar');
  topbar.id = 'ams-topbar';
  var topMain = make('div', 'ams-topbar-main');
  var sidebarToggle = make('button', 'ams-icon-btn ams-sidebar-toggle');
  sidebarToggle.id = 'ams-sidebar-toggle';
  sidebarToggle.type = 'button';
  sidebarToggle.setAttribute('aria-label', 'Abrir menú de navegación');
  sidebarToggle.setAttribute('aria-controls', 'ams-nav');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  sidebarToggle.title = 'Mostrar u ocultar menú';
  sidebarToggle.appendChild(make('span', 'ams-hamburger'));
  var heading = make('div', 'ams-page-heading');
  heading.appendChild(make('p', 'ams-topbar-eyebrow', META.eyebrow));
  var title = make('h1', '', 'Cargando…');
  title.id = 'ams-page-title';
  heading.appendChild(title);
  topMain.appendChild(sidebarToggle);
  topMain.appendChild(heading);

  var actions = make('div', 'ams-topbar-actions');
  actions.appendChild(make('span', 'ams-demo-pill', 'APP AMS'));
  var themeButton = make('button', 'ams-icon-btn ams-theme-action', '☼');
  themeButton.type = 'button';
  themeButton.id = 'ams-theme-btn';
  themeButton.title = 'Cambiar tema';
  themeButton.setAttribute('aria-label', 'Cambiar tema');
  actions.appendChild(themeButton);
  var userBadge = app === 'ayukcal' ? document.getElementById('userBadge') : null;
  var userName = cleanText(userBadge) || 'Público';
  var userChip = make('span', 'ams-user-chip');
  userChip.appendChild(make('span', 'ams-user-dot', '●'));
  var userText = make('span', '', userName);
  userText.id = 'ams-user-name';
  userChip.appendChild(userText);
  actions.appendChild(userChip);
  topbar.appendChild(topMain);
  topbar.appendChild(actions);

  var footer = make('footer', 'ams-footer');
  footer.id = 'ams-footer';
  var footerInner = make('div', 'ams-footer-inner');
  var footerBrand = make('div', 'ams-footer-brand');
  footerBrand.appendChild(make('span', 'ams-footer-mark', 'AMS'));
  var footerCopy = make('span', 'ams-footer-brand-copy');
  footerCopy.appendChild(make('strong', '', 'Lo Quiero Ya!'));
  footerCopy.appendChild(make('small', '', 'Una línea de productos de Ávila Mora Soluciones'));
  footerBrand.appendChild(footerCopy);
  footerInner.appendChild(footerBrand);
  footerInner.appendChild(make('span', 'ams-footer-tagline', 'Herramientas prácticas para negocios reales.'));
  footerInner.appendChild(make('span', 'ams-footer-copy', 'Demo local · ' + new Date().getFullYear()));
  footer.appendChild(footerInner);

  // Keep original menus in the DOM for existing listeners, but move their actions into the shared sidebar.
  var originalHeader = document.querySelector('body > header:not(.ams-topbar), body > .navbar');
  if (originalHeader) originalHeader.classList.add('ams-original-header');
  var originalFooters = document.querySelectorAll('body > footer, body > #globalFooter');
  Array.prototype.forEach.call(originalFooters, function (oldFooter) {
    oldFooter.classList.add('ams-original-footer');
    oldFooter.setAttribute('aria-hidden', 'true');
  });

  // Use the original main element as-is. Its IDs, form controls and app state remain untouched.
  var main = document.querySelector('body > main, body main');
  if (main) {
    main.classList.add('ams-main-content');
    main.parentNode.insertBefore(topbar, main);
  } else {
    body.appendChild(topbar);
  }

  body.insertBefore(sidebar, body.firstChild);
  body.appendChild(overlay);
  body.appendChild(footer);

  function isLightTheme() {
    return body.classList.contains('light-theme') ||
      body.classList.contains('data-theme-light') ||
      body.getAttribute('data-theme') === 'light' ||
      document.documentElement.getAttribute('data-theme') === 'light';
  }

  function syncTheme() {
    var light = isLightTheme();
    themeButton.textContent = light ? '☾' : '☼';
    themeButton.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    themeButton.title = light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
    themeButton.setAttribute('aria-pressed', String(light));
  }

  themeButton.addEventListener('click', function () {
    if (app === 'juegos') {
      var gameToggle = document.querySelector('[data-theme-toggle]');
      if (gameToggle) gameToggle.click();
    } else if (app === 'ayukcal') {
      var ayuToggle = document.getElementById('themeBtn');
      if (ayuToggle) ayuToggle.click();
      else if (typeof window.toggleTheme === 'function') window.toggleTheme();
    } else {
      var target = document.getElementById(isLightTheme() ? 'themeDarkBtn' : 'themeLightBtn');
      if (target) target.click();
    }
    window.setTimeout(syncTheme, 80);
    window.setTimeout(syncTheme, 260);
  });

  function isMobileViewport() {
    return window.matchMedia ? window.matchMedia('(max-width: 900px)').matches : window.innerWidth <= 900;
  }

  function closeSidebar() {
    body.classList.remove('ams-sidebar-open');
    var mobile = isMobileViewport();
    sidebarToggle.setAttribute('aria-expanded', String(!mobile && !body.classList.contains('ams-sidebar-collapsed')));
  }

  sidebarToggle.addEventListener('click', function () {
    var mobile = isMobileViewport();
    if (mobile) {
      var open = body.classList.toggle('ams-sidebar-open');
      sidebarToggle.setAttribute('aria-expanded', String(open));
    } else {
      var collapsed = body.classList.toggle('ams-sidebar-collapsed');
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeSidebar();
  });
  window.addEventListener('resize', function () {
    if (!isMobileViewport()) closeSidebar();
  }, { passive: true });

  function setPageTitle(value) {
    if (value) title.textContent = value;
  }

  function syncAyuNav() {
    if (app !== 'ayukcal') return;
    var active = document.querySelector('header .nav-menu .nav-btn.active');
    if (!active) return;
    var id = active.getAttribute('data-nav') || '';
    var label = cleanText(active.querySelector('span')) || cleanText(active);
    Array.prototype.forEach.call(sidebar.querySelectorAll('[data-ams-nav-id]'), function (link) {
      var selected = link.dataset.amsNavId === id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    setPageTitle(label);
  }

  function initialTitle() {
    if (app === 'ayukcal') {
      var selected = document.querySelector('header .nav-menu .nav-btn.active') ||
                     document.querySelector('header .nav-menu .nav-btn');
      return cleanText(selected && selected.querySelector('span')) || 'Inicio';
    }
    if (app === 'juegos') {
      var gameHeading = document.querySelector('.game-title, main h1');
      return cleanText(gameHeading) || (activeGameId() ? 'Juego' : 'Catálogo de juegos');
    }
    var firstHeading = document.querySelector('main h1');
    return cleanText(firstHeading) || 'Herramientas';
  }

  setPageTitle(initialTitle());
  syncTheme();
  syncAyuNav();

  if (app === 'ayukcal' && userBadge) {
    var userObserver = new MutationObserver(function () {
      userText.textContent = cleanText(userBadge) || 'Público';
    });
    userObserver.observe(userBadge, { childList: true, subtree: true, characterData: true, attributes: true });
  }

  var themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  if (app === 'ayukcal') {
    document.addEventListener('click', function (event) {
      if (event.target.closest('header .nav-menu .nav-btn')) window.setTimeout(syncAyuNav, 0);
    });
  }

  if (app === 'herramientas') {
    sidebar.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      window.setTimeout(function () {
        var target = document.querySelector(link.getAttribute('href'));
        if (target) setPageTitle(cleanText(target.querySelector('h2,h3,h4')) || link.textContent.trim());
      }, 80);
    });
  }

  // The product-specific headers/footers remain in the source DOM (for legacy event listeners)
  // but are visually replaced by the shared shell.
})();
