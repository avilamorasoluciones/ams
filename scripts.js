// ===== AOS =====
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const aosDesktop = window.matchMedia("(min-width: 741px)").matches;

function initAOS() {
  if (prefersReduced || !aosDesktop || !window.AOS) {
    document.documentElement.classList.remove("aos-ready");
    return;
  }

  AOS.init({
    duration: 980,
    easing: "ease-out-cubic",
    once: true,
    offset: 90,
    anchorPlacement: "top-bottom"
  });

  document.documentElement.classList.add("aos-ready");
  window.setTimeout(() => AOS.refreshHard(), 60);
}

const tryInitAOS = () => {
  if (!aosDesktop || !window.AOS) return false;
  try {
    initAOS();
    return true;
  } catch (e) {
    document.documentElement.classList.remove("aos-ready");
    console.warn("AOS falló, se mostrará sin animaciones:", e);
    return false;
  }
};

if (aosDesktop && !prefersReduced) {
  if (!tryInitAOS()) {
    window.addEventListener("ams-aos-ready", tryInitAOS, { once: true });
  }
}

let aosRefreshTimer = 0;
const queueAOSRefresh = () => {
  if (!aosDesktop || !window.AOS || prefersReduced) return;
  window.clearTimeout(aosRefreshTimer);
  aosRefreshTimer = window.setTimeout(() => {
    try { AOS.refreshHard(); } catch (_) {}
  }, 160);
};

window.addEventListener("load", queueAOSRefresh, { once: true });
window.addEventListener("resize", queueAOSRefresh, { passive: true });
window.addEventListener("orientationchange", queueAOSRefresh, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", queueAOSRefresh, { passive: true });
}

// ===== Navbar compact + ToTop =====
const nav = document.getElementById("nav");
const toTop = document.getElementById("toTop");

window.addEventListener("scroll", () => {
  nav.classList.toggle("compact", window.scrollY > 40);
  toTop.classList.toggle("show", window.scrollY > 600);
});

toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
});

// ===== Mobile menu =====
const menuBtn = document.getElementById("menuBtn");
const mobilePanel = document.getElementById("mobilePanel");

const closeMobile = () => {
  mobilePanel.classList.remove("open");
  mobilePanel.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
};

menuBtn.addEventListener("click", () => {
  const isOpen = mobilePanel.classList.toggle("open");
  mobilePanel.setAttribute("aria-hidden", String(!isOpen));
  menuBtn.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("menu-open", isOpen);
});

document.addEventListener("click", (e) => {
  const clickedInside = mobilePanel.contains(e.target) || menuBtn.contains(e.target);
  if (!clickedInside) closeMobile();
});

// ===== Navegación suave con offset =====
const navLinks = Array.from(document.querySelectorAll("#navLinks a"));
const allMenuLinks = [
  ...navLinks,
  ...Array.from(document.querySelectorAll("#mobilePanel a")),
  ...Array.from(document.querySelectorAll(".nav-cta a"))
].filter((a) => (a.getAttribute("href") || "").startsWith("#"));

const getNavOffset = () => {
  const isCompact = nav.classList.contains("compact");
  return (isCompact ? 72 : 88) + 14;
};

const smoothScrollTo = (target) => {
  const y = target.getBoundingClientRect().top + window.pageYOffset - getNavOffset();
  window.scrollTo({
    top: y,
    behavior: prefersReduced ? "auto" : "smooth"
  });
};

const replayAOSForSection = (sectionEl) => {
  if (prefersReduced || !window.AOS) return;
  sectionEl.querySelectorAll("[data-aos]").forEach((el) => el.classList.remove("aos-animate"));
  AOS.refreshHard();
};

allMenuLinks.forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    closeMobile();
    smoothScrollTo(target);

    setTimeout(() => replayAOSForSection(target), prefersReduced ? 0 : 520);
  });
});

// ===== Link activo =====
const sections = ["inicio", "servicios", "planes", "gestion", "portafolio", "recursos", "faq", "contacto"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const setActive = (id) => {
  navLinks.forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === "#" + id);
  });

  // También mantiene visible la zona activa en el menú móvil.
  document.querySelectorAll("#mobilePanel a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === "#" + id);
  });
};

// Scroll-spy estable: en lugar de depender de intersecciones que pueden
// dejar la barra sin activo entre secciones, toma la última sección cuyo
// inicio ya pasó la línea de navegación.
let scrollSpyTick = false;

const updateActiveSection = () => {
  const marker = window.scrollY + getNavOffset() + 40;
  let current = sections[0]?.id || "inicio";

  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section.id;
  });

  setActive(current);
  scrollSpyTick = false;
};

window.addEventListener("scroll", () => {
  if (!scrollSpyTick) {
    window.requestAnimationFrame(updateActiveSection);
    scrollSpyTick = true;
  }
}, { passive: true });

window.addEventListener("resize", updateActiveSection);
window.addEventListener("load", updateActiveSection);
updateActiveSection();

// ===== Corrige entrada con hash =====
window.addEventListener("load", () => {
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      setTimeout(() => {
        smoothScrollTo(target);
        replayAOSForSection(target);
      }, 250);
    }
  }
});

// ===== Carruseles móviles: encaje inteligente =====
(() => {
  const carouselSelectors = [
    ".services-grid",
    ".demos-grid",
    ".portfolio-grid",
    ".process",
    ".grid-2",
    ".ams-resource-grid"
  ];

  const carousels = document.querySelectorAll(carouselSelectors.join(","));
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    let settleTimer = 0;
    let userGesture = false;

    const items = () => Array.from(carousel.children).filter((el) => el.offsetWidth > 0);
    const hasOverflow = () => carousel.scrollWidth > carousel.clientWidth + 8;
    const hideHint = () => carousel.classList.add("carousel-used");

    const centerNearestCard = (behavior = "smooth") => {
      const list = items();
      if (!list.length || !hasOverflow()) return;

      const viewportCenter = carousel.scrollLeft + carousel.clientWidth / 2;
      let nearest = list[0];
      let nearestDistance = Infinity;

      list.forEach((item) => {
        const center = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = item;
        }
      });

      const target = nearest.offsetLeft - (carousel.clientWidth - nearest.offsetWidth) / 2;
      carousel.scrollTo({ left: Math.max(0, target), behavior });
      userGesture = false;
    };

    const scheduleSettle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        centerNearestCard("smooth");
      }, 120);
    };

    const startGesture = () => {
      userGesture = true;
      hideHint();
    };

    carousel.addEventListener("pointerdown", startGesture, { passive: true });
    carousel.addEventListener("touchstart", startGesture, { passive: true });
    carousel.addEventListener("wheel", startGesture, { passive: true });

    carousel.addEventListener("scroll", () => {
      if (!userGesture) return;
      scheduleSettle();
    }, { passive: true });

    carousel.addEventListener("touchend", scheduleSettle, { passive: true });
    carousel.addEventListener("pointerup", scheduleSettle, { passive: true });
    carousel.addEventListener("pointercancel", scheduleSettle, { passive: true });

    if (hasOverflow()) {
      window.requestAnimationFrame(() => centerNearestCard("auto"));
    }

    window.addEventListener("resize", () => {
      if (!hasOverflow()) return;
      window.requestAnimationFrame(() => centerNearestCard("auto"));
    }, { passive: true });
  });
})();
// ===== Tema automático y manual =====
const THEME_KEY = "ams-theme-preference";
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function getAutoTheme() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? "light" : "dark"; 
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);
  document.documentElement.style.colorScheme = isLight ? "light" : "dark";
  document.documentElement.style.backgroundColor = isLight ? "#f1f5f9" : "#0f172a";
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", isLight ? "#f1f5f9" : "#0f172a");
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme || getAutoTheme());
}

const themeToggles = [
  document.getElementById("themeToggle"),
  document.getElementById("themeToggleMobile")
].filter(Boolean);

themeToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
});

initTheme();