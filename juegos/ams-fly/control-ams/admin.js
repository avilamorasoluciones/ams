(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const loginForm = $("adminLoginForm");
const loginStatus = $("loginStatus");
const panel = $("adminPanel");
const adminStatus = $("adminStatus");
let client = null;
let participants = [];
const countries = {CO:"Colombia",VE:"Venezuela",EC:"Ecuador",US:"Estados Unidos",MX:"México",AR:"Argentina",CL:"Chile",PE:"Perú",BR:"Brasil",PA:"Panamá"};
const birds = {"condor-co":"Cóndor de los Andes",turpial:"Turpial venezolano","tucan-ec":"Tucán andino","eagle-us":"Águila calva","eagle-mx":"Águila real",hornero:"Hornero","chucao-cl":"Chucao","cock-rock":"Gallito de las rocas",sabia:"Sabiá-laranjeira",harpia:"Águila harpía"};

function status(target, message, isError) {
  target.textContent = message || "";
  target.classList.toggle("is-error", !!isError);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (ch) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
  });
}
function getClient() {
  if (!window.AMS_FLY_NEON || !window.AMS_FLY_NEON.getClient) {
    throw new Error("No se pudo cargar el cliente de Neon.");
  }
  return window.AMS_FLY_NEON.getClient();
}
async function getUser() {
  const result = await client.auth.getSession();
  if (result && result.error) throw result.error;
  return result && result.data ? (result.data.user || result.data.session?.user || null) : null;
}
function isAdminValue(data) {
  if (data === true || data === "true") return true;
  if (Array.isArray(data)) return data.some(isAdminValue);
  if (data && typeof data === "object") return Object.values(data).some(isAdminValue);
  return false;
}
function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function isoDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("La fecha no es válida.");
  return date.toISOString();
}
async function loadEvent() {
  const result = await client.from("ams_fly_event_config")
    .select("active,badge,title,description,cta,prize_title,prize_description,condition_title,condition_description,wa_template,event_start_at,event_end_at")
    .eq("id", 1).single();
  if (result.error) throw result.error;
  const row = result.data || {};
  $("eventActive").checked = !!row.active;
  $("eventBadge").value = row.badge || "";
  $("eventTitle").value = row.title || "";
  $("eventDescription").value = row.description || "";
  $("eventCta").value = row.cta || "";
  $("prizeTitle").value = row.prize_title || "";
  $("prizeDescription").value = row.prize_description || "";
  $("conditionTitle").value = row.condition_title || "";
  $("conditionDescription").value = row.condition_description || "";
  $("whatsappTemplate").value = row.wa_template || "";
  $("eventStart").value = localDateTime(row.event_start_at);
  $("eventEnd").value = localDateTime(row.event_end_at);
  renderParticipants();
  status(adminStatus, "Configuración del evento cargada.", false);
}
async function loadParticipants() {
  const result = await client.from("ams_fly_participants")
    .select("id,player_name,country_code,bird_id,phone,score,prize_eligible,best_score_at,updated_at,terms_accepted_at")
    .order("score", {ascending:false}).order("updated_at", {ascending:true}).limit(1000);
  if (result.error) throw result.error;
  participants = result.data || [];
  renderParticipants();
}
function renderParticipants() {
  const body = $("participantsBody");
  if (!participants.length) {
    body.innerHTML = '<tr><td colspan="7">Todavía no hay participantes.</td></tr>';
    return;
  }
  body.innerHTML = participants.map(function (person) {
    const phone = String(person.phone || "");
    const phoneDigits = phone.replace(/\D/g, "");
    const template = $("whatsappTemplate").value.trim() || "Hola {name}, te escribimos de Avila Mora Soluciones sobre tu récord de {score} puntos en {event}.";
    const message = template.replace(/\{name\}/gi, person.player_name || "piloto")
      .replace(/\{score\}/gi, String(person.score ?? 0))
      .replace(/\{event\}/gi, $("eventTitle").value.trim() || "AMS Fly");
    const contact = phoneDigits
      ? escapeHtml(phone) + '<br><a href="https://wa.me/' + encodeURIComponent(phoneDigits) + '?text=' + encodeURIComponent(message) + '" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>'
      : "—";
    const date = person.best_score_at ? new Date(person.best_score_at).toLocaleString() : "—";
    const eligibility = '<button class="admin-secondary" type="button" data-eligibility-id="' + escapeHtml(person.id) + '">' +
      (person.prize_eligible ? "Marcar no elegible" : "Marcar elegible") + '</button>';
    return "<tr><td>" + escapeHtml(person.player_name) + "</td><td>" + escapeHtml(countries[person.country_code] || person.country_code) +
      "</td><td>" + escapeHtml(birds[person.bird_id] || person.bird_id) + "</td><td>" + contact + "</td><td>" +
      escapeHtml(person.score) + "</td><td>" + escapeHtml(date) + "</td><td>" + eligibility + "</td></tr>";
  }).join("");
  $("participantCount").textContent = String(participants.length);
}
function clearAdminData() {
  participants = [];
  $("participantsBody").innerHTML = '<tr><td colspan="7">Inicia sesión para ver los registros.</td></tr>';
  $("participantCount").textContent = "0";
  $("currentAdmin").textContent = "";
  panel.hidden = true;
}
async function authorizeAndLoad() {
  let user = null;
  try {
    client = await getClient();
    user = await getUser();
    if (!user) {
      clearAdminData();
      $("loginCard").hidden = false;
      $("logoutDeniedButton").hidden = true;
      status(loginStatus, "", false);
      return;
    }
    const result = await client.rpc("ams_fly_is_admin", {});
    if (result.error) throw result.error;
    if (!isAdminValue(result.data)) {
      clearAdminData();
      $("loginCard").hidden = false;
      $("logoutDeniedButton").hidden = false;
      status(loginStatus, "La cuenta " + (user.email || "") + " no tiene permiso de administración o su correo no está verificado.", true);
      return;
    }
  } catch (error) {
    clearAdminData();
    $("loginCard").hidden = false;
    $("logoutDeniedButton").hidden = true;
    const raw = String(error?.message || error || "");
    const missingFunction = /ams_fly_is_admin|PGRST202|function.*not found|does not exist/i.test(raw);
    status(loginStatus, missingFunction
      ? "Falta aplicar neon/rls-migration.sql en Neon para habilitar la autorización del panel."
      : (raw || "No se pudo comprobar el acceso con Neon."), true);
    return;
  }
  $("currentAdmin").textContent = user.email || "Administrador";
  $("loginCard").hidden = true;
  $("logoutDeniedButton").hidden = true;
  panel.hidden = false;
  status(adminStatus, "Sesión verificada por Neon Auth. Cargando datos…", false);
  const results = await Promise.allSettled([loadEvent(), loadParticipants()]);
  const failed = results.find(function (result) { return result.status === "rejected"; });
  if (failed) status(adminStatus, "Acceso autorizado. No se pudieron cargar todos los datos: " + String(failed.reason?.message || failed.reason), true);
  else status(adminStatus, "Acceso autorizado y datos cargados.", false);
}
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  $("adminLoginButton").disabled = true;
  status(loginStatus, "Comprobando acceso…", false);
  try {
    client = await getClient();
    const result = await client.auth.signIn.email({
      email: $("adminEmail").value.trim().toLowerCase(),
      password: $("adminPassword").value,
      rememberMe: true
    });
    if (result && result.error) throw result.error;
    $("adminPassword").value = "";
    await authorizeAndLoad();
  } catch (error) {
    status(loginStatus, String(error?.message || "No se pudo iniciar sesión con Neon Auth."), true);
  } finally {
    $("adminLoginButton").disabled = false;
  }
});
$("logoutDeniedButton").addEventListener("click", async function () {
  $("logoutDeniedButton").disabled = true;
  try {
    if (client) await client.auth.signOut();
    clearAdminData();
    status(loginStatus, "Sesión cerrada.", false);
    $("logoutDeniedButton").hidden = true;
  } catch (error) {
    status(loginStatus, String(error?.message || "No se pudo cerrar la sesión."), true);
  } finally {
    $("logoutDeniedButton").disabled = false;
  }
});
$("logoutButton").addEventListener("click", async function () {
  $("logoutButton").disabled = true;
  try {
    if (client) await client.auth.signOut();
    clearAdminData();
    $("loginCard").hidden = false;
    $("logoutDeniedButton").hidden = true;
    $("adminPassword").value = "";
    status(loginStatus, "Sesión cerrada.", false);
  } catch (error) {
    status(adminStatus, String(error?.message || "No se pudo cerrar la sesión."), true);
  } finally {
    $("logoutButton").disabled = false;
  }
});
$("eventForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const active = $("eventActive").checked;
  const start = isoDateTime($("eventStart").value);
  const end = isoDateTime($("eventEnd").value);
  if (active && (!start || !end || Date.parse(end) <= Date.parse(start))) {
    status(adminStatus, "Para activar el evento, define inicio y fin válidos; el fin debe ser posterior al inicio.", true);
    return;
  }
  $("saveEventButton").disabled = true;
  status(adminStatus, "Guardando en Neon…", false);
  try {
    const payload = {
      active:active,
      badge:$("eventBadge").value.trim(),
      title:$("eventTitle").value.trim(),
      description:$("eventDescription").value.trim(),
      cta:$("eventCta").value.trim(),
      prize_title:$("prizeTitle").value.trim(),
      prize_description:$("prizeDescription").value.trim(),
      condition_title:$("conditionTitle").value.trim(),
      condition_description:$("conditionDescription").value.trim(),
      wa_template:$("whatsappTemplate").value.trim(),
      event_start_at:start,
      event_end_at:end,
      updated_at:new Date().toISOString()
    };
    const result = await client.from("ams_fly_event_config").update(payload).eq("id", 1).select("id").single();
    if (result.error) throw result.error;
    await loadEvent();
    status(adminStatus, "✓ Evento guardado y sincronizado con Neon.", false);
  } catch (error) {
    status(adminStatus, String(error?.message || "No se pudo guardar la configuración."), true);
  } finally {
    $("saveEventButton").disabled = false;
  }
});
$("participantsBody").addEventListener("click", async function (event) {
  const button = event.target.closest("[data-eligibility-id]");
  if (!button) return;
  const person = participants.find(function (row) { return row.id === button.dataset.eligibilityId; });
  if (!person) return;
  button.disabled = true;
  status(adminStatus, "Actualizando elegibilidad…", false);
  try {
    const result = await client.from("ams_fly_participants")
      .update({prize_eligible:!person.prize_eligible}).eq("id",person.id).select("id").single();
    if (result.error) throw result.error;
    person.prize_eligible = !person.prize_eligible;
    renderParticipants();
    status(adminStatus, "Elegibilidad actualizada en Neon.", false);
  } catch (error) {
    status(adminStatus, String(error?.message || "No se pudo actualizar la elegibilidad."), true);
    button.disabled = false;
  }
});
$("reloadParticipantsButton").addEventListener("click", async function () {
  $("reloadParticipantsButton").disabled = true;
  status(adminStatus, "Actualizando participantes…", false);
  try {
    await loadParticipants();
    status(adminStatus, "✓ Participantes actualizados.", false);
  } catch (error) {
    status(adminStatus, String(error?.message || "No se pudieron cargar participantes."), true);
  } finally {
    $("reloadParticipantsButton").disabled = false;
  }
});
function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
$("exportButton").addEventListener("click", function () {
  const columns = ["Nombre","País","Ave","WhatsApp","Puntuación","Elegible","Mejor puntuación","Términos aceptados"];
  const rows = participants.map(function (person) {
    return [
      person.player_name,countries[person.country_code] || person.country_code,birds[person.bird_id] || person.bird_id,
      person.phone,person.score,person.prize_eligible ? "Sí" : "No",person.best_score_at,person.terms_accepted_at
    ].map(csvCell).join(",");
  });
  const csv = "\uFEFF" + [columns.map(csvCell).join(","), ...rows].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ams-fly-participantes-" + new Date().toISOString().slice(0, 10) + ".csv";
  link.click();
  URL.revokeObjectURL(url);
});
$("reloadEventButton").addEventListener("click", async function () {
  $("reloadEventButton").disabled = true;
  try {
    await loadEvent();
  } catch (error) {
    status(adminStatus, String(error?.message || "No se pudo leer el evento."), true);
  } finally {
    $("reloadEventButton").disabled = false;
  }
});
authorizeAndLoad();
})();