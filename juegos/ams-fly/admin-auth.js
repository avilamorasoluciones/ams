(() => {
"use strict";

let panel = null;
let neon = null;
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
    '<div class="admin-head"><div><span class="eyebrow">AMS FLY · ACCESO PRIVADO</span><h2>Gestión</h2></div><button id="adminClose" class="secondary-button" type="button">Cerrar</button></div>' +
    '<div id="adminLoginView">' +
      '<form id="adminLoginForm">' +
        '<label>Correo electrónico<input id="adminEmail" type="email" autocomplete="username" required></label>' +
        '<label>Contraseña<input id="adminPassword" type="password" autocomplete="current-password" required></label>' +
        '<button id="adminLoginSubmit" class="primary-button" type="submit">INICIAR SESIÓN</button>' +
        '<button id="adminForgotPassword" class="admin-reset-link" type="button">¿Olvidaste tu contraseña?</button>' +
        '<p id="adminLoginStatus" class="submit-status" role="status"></p>' +
      '</form>' +
    '</div>' +
    '<div id="adminResetView" hidden>' +
      '<form id="adminResetForm">' +
        '<label>Nueva contraseña<input id="adminNewPassword" type="password" autocomplete="new-password" minlength="8" required></label>' +
        '<label>Repetir contraseña<input id="adminConfirmPassword" type="password" autocomplete="new-password" minlength="8" required></label>' +
        '<button id="adminResetSubmit" class="primary-button" type="submit">GUARDAR CONTRASEÑA</button>' +
        '<button id="adminResetBack" class="admin-reset-link" type="button">VOLVER AL LOGIN</button>' +
        '<p id="adminResetStatus" class="submit-status" role="status"></p>' +
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
      '<div class="admin-actions"><button id="adminSave" class="primary-button" type="button">GUARDAR CONFIGURACIÓN</button><button id="adminReload" class="secondary-button" type="button">↻ RECARGAR DESDE NEON</button><button id="adminExport" class="secondary-button" type="button">EXPORTAR PARTICIPANTES CSV</button></div>' +
      '<p id="adminStatus" class="submit-status" role="status"></p><div id="adminParticipants" class="admin-participants"></div>' +
    '</div>' +
  '</div>';
  document.body.appendChild(panel);
  byId("adminClose").addEventListener("click", () => { panel.hidden = true; });
  byId("adminLoginForm").addEventListener("submit", signIn);
  byId("adminForgotPassword").addEventListener("click", requestPasswordReset);
  byId("adminResetForm").addEventListener("submit", completePasswordReset);
  byId("adminResetBack").addEventListener("click", () => { showLogin(); setLoginStatus(""); });
  byId("adminSignOut").addEventListener("click", signOut);
  byId("adminSave").addEventListener("click", saveConfig);
  byId("adminReload").addEventListener("click", loadAdminData);
  byId("adminExport").addEventListener("click", exportParticipants);
}

async function getNeon() {
  if (!window.AMS_FLY_NEON?.getClient) throw new Error("Cliente Neon no disponible.");
  if (!neon) neon = await window.AMS_FLY_NEON.getClient();
  return neon;
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
  const client = await getNeon();
  const eventResult = await client.from("ams_fly_event_config")
    .select("active,badge,title,description,cta,prize_title,prize_description,condition_title,condition_description,wa_template")
    .eq("id", 1)
    .single();
  if (eventResult.error) throw eventResult.error;
  const participantsResult = await client.from("ams_fly_participants")
    .select("player_name,country_code,bird_id,phone,score,created_at,updated_at")
    .order("score", {ascending:false})
    .order("updated_at", {ascending:true});
  if (participantsResult.error) throw participantsResult.error;
  const config = {
    active:eventResult.data?.active,
    badge:eventResult.data?.badge,
    title:eventResult.data?.title,
    desc:eventResult.data?.description,
    cta:eventResult.data?.cta,
    prizeTitle:eventResult.data?.prize_title,
    prizeDesc:eventResult.data?.prize_description,
    conditionTitle:eventResult.data?.condition_title,
    conditionDesc:eventResult.data?.condition_description,
    waTemplate:eventResult.data?.wa_template
  };
  participants = (participantsResult.data || []).map(row => ({
    name:row.player_name,country:row.country_code,birdId:row.bird_id,
    phone:row.phone,score:row.score,created_at:row.created_at,updated_at:row.updated_at
  }));
  displayConfig(config);
  renderParticipants();
  setStatus("Datos cargados desde Neon.");
}

async function signIn(event) {
  event.preventDefault();
  const button = byId("adminLoginSubmit");
  button.disabled = true;
  setLoginStatus("Conectando con Neon Auth...");
  try {
    const client = await getNeon();
    const result = await client.auth.signIn.email({
      email: byId("adminEmail").value.trim(),
      password: byId("adminPassword").value,
      rememberMe: true
    });
    if (result?.error) throw new Error(result.error.message || "No se pudo iniciar sesión.");
    const sessionResult = await client.auth.getSession();
    const user = sessionResult?.data?.user || sessionResult?.data?.session?.user;
    if (!user) throw new Error("No se pudo obtener la sesión.");
    if (user.emailVerified !== true || user.role !== "admin") {
      await client.auth.signOut().catch(() => {});
      const error = new Error("La cuenta no tiene permisos de administrador.");
      error.status = 403;
      throw error;
    }
    byId("adminEmail").value = user.email || "";
    byId("adminPassword").value = "";
    await showAdmin(user);
  } catch (error) {
    showLogin();
    console.warn("AMS Fly: error al iniciar sesión", error);
    setLoginStatus(error.status === 403
      ? "Esta cuenta no tiene acceso de administrador."
      : "No se pudo iniciar sesión. Revisa el correo y la contraseña.");
  } finally {
    button.disabled = false;
  }
}

async function showAdmin(user) {
  byId("adminIdentity").textContent = user?.email || "Administrador";
  byId("adminLoginView").hidden = true;
  byId("adminResetView").hidden = true;
  byId("adminEditor").hidden = false;
  try {
    await loadAdminData();
  } catch (error) {
    console.error("AMS Fly: sesión iniciada, pero no cargaron los datos de administración", error);
    setStatus("Sesión iniciada, pero no se pudieron cargar los datos. Intenta actualizar.");
  }
}

async function signOut() {
  try {
    if (neon) await neon.auth.signOut();
  } finally {
    showLogin();
    setLoginStatus("Sesión cerrada.");
  }
}

function showLogin() {
  byId("adminLoginView").hidden = false;
  byId("adminResetView").hidden = true;
  byId("adminEditor").hidden = true;
}

async function requestPasswordReset() {
  const email = byId("adminEmail").value.trim();
  if (!email) {
    setLoginStatus("Escribe tu correo electrónico.");
    byId("adminEmail").focus();
    return;
  }
  const button = byId("adminForgotPassword");
  button.disabled = true;
  setLoginStatus("Enviando el enlace de recuperación...");
  try {
    const client = await getNeon();
    const result = await client.auth.requestPasswordReset({
      email,
      redirectTo: window.location.origin + window.location.pathname
    });
    if (result?.error) throw result.error;
    setLoginStatus("Si el correo corresponde a una cuenta, recibirás un enlace para cambiar la contraseña.");
  } catch (error) {
    console.warn("AMS Fly: error al solicitar cambio de contraseña", error);
    setLoginStatus(error?.message || "No se pudo enviar el enlace. Revisa el correo o inténtalo de nuevo.");
  } finally {
    button.disabled = false;
  }
}

function showPasswordReset() {
  byId("adminLoginView").hidden = true;
  byId("adminResetView").hidden = false;
  byId("adminEditor").hidden = true;
  byId("adminResetStatus").textContent = "Elige una contraseña nueva.";
}

async function completePasswordReset(event) {
  event.preventDefault();
  const password = byId("adminNewPassword").value;
  if (password !== byId("adminConfirmPassword").value) {
    byId("adminResetStatus").textContent = "Las contraseñas no coinciden.";
    byId("adminConfirmPassword").focus();
    return;
  }
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) {
    byId("adminResetStatus").textContent = "El enlace venció. Solicita uno nuevo desde el login.";
    return;
  }
  const button = byId("adminResetSubmit");
  button.disabled = true;
  byId("adminResetStatus").textContent = "Guardando...";
  try {
    const client = await getNeon();
    const result = await client.auth.resetPassword({ newPassword: password, token });
    if (result?.error) throw result.error;
    byId("adminNewPassword").value = "";
    byId("adminConfirmPassword").value = "";
    history.replaceState(null, "", window.location.pathname);
    showLogin();
    setLoginStatus("Contraseña actualizada. Ya puedes iniciar sesión.");
  } catch (error) {
    console.warn("AMS Fly: error al cambiar la contraseña", error);
    byId("adminResetStatus").textContent = error?.message || "El enlace venció o no se pudo usar. Solicita uno nuevo.";
  } finally {
    button.disabled = false;
  }
}

async function saveConfig() {
  setStatus("Guardando...");
  try {
    const client = await getNeon();
    const result = await client.from("ams_fly_event_config")
      .update({
        active:byId("cfgActive").checked,
        badge:byId("cfgBadge").value.trim(),
        title:byId("cfgTitle").value.trim(),
        cta:byId("cfgCta").value.trim(),
        description:byId("cfgDesc").value.trim(),
        prize_title:byId("cfgPrizeTitle").value.trim(),
        prize_description:byId("cfgPrizeDesc").value.trim(),
        condition_title:byId("cfgConditionTitle").value.trim(),
        condition_description:byId("cfgConditionDesc").value.trim(),
        wa_template:byId("cfgWaTemplate").value.trim()
      })
      .eq("id", 1)
      .select("active,badge,title,description,cta,prize_title,prize_description,condition_title,condition_description,wa_template")
      .single();
    if (result.error) throw result.error;
    const row = result.data;
    const config = {
      active:row.active,badge:row.badge,title:row.title,desc:row.description,cta:row.cta,
      prizeTitle:row.prize_title,prizeDesc:row.prize_description,
      conditionTitle:row.condition_title,conditionDesc:row.condition_description,
      waTemplate:row.wa_template
    };
    displayConfig(config);
    window.dispatchEvent(new CustomEvent("ams-fly-event-updated",{detail:config}));
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
  participants.forEach((participant,index) => {
    const item = document.createElement("div");
    item.className = "admin-participant";
    const name = document.createElement("strong");
    name.textContent = "#" + (index + 1) + " " + (participant.name || "Piloto");
    const info = document.createElement("span");
    info.textContent = (participant.country || "") + " · " + (participant.birdId || "") + " · " + Number(participant.score || 0) + " pts";
    const phone = document.createElement("span");
    phone.textContent = participant.phone || "Sin WhatsApp";
    item.append(name,info,phone);
    if (participant.phone) {
      const link = document.createElement("a");
      link.href = "https://wa.me/" + String(participant.phone).replace(/\D/g,"");
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
  const header = ["Nombre","País","Ave","Puntaje","WhatsApp","Fecha"];
  const rows = participants.map(row => [row.name,row.country,row.birdId,row.score,row.phone,row.updated_at || row.created_at]);
  const csv = [header,...rows].map(row => row.map(escapeCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv],{type:"text/csv;charset=utf-8"}));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ams-fly-participantes.csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}

async function openAdmin() {
  createPanel();
  panel.hidden = false;
  showLogin();
  setLoginStatus("");
  if (new URLSearchParams(window.location.search).has("token")) {
    showPasswordReset();
    return;
  }
  try {
    const client = await getNeon();
    const sessionResult = await client.auth.getSession();
    const user = sessionResult?.data?.user || sessionResult?.data?.session?.user;
    if (!user) return;
    if (user.emailVerified !== true || user.role !== "admin") {
      await client.auth.signOut().catch(() => {});
      setLoginStatus("Esta cuenta no tiene acceso de administrador.");
      return;
    }
    await showAdmin(user);
  } catch (error) {
    console.warn("AMS Fly: no se pudo abrir la gestión", error);
    setLoginStatus("No se pudo conectar al inicio de sesión. Intenta de nuevo.");
  }
}

window.addEventListener("ams-fly-admin-open", openAdmin);
if (new URLSearchParams(window.location.search).has("token")) openAdmin();
})();
