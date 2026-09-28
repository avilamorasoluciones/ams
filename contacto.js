/* Contacto central de Avila Mora Soluciones.
   Funciona tanto en GitHub Pages (/ams) como en el dominio propio. */
(() => {
  const PHONE = "573052547072";
  const EMAIL = "equipo@avilamorasoluciones.com";
  const DEFAULT_WA = "Hola Avila Mora Soluciones, quiero información sobre sus servicios y me gustaría recibir orientación para mi proyecto.";
  const SUBJECT = "Consulta · Avila Mora Soluciones";
  const BODY = "Hola Avila Mora Soluciones,\n\nQuiero información sobre sus servicios y me gustaría recibir orientación para mi proyecto.\n\nMi nombre / negocio es:\n\nSaludos.";
  const openWhatsApp = (message = DEFAULT_WA) => {
    const text = encodeURIComponent(message || DEFAULT_WA);
    window.open("https://wa.me/" + PHONE + "?text=" + text, "_blank", "noopener,noreferrer");
  };
  const openEmail = (provider = "default", extra = {}) => {
    const subject = encodeURIComponent(extra.subject || SUBJECT);
    const body = encodeURIComponent(extra.body || BODY);
    const to = encodeURIComponent(EMAIL);
    let url;
    if (provider === "gmail") {
      url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + to + "&su=" + subject + "&body=" + body;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (provider === "outlook") {
      url = "https://outlook.office.com/mail/deeplink/compose?to=" + to + "&subject=" + subject + "&body=" + body;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = "mailto:" + EMAIL + "?subject=" + subject + "&body=" + body;
  };
  const decorateWhatsapp = () => {
    document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href.includes(PHONE)) return;
      try {
        const current = new URL(href);
        const msg = current.searchParams.get("text") || DEFAULT_WA;
        a.dataset.amsWhatsapp = msg;
        a.addEventListener("click", (event) => {
          event.preventDefault();
          openWhatsApp(a.dataset.amsWhatsapp || DEFAULT_WA);
        });
      } catch (_) {}
    });
  };
  window.AMSContact = { PHONE, EMAIL, openWhatsApp, openEmail };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorateWhatsapp, { once: true });
  } else {
    decorateWhatsapp();
  }
})();