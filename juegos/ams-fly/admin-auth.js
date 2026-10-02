(() => {
"use strict";

const NEON_AUTH_URL = "";
const ADMIN_API_URL = "";
window.AMS_FLY_API_URL = ADMIN_API_URL;
const AUTH_SDK_URL = "https://esm.sh/@neondatabase/neon-js@0.7.0-beta/auth?bundle";

let neonAuth = null;
let panel = null;
let accessToken = "";
let participants = [];

function byId(id) {
  return panel.querySelector("#" + id);
}
function setStatus(message) {
  byId("adminStatus").textContent = message;
}
function setLoginStatus(message) {
  byId("adminLoginStatus").textContent = message;
}
function escapeCsv(value) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}
function createPanel() {
  if (panel) return;
  panel = document.createElement("section");
  panel.id = "amsFlyAdminPanel";
  panel.className = "admin-panel";
  panel.hidden = true;
  panel.innerHTML = '<div class="admin-card">' +
    '<div class="admin-head"><div><span class="eyebrow">AMS FLY · GESTIÓN</span><h2>Acceso de administración</h2></div><button id="adminClose" class="secondary-button" type="button">Cerrar</button></div>' +
    '<div id="adminLoginView">' +
      '<p class="admin-note">Ingresa con tu cuenta autorizada. Solo el servidor confirma quién tiene permiso para gestionar el evento.</p>' +
      '<form id="adminLoginForm">' +
        '<label>Correo electrónico<input id="adminEmail" type="email" autocomplete="username" required></label>' +
        '<label>Contraseña<input id="adminPassword" type="password" autocomplete="current-password" required></label>' +
        '<button id="adminLoginSubmit" class="primary-button" type="submit">INICIAR SESIÓN</button>' +
        '<p id="adminLoginStatus" class="submit-status" role="status"></p>' +
      '</form>' +
    '</div>' +
    '<div id="adminEditor" hidden>' +
      '<p class="admin-note">Sesión: <strong id="adminIdentity"></strong> <button id="adminSignOut" class="secondary-button" type="button">Cerrar sesión</button></p>' +
      '<h3>Configuración del evento</h3>' +
      '<div class="admin-grid">' +
        '<label>Evento activo<input id="cfgActive" type="checkbox"></label>' +
        '<label>Badge<input id="cfgBadge" type="text" maxlength="80"></label>' +
        '<label>Título<input id="cfgTitle" type="text" maxlength="120"></label>' +
        '<label>CTA<input id="cfgCta" type="text" maxlength="80"></label>' +
      '</div>' +
      '<label>Descripción<textarea id="cfgDesc" maxlength="500"></textarea></label>' +
      '<label>Premio - título<input id="cfgPrizeTitle" type="text" maxlength="160"></label>' +
      '<label>Premio - descripción<textarea id="cfgPrizeDesc" maxlength="1000"></textarea></label>' +
      '<label>Condición - título<input id="cfgConditionTitle" type="text" maxlength="160"></label>' +
      '<label>Condición - descripción<textarea id="cfgConditionDesc" maxlength="1000"></textarea></label>' +
      '<label>Plantilla WhatsApp<textarea id="cfgWaTemplate" maxlength="500"></textarea></label>' +
      '<div class="admin-actions"><button id="adminSave" class="primary-button" type="button">GUARDAR CONFIGURACIÓN</button><button id="adminExport" class="secondary-button" type="button">EXPORTAR PARTICIPANTES CSV</button></div>' +
      '<p id="adminStatus" class="submit-status" role="status"></p><div id="adminParticipants" class="admin-participants"></div>' +
    '</div>' +
  '</div>';
  document.body.appendChild(panel);
  byId("adminClose").addEventListener("click", () => { panel.hidden = true; });
  byId("adminLoginForm").addEventListener("submit", signIn);
  byId("adminSignOut").addEventListener("click", signOut);
  byId("adminSave").addEventListener("click", saveConfig);
  byId("adminExport").addEventListener("click", exportParticipants);
}
async function initializeAuth() {
  if (neonAuth) return true;
  if (!NEON_AUTH_URL || !ADMIN_API_URL) {
    byId("adminLoginSubmit").disabled = true;
    setLoginStatus("Falta conectar la URL pública de Neon Auth y la URL segura de la API.");
    return false;
  }
  const sdk = await import(AUTH_SDK_URL);
  neonAuth = sdk.createInternalNeonAuth(NEON_AUTH_URL);
  byId("adminLoginSubmit").disabled = false;
  setLoginStatus("Ingresa con tu cuenta autorizada.");
  return true;
}
async function getAccessToken() {
  accessToken = await neonAuth.getJWTToken();
  if (!accessToken) throw new Error("La sesión expiró. Inicia sesión de nuevo.");
  return accessToken;
}
async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", "Bearer " + accessToken);
  const response = await fetch(ADMIN_API_URL.replace(/\/$/, "") + path, {...options, headers});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "No se pudo completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return data;
}
function showLogin() {
  byId("adminLoginView").hidden = false;
  byId("adminEditor").hidden = true;
}
async function showAdmin() {
  await getAccessToken();
  const identity = await api("/admin/me");
  byId("adminIdentity").textContent = identity.user?.email || "Administrador";
  byId("adminLoginView").hidden = true;
  byId("adminEditor").hidden = false;
  await loadAdminData();
}
async function signIn(event) {
  event.preventDefault();
  const button = byId("adminLoginSubmit");
  button.disabled = true;
  setLoginStatus("Conectando con Neon Auth...");
  try {
    if (!(await initializeAuth())) return;
    const result = await neonAuth.adapter.signIn.email({
      email: byId("adminEmail").value.trim(),
      password: byId("adminPassword").value
    });
    if (result?.error) throw new Error(result.error.message || "No se pudo iniciar sesión.");
    await showAdmin();
    byId("adminPassword").value = "";
    setStatus("Sesión iniciada.");
  } catch (error) {
    showLogin();
    setLoginStatus(error.status === 403
      ? "La cuenta inició sesión, pero todavía no tiene permiso de administrador."
      : error.message || "No se pudo iniciar sesión. Revisa los datos y vuelve a intentar.");
  } finally {
    button.disabled = !NEON_AUTH_URL || !ADMIN_API_URL;
  }
}
async function signOut() {
  try {
    if (neonAuth) await neonAuth.adapter.signOut();
  } finally {
    accessToken = "";
    showLogin();
    setLoginStatus("Sesión cerrada.");
  }
}
function readConfig() {
  return {
    active: byId("cfgActive").checked,
    badge: byId("cfgBadge").value.trim(),
    title: byId("cfgTitle").value.trim(),
    cta: byId("cfgCta").value.trim(),
    desc: byId("cfgDesc").value.trim(),
    prizeTitle: byId("cfgPrizeTitle").value.trim(),
    prizeDesc: byId("cfgPrizeDesc").value.trim(),
    conditionTitle: byId("cfgConditionTitle").value.trim(),
    conditionDesc: byId("cfgConditionDesc").value.trim(),
    waTemplate: byId("cfgWaTemplate").value.trim()
  };
}
function displayConfig(config) {
  byId("cfgActive").checked = !!config.active;
  byId("cfgBadge").value = config.badge || "";
  byId("cfgTitle").value = config.title || "";
  byId("cfgCta").value = config.cta || "";
  byId("cfgDesc").value = config.desc || "";
  byId("cfgPrizeTitle").value = config.prizeTitle || "";
  byId("cfgPrizeDesc").value = config.prizeDesc || "";
  byId("cfgConditionTitle").value = config.conditionTitle || "";
  byId("cfgConditionDesc").value = config.conditionDesc || "";
  byId("cfgWaTemplate").value = config.waTemplate || "";
}
async function loadAdminData() {
  setStatus("Cargando configuración y participantes...");
  const config = await api("/event");
  participants = await api("/participants");
  displayConfig(config);
  renderParticipants();
  setStatus("Datos cargados desde Neon.");
}
async function saveConfig() {
  setStatus("Guardando...");
  try {
    const config = await api("/event", {method: "PUT", body: JSON.stringify(readConfig())});
    displayConfig(config);
    window.dispatchEvent(new CustomEvent("ams-fly-event-updated", {detail: config}));
    setStatus("Configuración guardada en Neon.");
  } catch (error) {
    setStatus(error.message || "No se pudo guardar la configuración.");
  }
}
function renderParticipants() {
  const list = byId("adminParticipants");
  list.replaceChildren();
  if (!participants.length) {
    const empty = document.createElement("p");
    empty.className = "admin-note";
    empty.textContent = "Todavía no hay participantes registrados.";
    list.appendChild(empty);
    return;
  }
  participants.forEach((participant, index) => {
    const item = document.createElement("div");
    item.className = "admin-participant";
    const name = document.createElement("strong");
    name.textContent = "#" + (index + 1) + " " + (participant.name || "Piloto");
    const info = document.createElement("span");
    info.textContent = (participant.country || "") + " · " + (participant.birdId || "") + " · " + Number(participant.score || 0) + " pts";
    const phone = document.createElement("span");
    phone.textContent = participant.phone || "Sin WhatsApp";
    item.append(name, info, phone);
    if (participant.phone) {
      const link = document.createElement("a");
      const digits = String(participant.phone).replace(/\D/g, "");
      link.href = "https://wa.me/" + digits;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "WhatsApp ↗";
      item.appendChild(link);
    }
    list.appendChild(item);
  });
}
function exportParticipants() {
  if (!participants.length) {
    setStatus("No hay participantes para exportar.");
    return;
  }
  const header = ["Nombre", "País", "Ave", "Puntaje", "WhatsApp", "Fecha"];
  const rows = participants.map(row => [row.name, row.country, row.birdId, row.score, row.phone, row.updated_at || row.created_at]);
  const csv = [header, ...rows].map(row => row.map(escapeCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], {type: "text/csv;charset=utf-8"}));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ams-fly-participantes.csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function openAdmin() {
  createPanel();
  panel.hidden = false;
  byId("adminLoginForm").reset();
  showLogin();
  setLoginStatus("");
  try {
    if (!(await initializeAuth())) return;
    const session = await neonAuth.adapter.getSession();
    if (!session?.data?.session) return;
    await showAdmin();
  } catch (error) {
    accessToken = "";
    showLogin();
    setLoginStatus(error.status === 403
      ? "La cuenta no tiene permiso de administrador."
      : "No se pudo conectar. Inicia sesión o vuelve a intentar.");
  }
}
window.addEventListener("ams-fly-admin-open", openAdmin);
})();