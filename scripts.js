// ===== Altura real en móvil =====
function setAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--app-height", `${vh}px`);
}

setAppHeight();
window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setAppHeight);
}

// ===== Loader Futurista =====
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  
  setTimeout(() => {
    loader.classList.add("hidden");
    setTimeout(() => {
      if (loader) loader.remove();
    }, 850);
  }, 2500); 
});

// ===== AOS =====
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initAOS() {
  if (prefersReduced || !window.AOS) {
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
  setTimeout(() => AOS.refreshHard(), 60);
}

try {
  initAOS();
} catch (e) {
  document.documentElement.classList.remove("aos-ready");
  console.warn("AOS falló, se mostrará sin animaciones:", e);
}

function refreshAOSLayout() {
  if (window.AOS && !prefersReduced) {
    AOS.refreshHard();
  }
}

window.addEventListener("load", refreshAOSLayout);
window.addEventListener("resize", refreshAOSLayout);
window.addEventListener("orientationchange", refreshAOSLayout);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", refreshAOSLayout);
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
};

menuBtn.addEventListener("click", () => {
  const isOpen = mobilePanel.classList.toggle("open");
  mobilePanel.setAttribute("aria-hidden", String(!isOpen));
  menuBtn.setAttribute("aria-expanded", String(isOpen));
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
// ¡AQUÍ ESTÁ LA MAGIA ARREGLADA! Agregamos "tecnologias" y "microcms" a la lista
const sections = ["inicio", "sistemas", "servicios", "tecnologias", "microcms", "portafolio", "proceso", "faq", "juegos", "contacto"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const setActive = (id) => {
  navLinks.forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === "#" + id);
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  },
  { rootMargin: "-40% 0px -55% 0px", threshold: 0.02 }
);

sections.forEach((s) => observer.observe(s));

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

// ===== Tema automático y manual =====
const THEME_KEY = "ams-theme-preference";
const themeToggle = document.getElementById("themeToggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function getAutoTheme() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? "light" : "dark"; 
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", isLight ? "#f1f5f9" : "#0f172a");
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme || getAutoTheme());
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

initTheme();