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
    '<div class="admin-head"><div><span class="eyebrow">AMS FLY · GESTIÓN</span><h2>Acceso de administración</h2></div><button id="adminClose" class="secondary-button" type="button">Cerrar</button></div>' +
    '<div id="adminLoginView">' +
      '<p class="admin-note">Inicia sesión con tu cuenta de Neon Auth. Solo una cuenta con correo verificado y rol administrador puede gestionar el evento.</p>' +
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
      password: byId("adminPassword").value
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
    setLoginStatus(error.status === 403
      ? "La cuenta inició sesión, pero no tiene permisos de administrador."
      : error.message || "No se pudo iniciar sesión. Revisa los datos y vuelve a intentar.");
  } finally {
    button.disabled = false;
  }
}

async function showAdmin(user) {
  byId("adminIdentity").textContent = user?.email || "Administrador";
  byId("adminLoginView").hidden = true;
  byId("adminEditor").hidden = false;
  await loadAdminData();
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
  byId("adminEditor").hidden = true;
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
  try {
    const client = await getNeon();
    const sessionResult = await client.auth.getSession();
    const user = sessionResult?.data?.user || sessionResult?.data?.session?.user;
    if (!user) {
      setLoginStatus("Inicia sesión con la cuenta administradora.");
      return;
    }
    if (user.emailVerified !== true || user.role !== "admin") {
      await client.auth.signOut().catch(() => {});
      setLoginStatus("La cuenta actual no tiene permisos de administrador.");
      return;
    }
    await showAdmin(user);
  } catch (error) {
    setLoginStatus(error.message || "Neon todavía no está configurado en esta versión.");
  }
}

window.addEventListener("ams-fly-admin-open", openAdmin);
})();
