(() => {
"use strict";

const STORAGE_KEY = "amsFlyProfileV2";
const PENDING_REG_KEY = "amsFlyPendingRegistrationV1";
const TERMS_KEY = "amsFlyTermsAcceptedV1";
const STATS_KEY = "amsFlyStatsV1";
const FACT_INDEX_KEY = "amsFlyFactIndexV1";
const NEON_DATA_READY = () => !!window.AMS_FLY_NEON_CONFIG?.authUrl && !!window.AMS_FLY_NEON_CONFIG?.dataApiUrl;
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function friendlyAuthError(error, fallback){
  const code=String(error?.code||"").toUpperCase();
  if(code==="USER_ALREADY_EXISTS"||code==="EMAIL_ALREADY_EXISTS") return "Ese correo ya tiene una cuenta. Vuelve al inicio de sesión.";
  if(code==="EMAIL_NOT_VERIFIED") return "Tu correo todavía no está verificado. Revisa tu bandeja de entrada.";
  if(code==="INVALID_PASSWORD"||code==="INVALID_EMAIL_OR_PASSWORD"||code==="INVALID_CREDENTIALS") return "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.";
  if(code==="USER_NOT_FOUND"||code==="CREDENTIAL_ACCOUNT_NOT_FOUND") return "No encontramos una cuenta con ese correo.";
  const raw=[error?.message,error?.details,error?.hint,error?.code,error?.status].filter(Boolean).map(String).join(" | ").trim();
  const key=raw.toLowerCase().replace(/[_-]+/g," ");
  if(key.includes("invalid email or password")||key.includes("invalid credentials")||key.includes("invalid password")||key.includes("incorrect email")||key.includes("incorrect password")||key.includes("invalid login")){
    return "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.";
  }
  if(key.includes("user not found")||key.includes("email not found")) return "No encontramos una cuenta con ese correo.";
  if(key.includes("email already exists")||key.includes("already registered")||key.includes("user already exists")) return "Ese correo ya tiene una cuenta. Intenta iniciar sesión.";
  if(key.includes("email not verified")||key.includes("verify your email")) return "Tu correo todavía no está verificado. Revisa tu bandeja de entrada.";
  if(key.includes("too many")||key.includes("rate limit")) return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
  return fallback;
}

function friendlyNeonSyncError(error){
  const code=String(error?.code||"").toUpperCase();
  const raw=[error?.message,error?.details,error?.hint,error?.code,error?.status].filter(Boolean).map(String).join(" | ").trim();
  const key=raw.toLowerCase().replace(/[_-]+/g," ");
  if(key.includes("auth required")||key.includes("unauthorized")||key.includes("jwt")||code==="401"||code==="403"){
    return "Neon no detectó una sesión válida. Verifica el correo y vuelve a iniciar sesión.";
  }
  if(key.includes("invalid participant")){
    return "Neon rechazó los datos del piloto. Revisa nombre, país, ave y celular.";
  }
  if(key.includes("ams fly register participant")||key.includes("pgrst202")||key.includes("function")&&key.includes("not found")){
    return "Falta habilitar el registro de pilotos en Neon. Revisa la migración de AMS Fly.";
  }
  return "No pudimos sincronizar con Neon."+(raw?" Detalle: "+raw.slice(0,180):" Intenta de nuevo.");
}
function neonAuthRetryable(error){
  const raw=[error?.message,error?.details,error?.hint,error?.code,error?.status].filter(Boolean).map(String).join(" ").toLowerCase();
  return /auth[_ ]required|unauthorized|permission denied|jwt|42501|401|403/.test(raw);
}
function termsAcceptedFor(user){
  if(!user?.email)return false;
  const data=safeParse(TERMS_KEY,{});
  return data[String(user.email).toLowerCase()]?.accepted===true;
}
function saveTermsAcceptedFor(user){
  if(!user?.email)return;
  const data=safeParse(TERMS_KEY,{});
  data[String(user.email).toLowerCase()]={accepted:true,acceptedAt:new Date().toISOString()};
  localStorage.setItem(TERMS_KEY,JSON.stringify(data));
}
function formatRankingDate(value){
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return "";
  return new Intl.DateTimeFormat("es-CO",{
    day:"2-digit",month:"short",year:"numeric",
    hour:"numeric",minute:"2-digit",hour12:true
  }).format(date);
}
async function getNeonClient(){
  if(!window.AMS_FLY_NEON?.getClient) throw new Error("Cliente Neon no disponible.");
  return window.AMS_FLY_NEON.getClient();
}
async function getPublicNeonClient(){
  if(!window.AMS_FLY_NEON?.getPublicClient) throw new Error("Cliente público Neon no disponible.");
  return window.AMS_FLY_NEON.getPublicClient();
}
async function getCurrentAuthUser(){
  const client=await getNeonClient();
  const result=await client.auth.getSession();
  if(result?.error) throw new Error(result.error.message||"No se pudo consultar la sesión.");
  const data=result?.data||{};
  const session=data.session||data.data?.session||null;
  if(!session)return null;
  return data.user||session.user||null;
}
async function getRemoteParticipantProfile(user){
  if(!user || !NEON_DATA_READY()) return null;
  try{
    const client=await getPublicNeonClient();
    const result=await client.rpc("ams_fly_get_participant_profile",{});
    if(result?.error) return null;
    const data=Array.isArray(result.data)?result.data[0]:(result.data||null);
    if(!data?.participant_id) return null;
    return {
      participantId:data.participant_id,
      name:String(data.name||"").trim(),
      firstName:String(data.first_name||"").trim(),
      lastName:String(data.last_name||"").trim(),
      country:String(data.country||"CO").toUpperCase(),
      birdId:String(data.bird_id||""),
      phone:String(data.phone||""),
      dial:String(data.dial||"57"),
      prizeEligible:data.prize_eligible!==false,
      termsAccepted:data.terms_accepted===true
    };
  }catch(_){
    return null;
  }
}
const RANKING_LIMIT = 50;
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
const EVENT_CONFIG_KEY = "amsFlyEventConfigV1";
const DEFAULT_EVENT = {
  active:true,
  badge:"🏆 EVENTO ESPECIAL 2026",
  title:"¡Gana una Landing Page Gratis!",
  desc:"Vuela durante 2026, consigue la puntuación válida más alta y gana el desarrollo de una Landing Page profesional para estrenar en 2027.",
  cta:"VER DETALLES DEL EVENTO",
  prizeTitle:"Desarrollo de Landing Page 100% GRATIS",
  prizeDesc:"El ganador recibe GRATIS el desarrollo completo y profesional de una Landing Page responsive, adaptada a su negocio, con diseño, estructura UX/UI, SEO básico y conexión a sus canales de venta. IMPORTANTE: el desarrollo es gratis; el hosting y dominio no están incluidos en el premio y deben contratarse con Avila Mora Soluciones por US$10/mes o US$100/año para hacer efectivo y mantener el premio.",
  conditionTitle:"Reglas, vigencia y servicio posterior",
  conditionDesc:"⚠️ IMPORTANTE ANTES DE PARTICIPAR\n• El premio es el desarrollo de una Landing Page profesional sin costo de desarrollo.\n• El premio NO significa que el ganador pueda llevarse la Landing Page a un hosting y dominio propios sin contratar el servicio posterior de Avila Mora Soluciones.\n• Para hacer efectivo el premio y mantener la Landing Page publicada, el ganador debe aceptar y pagar el servicio de hosting y dominio gestionado por Avila Mora Soluciones. La mensualidad o anualidad es obligatoria para el ganador.\n• Si ya tienes hosting y dominio propios, o no necesitas que Avila Mora Soluciones gestione tu presencia web, este evento probablemente no es para ti y no deberías participar bajo estas condiciones.\n\n🎁 QUÉ RECIBES GRATIS\n• Desarrollo completo de una Landing Page responsive, adaptada a tu negocio, con diseño, estructura, experiencia de usuario, SEO básico y conexión con los canales de contacto definidos para el proyecto.\n• El desarrollo inicial tiene valor $0 para el ganador. La Landing Page será propiedad del ganador.\n\n💳 QUÉ DEBES PAGAR SI GANAS\n• Hosting + dominio + mantenimiento básico gestionados por Avila Mora Soluciones: US$10 al mes o US$100 al año.\n• Esta es una tarifa especial para el ganador del evento. La tarifa comercial habitual de mantenimiento es de US$15 al mes; el evento conserva para el ganador el precio reducido de US$10 al mes o US$100 al año.\n• La obligación de contratar este servicio aplica para poder recibir y mantener el premio. Si el ganador no acepta la mensualidad o anualidad, se considerará que no cumple las condiciones para hacer efectivo el premio.\n• Si el ganador ya dispone de hosting y dominio y quiere utilizarlos en lugar del servicio gestionado por Avila Mora Soluciones, no podrá hacer efectivo este premio bajo estas condiciones.\n• Modificaciones, funcionalidades, integraciones, servicios adicionales o trabajos fuera del alcance inicial se cotizan por separado.\n\n🌎 FORMA DE COBRO\n• En Colombia, el valor podrá cobrarse en pesos colombianos (COP) tomando como referencia la tarifa publicada en USD y la tasa de cambio de referencia vigente al momento del pago.\n• En otros países, cuando sea posible realizar el cobro en moneda local, podrá cobrarse el equivalente correspondiente a la tarifa en USD.\n• En Venezuela, cuando los medios de pago locales no permitan una conversión o cobro adecuado, la tarifa podrá mantenerse expresada y cobrarse en USD.\n\n🔐 TU CUENTA: UN PILOTO\n• Para participar debes iniciar sesión o crear una cuenta. Esa cuenta queda vinculada a tu piloto y a sus resultados en el ranking.\n• Una misma cuenta solo puede representar a un piloto. Si vuelves desde otro teléfono, computador o navegador e inicias sesión con la misma cuenta, seguirás siendo el mismo piloto.\n• No se permite crear varias cuentas para representar al mismo jugador, registrar copias del mismo jugador o utilizar cuentas duplicadas para alterar el ranking. Si se detectan participaciones duplicadas o destinadas a obtener una ventaja, podrán ser excluidas o descalificadas.\n• Esta cuenta se utiliza para vincular una participación única al ranking; no constituye por sí sola una verificación legal absoluta de identidad física.\n\n🏆 REGLAS DEL EVENTO\n• El evento termina el 31 de diciembre de 2026 a las 11:59 p. m. Ganará el participante elegible con la puntuación válida más alta.\n• En caso de empate, gana quien haya alcanzado primero esa puntuación.\n• Las puntuaciones y la identidad del participante pueden ser revisadas antes de declarar el resultado definitivo.\n• El equipo de Avila Mora Soluciones puede jugar, pero sus puntuaciones no son elegibles para el premio.\n• Al participar, aceptas expresamente tanto las reglas del evento como la condición económica del servicio de hosting y dominio posterior. Si no estás de acuerdo con esa condición, no participes.\n\n📌 EN RESUMEN\nLa propuesta es: desarrollo de la Landing Page GRATIS + hosting y dominio gestionados por Avila Mora Soluciones mediante una tarifa especial obligatoria de US$10/mes o US$100/año. El evento está pensado para personas o negocios que necesitan una Landing Page y quieren que Avila Mora Soluciones se encargue de mantenerla publicada. Si ya tienes infraestructura web propia y no quieres contratar este servicio, no participes porque el premio está condicionado a este modelo.",
  waTemplate:"Hola {name}, te escribimos de Avila Mora Soluciones sobre tu récord de {score} puntos en {event}.",
  eventStartAt:"2026-01-01T05:00:00.000Z",
  eventEndAt:"2027-01-01T04:59:59.000Z"
};

const countries = [
  {code:"CO",name:"Colombia",flag:"🇨🇴",dial:"57",bird:"Cóndor de los Andes"},
  {code:"VE",name:"Venezuela",flag:"🇻🇪",dial:"58",bird:"Turpial venezolano"},
  {code:"EC",name:"Ecuador",flag:"🇪🇨",dial:"593",bird:"Tucán andino"},
  {code:"US",name:"Estados Unidos",flag:"🇺🇸",dial:"1",bird:"Águila calva"},
  {code:"MX",name:"México",flag:"🇲🇽",dial:"52",bird:"Águila real"},
  {code:"AR",name:"Argentina",flag:"🇦🇷",dial:"54",bird:"Hornero"},
  {code:"CL",name:"Chile",flag:"🇨🇱",dial:"56",bird:"Chucao"},
  {code:"PE",name:"Perú",flag:"🇵🇪",dial:"51",bird:"Gallito de las rocas"},
  {code:"BR",name:"Brasil",flag:"🇧🇷",dial:"55",bird:"Sabiá-laranjeira"},
  {code:"PA",name:"Panamá",flag:"🇵🇦",dial:"507",bird:"Águila harpía"}
];

const birds = [
  {id:"condor-co",country:"CO",name:"Cóndor de los Andes",short:"Colombia",a:"#111827",b:"#475569",c:"#f8fafc",d:"#111827",info:"El cóndor de los Andes es el ave insignia de Colombia y uno de sus símbolos naturales más reconocibles."},
  {id:"turpial",country:"VE",name:"Turpial venezolano",short:"Venezuela",a:"#f59e0b",b:"#111827",c:"#fbbf24",d:"#f59e0b",info:"El turpial es el ave nacional de Venezuela y destaca por su plumaje amarillo, negro y naranja."},
  {id:"tucan-ec",country:"EC",name:"Tucán andino",short:"Ecuador",a:"#111827",b:"#374151",c:"#f8fafc",d:"#f59e0b",info:"El tucán andino es una de las aves más llamativas de los bosques montanos de Ecuador, con un pico grande y colorido."},
  {id:"eagle-us",country:"US",name:"Águila calva",short:"Estados Unidos",a:"#f8fafc",b:"#64748b",c:"#f8fafc",d:"#f59e0b",info:"El águila calva es el ave nacional de Estados Unidos y uno de sus símbolos más conocidos."},
  {id:"eagle-mx",country:"MX",name:"Águila real",short:"México",a:"#78350f",b:"#d97706",c:"#92400e",d:"#facc15",info:"El águila real es una de las aves más representativas de México y aparece en su identidad nacional."},
  {id:"hornero",country:"AR",name:"Hornero",short:"Argentina",a:"#92400e",b:"#b45309",c:"#f59e0b",d:"#78350f",info:"El hornero es el ave nacional de Argentina y es famoso por construir nidos de barro con forma de horno."},
  {id:"chucao-cl",country:"CL",name:"Chucao",short:"Chile",a:"#334155",b:"#64748b",c:"#c2410c",d:"#f97316",info:"El chucao es una de las aves más características de los bosques templados del sur de Chile y destaca por su pecho anaranjado."},
  {id:"cock-rock",country:"PE",name:"Gallito de las rocas",short:"Perú",a:"#ef4444",b:"#b91c1c",c:"#f97316",d:"#facc15",info:"El gallito de las rocas es el ave nacional de Perú y destaca por su espectacular plumaje naranja."},
  {id:"sabia",country:"BR",name:"Sabiá-laranjeira",short:"Brasil",a:"#92400e",b:"#d97706",c:"#b45309",d:"#f59e0b",info:"El sabiá-laranjeira es el ave nacional de Brasil y es especialmente conocido por su canto."},
  {id:"harpia",country:"PA",name:"Águila harpía",short:"Panamá",a:"#475569",b:"#1e293b",c:"#94a3b8",d:"#facc15",info:"El águila harpía es el ave nacional de Panamá y una de las rapaces más grandes y poderosas de América."}
];

const colombiaFacts = [
  "Colombia registra más de 1.900 especies de aves, una de las cifras más altas documentadas para un solo país.",
  "Colombia reúne costas en el Caribe y el Pacífico, además de tres cordilleras andinas y regiones de selva, llanura y montaña.",
  "La Sierra Nevada de Santa Marta combina distintos pisos térmicos en una distancia relativamente corta y alberga especies que no se encuentran en otros lugares.",
  "El río Amazonas atraviesa el sur de Colombia y forma parte de una de las regiones con mayor biodiversidad del planeta.",
  "El cóndor de los Andes es el ave nacional de Colombia y está estrechamente asociado con los paisajes de la cordillera.",
  "El territorio colombiano incluye páramos, bosques andinos, selvas tropicales, sabanas, manglares, costas y arrecifes.",
  "Los páramos son ecosistemas de alta montaña que ayudan a almacenar, regular y liberar agua hacia otras zonas.",
  "El Valle del Cocora, en Quindío, es conocido por sus palmas de cera, una de las especies vegetales más características de los Andes colombianos.",
  "La palma de cera puede alcanzar varias decenas de metros de altura y forma paisajes muy particulares en algunas zonas andinas.",
  "Colombia tiene territorios sobre el Caribe y el Pacífico, además de una geografía con grandes cambios de clima y paisaje."
];

const els = {};
[
  "loadingScreen","homeScreen","profileScreen","factScreen","gameScreen","pauseScreen","gameOverScreen",
  "homeBest","homeGames","startBtn","loginFields","authEmail","registerEmail","authPassword","authCreateAccountBtn","authPassword","authSignInBtn","authSignUpBtn","authSignOutBtn","authStatus",
  "registerFields","registerPassword","registerPasswordRepeat","registerStatus","backToLoginBtn","playerName","playerLastName","playerDialCode","playerPhone","playerCountry",
  "accountDetails","accountEmail","accountName","accountLastName","accountDialCode","accountPhone","accountCountry","saveAccountBtn","accountStatus","accountTitle","accountSubtitle",
  "birdGrid","selectedBirdInfo","factTitle","factText","factSourceHint","factContinueBtn","gameCanvas","scoreValue","difficultyValue","pauseBtn","gameStartHint",
  "pauseScore","resumeBtn","bottomNav","quitBtn","resultBird","resultEyebrow","resultTitle","finalScore","resultBest","resultGames","newRecord",
  "againBtn","soundBtn","rankingBackBtn","rankingRefreshBtn","rankingList","rankingStatus","scoreMessage","submitScoreBtn","submitScoreStatus","shareResultBtn","rankingScreen"
].forEach(id => els[id] = document.getElementById(id));

const ctx = els.gameCanvas.getContext("2d", {alpha:false});
let profile = null;
let stats = {games:0,best:0};
let lastResult = null;
let selectedBirdId = "condor-co";
let currentFactIndex = Number(localStorage.getItem(FACT_INDEX_KEY) || 0);
let soundOn = localStorage.getItem("amsFlySound") !== "0";
let audioCtx = null;
let musicTimer = 0;
let musicStep = 0;
let musicStarting = false;
let publishPromise = null;
let game = null;
let raf = 0;
let lastStage = -1;
const stages = [
  {at:0,name:"CIELO ANDINO",top:"#07091a",mid:"#111536",bottom:"#17102b",pipe:"#6d42c9",glow:"#8b5cf6",particle:"#c4b5fd"},
  {at:10,name:"ATARDECER COLOMBIANO",top:"#211329",mid:"#6b294d",bottom:"#1b1230",pipe:"#e16b8c",glow:"#f472b6",particle:"#facc15"},
  {at:20,name:"SELVA VIVA",top:"#031b1b",mid:"#075e54",bottom:"#081f26",pipe:"#16a085",glow:"#34d399",particle:"#facc15"},
  {at:30,name:"CIELO NEÓN",top:"#07102d",mid:"#1e2a78",bottom:"#2a1050",pipe:"#22d3ee",glow:"#22d3ee",particle:"#a78bfa"}
];


function getEventConfig(){
  return safeParse(EVENT_CONFIG_KEY, {...DEFAULT_EVENT,active:false});
}
function saveEventConfig(config){
  localStorage.setItem(EVENT_CONFIG_KEY, JSON.stringify(config));
}
function eventIsOpen(){
  const cfg=getEventConfig();
  const now=Date.now();
  const start=Date.parse(cfg.eventStartAt||"");
  const end=Date.parse(cfg.eventEndAt||"");
  return !!cfg.active && Number.isFinite(start) && Number.isFinite(end) && now>=start && now<=end;
}
function applyEventConfig(){
  const cfg=getEventConfig();
  let banner=document.getElementById("amsFlyEventBanner");
  if(banner)banner.hidden=!cfg.active;
  const navEvent=document.querySelector('.bottom-nav-item[data-nav="event"]');
  if(navEvent){navEvent.disabled=false;navEvent.setAttribute("aria-disabled","false");navEvent.title=cfg.active?"Ver evento":"Consultar evento";}
}
function renderEventRichText(target,text){
  target.replaceChildren();
  const blocks=String(text||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);

  blocks.forEach(block=>{
    const lines=block.split("\n").map(x=>x.trim()).filter(Boolean);
    const first=lines[0]||"";
    const headingMatch=first.match(/^((?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D)+)\s+([\s\S]*)$/u);

    if(headingMatch && lines.length===1){
      const item=document.createElement("div");
      item.className="event-rich-item is-heading";
      const marker=document.createElement("span");
      marker.className="event-rich-marker";
      marker.textContent=headingMatch[1];
      const content=document.createElement("p");
      content.className="event-rich-text";
      content.textContent=headingMatch[2].trim();
      item.append(marker,content);
      target.appendChild(item);
      return;
    }

    const bulletLines=lines.filter(line=>/^•\s*/.test(line));
    const plainLines=lines.filter(line=>!/^•\s*/.test(line));

    if(bulletLines.length){
      bulletLines.forEach(line=>{
        const item=document.createElement("div");
        item.className="event-rich-item is-bullet";
        const marker=document.createElement("span");
        marker.className="event-rich-marker";
        marker.textContent="•";
        const content=document.createElement("p");
        content.className="event-rich-text";
        content.textContent=line.replace(/^•\s*/,"").trim();
        item.append(marker,content);
        target.appendChild(item);
      });
      plainLines.forEach(line=>{
        const item=document.createElement("div");
        item.className="event-rich-item";
        const marker=document.createElement("span");
        marker.className="event-rich-marker";
        const content=document.createElement("p");
        content.className="event-rich-text";
        content.textContent=line;
        item.append(marker,content);
        target.appendChild(item);
      });
      return;
    }

    const item=document.createElement("div");
    item.className="event-rich-item";
    const marker=document.createElement("span");
    marker.className="event-rich-marker";
    marker.textContent="";
    const content=document.createElement("p");
    content.className="event-rich-text";
    content.textContent=block;
    item.append(marker,content);
    target.appendChild(item);
  });
}
async function openEventScreen(){
  let screen=document.getElementById("amsFlyEventScreen");
  if(!screen){
    screen=document.createElement("section");
    screen.id="amsFlyEventScreen";screen.className="screen app-screen";screen.hidden=true;
    screen.innerHTML='<div class="section-heading"><span id="eventBadge" class="eyebrow"></span><h2 id="eventTitle"></h2><p id="eventDesc"></p><p id="eventStatus" class="field-hint" role="status"></p></div><div class="event-details-card"><div class="event-detail-block"><span class="event-badge">🏆 PREMIO</span><h3 id="eventPrizeTitle"></h3><div id="eventPrizeDesc" class="event-rich-content"></div></div><div class="event-detail-block"><span class="event-badge">📋 CONDICIONES</span><h3 id="eventConditionTitle"></h3><div id="eventConditionDesc" class="event-rich-content"></div></div><label id="eventTermsRow" class="consent-row"><input id="eventTermsConsent" type="checkbox"><span>Acepto los <a href="terminos.html" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a> y la <a href="privacidad.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.</span></label><p id="eventAuthHint" class="field-hint"></p><button id="eventJoinButton" class="primary-button" type="button">INICIAR SESIÓN PARA PARTICIPAR <span>→</span></button><button id="eventBackButton" class="secondary-button" type="button">VOLVER <span>←</span></button></div>';
    document.querySelector(".app-shell").insertBefore(screen,document.getElementById("profileScreen"));
    screen.querySelector("#eventBackButton").onclick=()=>navigateTo("play");
    screen.querySelector("#eventJoinButton").onclick=async()=>{
      const user=await getCurrentAuthUser().catch(()=>null);
      if(!user){navigateTo("account");return}
      try{
        const accepted=await getTermsAcceptedFor(user);
        const check=document.getElementById("eventTermsConsent");
        if(!accepted && !check.checked){
          document.getElementById("eventAuthHint").textContent="Marca la casilla para aceptar los términos y participar.";
          return;
        }
        const ready=await ensureParticipantReady(user);
        if(!ready){
          navigateTo("account");
          setAuthStatus(els.accountStatus,"Completa tus datos de cuenta antes de participar.",true);
          return;
        }
        if(check.checked&&!accepted) await persistTermsAccepted(user);
        navigateTo("play");
      }catch(error){
        document.getElementById("eventAuthHint").textContent=friendlyAuthError(error,"No pudimos preparar tu participación. Revisa tu cuenta e inténtalo de nuevo.");
      }
    };
    document.querySelectorAll(".bottom-nav-item").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.nav==="event"));
    screen.querySelector("#eventTermsConsent").addEventListener("change",async()=>{
      const check=document.getElementById("eventTermsConsent");
      const hint=document.getElementById("eventAuthHint");
      const user=await getCurrentAuthUser().catch(()=>null);
      if(!user){
        check.checked=false;
        hint.textContent="Debes iniciar sesión o registrarte para aceptar los términos y participar.";
        navigateTo("account");
        return;
      }
      if(check.checked){
        check.disabled=true;
        hint.textContent="Preparando tu participación…";
        try{
          const ready=await ensureParticipantReady(user);
          if(!ready){
            check.checked=false;
            check.disabled=false;
            hint.textContent="Completa primero tus datos de cuenta.";
            navigateTo("account");
            return;
          }
          await persistTermsAccepted(user);
          document.getElementById("eventTermsRow").classList.add("is-accepted");
          hint.textContent="✓ Términos aceptados para esta cuenta.";
          document.getElementById("eventJoinButton").textContent="PARTICIPAR Y VOLAR ✦";
        }catch(error){
          check.checked=false;
          check.disabled=false;
          hint.textContent=friendlyAuthError(error,"No pudimos guardar la aceptación. Inténtalo de nuevo.");
          document.getElementById("eventTermsRow").classList.remove("is-accepted");
        }
      }
    });
  }
  const cfg=getEventConfig();
  const open=eventIsOpen();
  screen.querySelector("#eventBadge").textContent=cfg.active?(cfg.badge||"AMS FLY · EVENTO"):"AMS FLY · EVENTO";
  screen.querySelector("#eventTitle").textContent=cfg.title;
  screen.querySelector("#eventDesc").textContent=cfg.desc;
  screen.querySelector("#eventStatus").textContent=open
    ? ((cfg.cta?cfg.cta+". ":"")+"El evento está abierto. Inicia sesión, completa tu piloto y acepta las condiciones para participar.")
    : (cfg.active
      ? "El evento está fuera de su periodo de participación. Puedes consultar sus condiciones."
      : "No hay un evento activo por ahora. Puedes jugar libremente y consultar el ranking.");
  screen.querySelector(".event-details-card").hidden=!cfg.active;
  screen.querySelector("#eventTermsRow").hidden=!open;
  screen.querySelector("#eventJoinButton").hidden=!open;
  screen.querySelector("#eventPrizeTitle").textContent=cfg.prizeTitle;
  renderEventRichText(screen.querySelector("#eventPrizeDesc"),cfg.prizeDesc);
  screen.querySelector("#eventConditionTitle").textContent=cfg.conditionTitle;
  renderEventRichText(screen.querySelector("#eventConditionDesc"),cfg.conditionDesc);
  const user=await getCurrentAuthUser().catch(()=>null);
  const accepted=!!user&&await getTermsAcceptedFor(user);
  const check=screen.querySelector("#eventTermsConsent");
  const row=screen.querySelector("#eventTermsRow");
  const hint=screen.querySelector("#eventAuthHint");
  check.checked=accepted;check.disabled=accepted;
  row.classList.toggle("is-accepted",accepted);
  hint.textContent=accepted?"✓ Términos aceptados para esta cuenta.":"Para participar necesitas una cuenta y aceptar los términos.";
  screen.querySelector("#eventJoinButton").textContent=accepted?"PARTICIPAR Y VOLAR ✦":(user?"ACEPTAR Y PARTICIPAR ✦":"INICIAR SESIÓN PARA PARTICIPAR →");
  showOnly(screen);screen.hidden=false;screen.scrollTop=0;
}
async function getTermsAcceptedFor(user){
  if(!user?.email)return false;
  const local=termsAcceptedFor(user);
  if(!NEON_DATA_READY())return local;
  try{
    const client=await getPublicNeonClient();
    const result=await client.rpc("ams_fly_get_terms_status",{});
    if(result?.error)throw result.error;
    const data=result.data||{};
    const accepted=data.accepted===true||data[0]?.accepted===true;
    if(accepted)saveTermsAcceptedFor(user);
    return accepted;
  }catch(_){
    return local;
  }
}
async function persistTermsAccepted(user){
  if(!user?.email)throw new Error("auth_required");
  if(NEON_DATA_READY()){
    const client=await getPublicNeonClient();
    const result=await client.rpc("ams_fly_accept_terms",{});
    if(result?.error)throw result.error;
  }
  saveTermsAcceptedFor(user);
}
async function loadRemoteEventConfig(){
  if(!NEON_DATA_READY())return;
  try{
    const client=await getPublicNeonClient();
    const result=await client.from("ams_fly_event_config")
      .select("active,badge,title,description,cta,prize_title,prize_description,condition_title,condition_description,wa_template,event_start_at,event_end_at")
      .eq("id",1)
      .single();
    if(result.error)throw result.error;
    const row=result.data;
    saveEventConfig({
      ...DEFAULT_EVENT,
      active:!!row.active,badge:row.badge,title:row.title,desc:row.description,cta:row.cta,
      prizeTitle:row.prize_title,prizeDesc:row.prize_description,
      conditionTitle:row.condition_title,conditionDesc:row.condition_description,
      waTemplate:row.wa_template,eventStartAt:row.event_start_at,eventEndAt:row.event_end_at
    });
    applyEventConfig();
    const screen=document.getElementById("amsFlyEventScreen");
    if(screen&&!screen.hidden)openEventScreen();
  }catch(error){
    // Si Neon no responde, nunca dejamos abierto por error un evento guardado
    // anteriormente en el navegador.
    const cached=getEventConfig();
    saveEventConfig({...cached,active:false});
    applyEventConfig();
    const screen=document.getElementById("amsFlyEventScreen");
    if(screen&&!screen.hidden)openEventScreen();
  }
}
function safeParse(key, fallback){
  try{return JSON.parse(localStorage.getItem(key) || "") || fallback}catch(_){return fallback}
}
function saveProfile(){localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))}
function saveStats(){localStorage.setItem(STATS_KEY, JSON.stringify(stats))}
function getCountry(code){return countries.find(c=>c.code===code) || countries[0]}
function getBird(id){return birds.find(b=>b.id===id) || birds[0]}
function birdMarkup(bird,scale="1"){
  return '<div class="bird-shape" style="--bird-a:'+bird.a+';--bird-b:'+bird.b+';--bird-c:'+bird.c+';--bird-d:'+bird.d+';transform:scale('+scale+') rotate(-7deg)"><i class="bird-eye"></i><i class="bird-tail"></i></div>';
}
function renderHomeBird(){return}
function showOnly(target){
  [els.homeScreen,els.profileScreen,els.factScreen,els.gameScreen,els.pauseScreen,els.gameOverScreen,els.rankingScreen].forEach(x=>{if(x)x.hidden=true});
  ["amsFlyEventScreen"].forEach(id=>{const x=document.getElementById(id);if(x)x.hidden=true});
  if(target)target.hidden=false;
  const gameplayScreen=target===els.gameScreen||target===els.pauseScreen||target===els.gameOverScreen;
  const shell=document.querySelector(".app-shell");
  shell?.classList.toggle("game-active",gameplayScreen);
  if(els.bottomNav)els.bottomNav.hidden=target===els.gameScreen||target===els.pauseScreen;
}
function hydrateStats(){
  stats=safeParse(STATS_KEY,{games:0,best:0});
  els.homeBest.textContent=stats.best||0;els.homeGames.textContent=stats.games||0;
}
function initCountries(){
  const options=countries.map(c=>'<option value="'+c.code+'">'+c.flag+" "+c.name+'</option>').join("");
  if(els.playerCountry)els.playerCountry.innerHTML=options;
  if(els.accountCountry)els.accountCountry.innerHTML=options;
  if(els.playerCountry)els.playerCountry.value=profile?.country||"CO";
  if(els.accountCountry)els.accountCountry.value=profile?.country||"CO";
}
function renderBirds(){
  els.birdGrid.innerHTML=birds.map(b=>{
    const c=getCountry(b.country);
    return '<button type="button" class="bird-option '+(b.id===selectedBirdId?"selected ":"")+'" data-bird="'+b.id+'" role="radio" aria-checked="'+(b.id===selectedBirdId)+'">'+
      '<span class="bird-mini">'+birdMarkup(b,".43")+'</span><span class="bird-option-copy"><strong>'+b.name+'</strong><small>'+c.flag+" "+c.name+'</small></span></button>';
  }).join("");
  updateBirdInfo();
}
function updateBirdInfo(){
  const b=getBird(selectedBirdId),c=getCountry(b.country);
  els.selectedBirdInfo.innerHTML="<strong>"+c.flag+" "+b.name+"</strong> · "+b.info;
  els.birdGrid.querySelectorAll("[data-bird]").forEach(btn=>{
    const yes=btn.dataset.bird===selectedBirdId;btn.classList.toggle("selected",yes);btn.setAttribute("aria-checked",String(yes));
  });
}
function loadProfile(){
  profile=safeParse(STORAGE_KEY,null);
  if(profile?.email&&profile?.name&&birds.some(b=>b.id===profile.birdId)){
    if(profile.birdId==="condor-ec")profile.birdId="tucan-ec";
    if(profile.birdId==="condor-cl")profile.birdId="chucao-cl";
    selectedBirdId=profile.birdId;
  }else profile=null;
}
function playTone(freq=440,duration=.08,type="sine"){
  if(!soundOn)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    const now=audioCtx.currentTime;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.11,now+.012);
    g.gain.exponentialRampToValueAtTime(.0015,now+duration);
    o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+duration+.02);
  }catch(_){}
}
function stopMusic(){
  if(musicTimer){clearTimeout(musicTimer);musicTimer=0}
}
function startMusic(){
  if(!soundOn||musicTimer||musicStarting)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const begin=()=>{
      musicStarting=false;
      if(!soundOn||musicTimer||!audioCtx)return;
      const notes=[196,220,247,262,247,220,196,165];
      const tick=()=>{
        if(!soundOn){stopMusic();return}
        try{
          const now=audioCtx.currentTime;
          const note=notes[musicStep%notes.length];
          const o=audioCtx.createOscillator(),g=audioCtx.createGain();
          o.type="triangle";o.frequency.setValueAtTime(note,now);
          g.gain.setValueAtTime(.0001,now);
          g.gain.exponentialRampToValueAtTime(.065,now+.035);
          g.gain.exponentialRampToValueAtTime(.0001,now+.38);
          o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+.4);
          const bass=audioCtx.createOscillator(),bg=audioCtx.createGain();
          bass.type="sine";bass.frequency.setValueAtTime(note/2,now);
          bg.gain.setValueAtTime(.0001,now);
          bg.gain.exponentialRampToValueAtTime(.028,now+.04);
          bg.gain.exponentialRampToValueAtTime(.0001,now+.32);
          bass.connect(bg);bg.connect(audioCtx.destination);bass.start(now);bass.stop(now+.35);
        }catch(_){}
        musicStep++;
        musicTimer=setTimeout(tick,420);
      };
      tick();
    };
    if(audioCtx.state==="suspended"||audioCtx.state==="interrupted"){
      musicStarting=true;
      audioCtx.resume().then(begin).catch(()=>{musicStarting=false});
    }else begin();
  }catch(_){musicStarting=false}
}
function unlockMenuMusic(){
  window.removeEventListener("pointerdown",unlockMenuMusic,true);
  window.removeEventListener("keydown",unlockMenuMusic);
  if(soundOn){
    // La primera llamada durante la carga puede quedar suspendida por la
    // política de autoplay del navegador. Reintentar dentro del primer gesto.
    musicStarting=false;
    startMusic();
  }
}
function resizeCanvas(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(320,window.innerWidth),h=Math.max(500,window.innerHeight);
  els.gameCanvas.width=Math.round(w*dpr);els.gameCanvas.height=Math.round(h*dpr);
  els.gameCanvas.style.width=w+"px";els.gameCanvas.style.height=h+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function randomBetween(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function currentStageIndex(score){
  return Math.floor(Math.max(0,score)/10)%stages.length;
}
function currentStage(score){
  return stages[currentStageIndex(score)];
}
function showStageBanner(stage,index){
  let banner=document.getElementById("stageBanner");
  if(!banner){banner=document.createElement("div");banner.id="stageBanner";banner.className="stage-banner";els.gameScreen.appendChild(banner)}
  banner.textContent=stage.name;
  banner.classList.remove("show");void banner.offsetWidth;banner.classList.add("show");
  clearTimeout(banner._timer);banner._timer=setTimeout(()=>banner.classList.remove("show"),1800);
}
function playStageSound(index){
  const notes=[[262,330,392,523],[294,392,494,587],[330,440,554,660],[392,523,659,784]][index%4];
  notes.forEach((note,i)=>setTimeout(()=>playTone(note,.14,"triangle"),i*75));
}
function updateStage(){
  const index=currentStageIndex(game.score);
  const stage=stages[index];
  if(index!==lastStage){
    lastStage=index;
    showStageBanner(stage,index);
    playStageSound(index);
  }
  game.stage=stage;
}
function difficultyFor(score){
  return 1 + Math.min(5,Math.floor(score/12)*.28);
}
function setHeaderGameActionsHidden(hidden){}
function resetGame(){
  setHeaderGameActionsHidden(true);
  if(soundOn)startMusic();
  resizeCanvas();
  const w=window.innerWidth,h=window.innerHeight;
  const chosenBirdId=selectedBirdId||profile?.birdId||"condor-co";
  if(profile){
    profile.birdId=chosenBirdId;
    saveProfile();
  }
  const birdData=getBird(chosenBirdId);
  game={
    running:true,paused:false,started:false,score:0,time:0,last:performance.now(),spawn:0,
    bird:{x:Math.max(75,w*.22),y:h*.48,vy:0,r:18},
    pipes:[],birdData,
    worldSpeed:Math.max(170,Math.min(205,w*.29)),
    gravity:1180,flap:-405,
    gap:Math.max(165,Math.min(215,h*.26)),pipeW:58,
    deathAt:0,
    stage:currentStage(0)
  };
  lastStage=0;
  els.scoreValue.textContent="0";els.difficultyValue.textContent="VUELO 1";els.gameStartHint.hidden=false;
  showOnly(els.gameScreen);
  cancelAnimationFrame(raf);
  game.last=performance.now();
  raf=requestAnimationFrame(loop);
}
function flap(){
  if(!game || !game.running || game.paused)return;
  if(!game.started){game.started=true;els.gameStartHint.hidden=true}
  game.bird.vy=game.flap;playTone(520,.055,"triangle");
}
function spawnPipe(){
  const h=window.innerHeight;
  const d=difficultyFor(game.score);
  const gap=clamp(game.gap-(d-1)*6,128,game.gap);
  const margin=Math.max(86,h*.12);
  const minTop=margin,maxTop=h-margin-gap;
  const top=randomBetween(minTop,Math.max(minTop+1,maxTop));
  game.pipes.push({x:window.innerWidth+35,top,bottom:top+gap,passed:false});
}
function circleRectHit(cx,cy,r,rx,ry,rw,rh){
  const nx=clamp(cx,rx,rx+rw),ny=clamp(cy,ry,ry+rh),dx=cx-nx,dy=cy-ny;
  return dx*dx+dy*dy<r*r;
}
function update(dt){
  if(!game.started)return;
  game.time+=dt;
  const d=difficultyFor(game.score);
  updateStage();
  game.worldSpeed=Math.min(285,Math.max(145,window.innerWidth*.23)+(d-1)*20);
  game.gravity=1250+(d-1)*42;
  game.bird.vy+=game.gravity*dt;game.bird.y+=game.bird.vy*dt;
  game.spawn-=dt;
  if(game.spawn<=0){spawnPipe();game.spawn=Math.max(1.18,1.48-(d-1)*.05)}
  for(let i=game.pipes.length-1;i>=0;i--){
    const p=game.pipes[i];p.x-=game.worldSpeed*dt;
    if(!p.passed && p.x+game.pipeW<game.bird.x){p.passed=true;game.score++;els.scoreValue.textContent=game.score;els.difficultyValue.textContent="VUELO "+Math.min(6,1+Math.floor(game.score/12));playTone(760,.055,"sine")}
    if(p.x+game.pipeW<-30)game.pipes.splice(i,1);
  }
  const b=game.bird;
  if(b.y-b.r<0 || b.y+b.r>window.innerHeight){endGame();return}
  for(const p of game.pipes){
    if(circleRectHit(b.x,b.y,b.r,p.x,0,game.pipeW,p.top)||circleRectHit(b.x,b.y,b.r,p.x,p.bottom,game.pipeW,window.innerHeight-p.bottom)){endGame();return}
  }
}
function drawBackground(w,h){
  const stage=game.stage||currentStage(game.score);
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,stage.top);g.addColorStop(.55,stage.mid);g.addColorStop(1,stage.bottom);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.5,h*.35,10,w*.5,h*.35,Math.max(w,h)*.7);glow.addColorStop(0,"rgba(139,92,246,.14)");glow.addColorStop(1,"rgba(139,92,246,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.7;
  for(let i=0;i<18;i++){const x=((i*97+game.time*18)%w),y=(i*71+(game.time*(10+i%4)))%h;ctx.fillStyle=stage.particle;ctx.fillRect(x,y,1.5,1.5)}
  ctx.globalAlpha=1;
  ctx.strokeStyle="rgba(255,255,255,.035)";ctx.lineWidth=1;
  const offset=(game?.time*game.worldSpeed*.13)%48;
  for(let x=-48+offset;x<w+48;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
}
function drawPipe(p,h){
  const stage=game.stage||currentStage(game.score);
  const grad=ctx.createLinearGradient(p.x,0,p.x+game.pipeW,0);grad.addColorStop(0,"#16132c");grad.addColorStop(.5,stage.pipe);grad.addColorStop(1,"#201636");
  ctx.fillStyle=grad;ctx.shadowColor=stage.glow;ctx.shadowBlur=16;
  ctx.fillRect(p.x,0,game.pipeW,p.top);ctx.fillRect(p.x,p.bottom,game.pipeW,h-p.bottom);
  ctx.shadowBlur=0;ctx.fillStyle=stage.glow;
  ctx.fillRect(p.x-5,p.top-12,game.pipeW+10,12);ctx.fillRect(p.x-5,p.bottom,game.pipeW+10,12);
  ctx.fillStyle="rgba(255,255,255,.11)";ctx.fillRect(p.x+10,0,4,p.top);ctx.fillRect(p.x+10,p.bottom,4,h-p.bottom);
}
function drawBird(){
  const b=game.bird;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(clamp(b.vy/650,-.45,.65));
  ctx.shadowColor="rgba(139,92,246,.55)";ctx.shadowBlur=20;
  const body=ctx.createLinearGradient(-22,-18,22,18);body.addColorStop(0,game.birdData.a);body.addColorStop(1,game.birdData.b);ctx.fillStyle=body;
  ctx.beginPath();ctx.ellipse(0,0,24,18,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.32)";ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle=game.birdData.c;ctx.beginPath();ctx.ellipse(-8,7,16,9,-.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.birdData.d;ctx.beginPath();ctx.moveTo(20,-2);ctx.lineTo(39,4);ctx.lineTo(20,8);ctx.closePath();ctx.fill();
  ctx.fillStyle="#111827";ctx.beginPath();ctx.arc(12,-9,4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(13,-10,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.birdData.c;ctx.beginPath();ctx.moveTo(-18,-2);ctx.quadraticCurveTo(-39,-22,-31,5);ctx.quadraticCurveTo(-24,12,-11,7);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.28)";ctx.stroke();
  ctx.restore();
}
function draw(){
  const w=window.innerWidth,h=window.innerHeight;drawBackground(w,h);
  game.pipes.forEach(p=>drawPipe(p,h));
  drawBird();
  if(game.started){
    ctx.fillStyle="rgba(255,255,255,.025)";ctx.fillRect(0,h-34,w,34);
  }
}
function loop(now){
  if(!game||!game.running)return;
  const dt=Math.min(.032,(now-game.last)/1000);game.last=now;
  if(!game.paused)update(dt);
  draw();
  raf=requestAnimationFrame(loop);
}
function savePendingScore(result){
  const payload={...result,savedAt:new Date().toISOString()};
  try{localStorage.setItem("amsFlyPendingScoreV1",JSON.stringify(payload));return true}catch(_){}
  try{sessionStorage.setItem("amsFlyPendingScoreV1",JSON.stringify(payload));return true}catch(_){}
  return false;
}
function readPendingScore(){
  for(const storage of [localStorage,sessionStorage]){
    try{
      const value=JSON.parse(storage.getItem("amsFlyPendingScoreV1")||"null");
      if(value&&Number(value.score)>=0)return value;
    }catch(_){}
  }
  return null;
}
function clearPendingScore(){
  for(const storage of [localStorage,sessionStorage]){
    try{storage.removeItem("amsFlyPendingScoreV1")}catch(_){}
  }
}
function restorePendingResult(){
  if(!profile || !els.gameOverScreen || !els.gameOverScreen.hidden)return false;
  const pending=readPendingScore();
  if(!pending)return false;
  const score=Math.max(0,Number(pending.score||0));
  if(!Number.isFinite(score))return false;

  // El récord local siempre vive en STATS_KEY. El resultado pendiente solo
  // conserva la partida que falta por publicar y nunca puede bajar el récord.
  const pendingBest=Math.max(0,Number(pending.best||0));
  const pendingGames=Math.max(0,Number(pending.games||0));
  const storedBest=Math.max(0,Number(stats.best||0));
  const storedGames=Math.max(0,Number(stats.games||0));
  stats.best=Math.max(storedBest,pendingBest,score);
  stats.games=Math.max(storedGames,pendingGames);
  if(stats.best!==storedBest || stats.games!==storedGames) saveStats();

  const birdData=getBird(pending.birdId||profile.birdId||selectedBirdId);
  lastResult={score,durationMs:Math.max(0,Number(pending.durationMs||0)),birdId:birdData?.id||profile.birdId||selectedBirdId,best:stats.best,games:stats.games,isRecord:Boolean(pending.isRecord),message:String(pending.message||"").slice(0,90)};
  els.finalScore.textContent=String(score);
  els.resultBest.textContent=String(stats.best);
  els.resultGames.textContent=String(stats.games);
  els.resultBird.innerHTML=birdMarkup(birdData,"1.15");
  els.newRecord.hidden=!Boolean(pending.isRecord);
  els.submitScoreBtn.dataset.published="0";
  els.submitScoreBtn.disabled=false;
  els.scoreMessage.disabled=false;
  els.submitScoreBtn.innerHTML='PUBLICAR PUNTUACIÓN <span>↑</span>';
  els.submitScoreStatus.textContent="Tienes una puntuación pendiente de publicación. Tu resultado se conserva localmente.";
  els.scoreMessage.value=String(pending.message||"").slice(0,90);
  showOnly(els.gameOverScreen);
  els.gameOverScreen.hidden=false;
  return true;
}
function updateLargeScreenRecommendation(){
  const id="amsFlyLargeScreenNote";
  let note=document.getElementById(id);
  const largeDesktop=window.matchMedia("(min-width:1200px) and (hover:hover) and (pointer:fine)").matches;
  if(!note){
    note=document.createElement("div");
    note.id=id;
    note.className="ams-fly-large-screen-note";
    note.textContent="Para una experiencia más cómoda, recomendamos jugar desde un celular.";
    els.gameScreen.appendChild(note);
  }
  note.hidden=!largeDesktop;
}
function endGame(){
  if(!game || !game.running)return;
  game.running=false;
  setHeaderGameActionsHidden(false);
  game.deathAt=performance.now();
  stopMusic();
  cancelAnimationFrame(raf);

  const finalScore=Math.max(0,Number(game.score||0));
  const previousBest=Math.max(0,Number(stats.best||0));
  const isRecord=finalScore>previousBest;

  stats.games=Math.max(0,Number(stats.games||0))+1;
  stats.best=Math.max(previousBest,finalScore);
  saveStats();
  hydrateStats();

  els.finalScore.textContent=String(finalScore);
  els.resultBest.textContent=String(stats.best);
  els.resultGames.textContent=String(stats.games);
  els.resultBird.innerHTML=birdMarkup(game.birdData,"1.15");
  els.newRecord.hidden=!isRecord;

  if(finalScore>=30){
    els.resultEyebrow.textContent="VUELO EXTRAORDINARIO";
    els.resultTitle.textContent="¡Qué vuelo!";
  }else if(finalScore>=15){
    els.resultEyebrow.textContent="VUELO DESTACADO";
    els.resultTitle.textContent="Muy buen vuelo.";
  }else if(finalScore>0){
    els.resultEyebrow.textContent="VUELO TERMINADO";
    els.resultTitle.textContent="Buen intento.";
  }else{
    els.resultEyebrow.textContent="VUELO TERMINADO";
    els.resultTitle.textContent="Vamos de nuevo.";
  }

  lastResult={score:finalScore,durationMs:Math.max(0,Math.round((game.time||0)*1000)),birdId:game.birdData?.id||profile?.birdId||selectedBirdId,best:stats.best,games:stats.games,isRecord,message:""};
  savePendingScore(lastResult);
  els.scoreMessage.value="";
  els.submitScoreBtn.dataset.published="0";
  els.submitScoreBtn.disabled=false;
  els.scoreMessage.disabled=false;
  els.submitScoreBtn.hidden=!eventIsOpen();
  const scoreMessageLabel=els.scoreMessage.closest(".message-label");
  if(scoreMessageLabel)scoreMessageLabel.hidden=!eventIsOpen();
  els.submitScoreBtn.innerHTML='PUBLICAR PUNTUACIÓN <span>↑</span>';
  els.submitScoreStatus.hidden=false;
  els.submitScoreStatus.textContent=eventIsOpen()
    ? (profile?"Puedes publicar este vuelo en el evento activo.":"Para participar en el evento, inicia sesión o crea una cuenta. Tu vuelo ya quedó guardado en este dispositivo.")
    : "Puedes jugar libremente. No hay un evento abierto para publicar puntuaciones; tu récord queda guardado en este dispositivo.";
  showOnly(els.gameOverScreen);
  els.gameOverScreen.hidden=false;
  window.scrollTo(0,0);
  requestAnimationFrame(()=>{els.gameOverScreen.hidden=false;els.scoreMessage?.focus({preventScroll:true})});
  playTone(isRecord?880:220,.12,isRecord?"triangle":"sine");
}

async function ensureResultPublishedBeforeLeaving(){
  if(!lastResult && !readPendingScore())return true;
  if(els.submitScoreBtn?.dataset.published==="1")return true;
  els.submitScoreStatus.textContent="Guardando tu puntuación antes de abrir el ranking…";
  const ok=await publishScore();
  if(!ok)return false;
  return true;
}
async function publishScore(options={}){
  if(publishPromise)return publishPromise;
  const current=publishScoreInternal(options);
  publishPromise=current;
  try{
    return await current;
  }finally{
    if(publishPromise===current)publishPromise=null;
  }
}
async function publishScoreInternal(options={}){
  const automatic=options.automatic===true;
  if(!profile){
    if(!automatic){
      els.submitScoreStatus.textContent="Inicia sesión o crea una cuenta para participar. Tu puntuación está guardada en este dispositivo.";
      navigateTo("account");
      setAuthStatus(els.authStatus,"Inicia sesión o crea una cuenta para publicar este vuelo.",false);
    }
    return false;
  }
  if(!eventIsOpen()){
    if(!automatic) els.submitScoreStatus.textContent="El evento ya no está vigente. Las puntuaciones solo pueden publicarse durante el periodo oficial del evento.";
    return false;
  }
  if(els.submitScoreBtn.dataset.published==="1")return true;

  const pending=readPendingScore();
  const currentResult=lastResult||pending;
  const resultScore=Math.max(0,Number(currentResult?.score||0));
  const resultDuration=Number(currentResult?.durationMs||0);
  const localBest=Math.max(0,Number(stats.best||0));

  // Una partida de 0 o 1 también puede servir para sincronizar un récord
  // local antiguo. Solo rechazamos el intento si no existe ningún récord que
  // sincronizar y tampoco hay una puntuación actual válida.
  if(resultScore<=0 && localBest<=0){
    if(!automatic) els.submitScoreStatus.textContent="No hay una puntuación pendiente para publicar.";
    return false;
  }

  const typedMessage=String(els.scoreMessage.value||"").trim();
  const savedMessage=String(currentResult?.message||"").trim();
  const message=(typedMessage||savedMessage||"¡Buen vuelo!").slice(0,90);

  if(!NEON_DATA_READY()){
    if(!automatic) els.submitScoreStatus.textContent="No se puede publicar todavía: falta conectar el Data API de Neon.";
    return false;
  }

  els.submitScoreBtn.disabled=true;
  els.scoreMessage.disabled=true;
  els.submitScoreStatus.hidden=false;
  if(!automatic) els.submitScoreStatus.textContent="Guardando tu puntuación en el ranking…";

  try{
    const authUser=await getCurrentAuthUser();
    if(!authUser)throw new Error("auth_required");
    if(!termsAcceptedFor(authUser)){
      if(!automatic){
        els.submitScoreStatus.textContent="Acepta los Términos y Condiciones en la sección Evento para publicar este puntaje.";
        els.submitScoreBtn.disabled=false;
        els.scoreMessage.disabled=false;
        navigateTo("event");
      }
      return false;
    }

    const client=await getPublicNeonClient();
    let participantId=profile.participantId||null;

    // El piloto ya quedó registrado al configurar su perfil. No repetimos esa
    // RPC en cada publicación: evita una llamada de red y acelera el guardado.
    if(!participantId){
      let participantResult=await client.rpc("ams_fly_register_participant",{
        p_name:profile.name,p_country:profile.country,p_bird_id:profile.birdId,p_phone:null,p_score:0
      });

      if(participantResult.error && String(participantResult.error.message||"").includes("auth_required")){
        await new Promise(resolve=>setTimeout(resolve,350));
        if(!await getCurrentAuthUser())throw new Error("auth_required");
        participantResult=await client.rpc("ams_fly_register_participant",{
          p_name:profile.name,p_country:profile.country,p_bird_id:profile.birdId,p_phone:null,p_score:0
        });
      }

      if(participantResult.error)throw participantResult.error;
      participantId=participantResult.data?.participant_id||null;
      if(participantId){
        profile.participantId=participantId;
        saveProfile();
      }
    }

    if(!participantId)throw new Error("No se pudo identificar tu piloto.");

    // El dispositivo puede conservar un récord conseguido antes de que la
    // publicación en Neon estuviera disponible. Al terminar una nueva partida,
    // sincronizamos ese récord local si todavía supera el récord remoto.
    let remoteBest=0;
    try{
      const remote=await client.from("ams_fly_scores")
        .select("score")
        .eq("participant_id",participantId)
        .order("score",{ascending:false})
        .limit(1);
      if(!remote.error && remote.data?.length){
        remoteBest=Math.max(0,Number(remote.data[0].score||0));
      }
    }catch(_){}

    const scoreToPublish=Math.max(resultScore,localBest);
    const isLocalRecordSync=scoreToPublish>resultScore;
    const durationToPublish=isLocalRecordSync ? null : resultDuration;

    // Publicamos también partidas menores al récord. El ranking conserva
    // el mejor puntaje, pero la publicación más reciente actualiza el ave
    // y el mensaje que se muestran al piloto.
    const result=await client.rpc("ams_fly_submit_score",{
      p_participant_id:participantId,
      p_name:profile.name,
      p_country:profile.country,
      p_bird_id:profile.birdId,
      p_score:scoreToPublish,
      p_message:message,
      p_duration_ms:durationToPublish
    });

    if(result.error)throw result.error;

    els.submitScoreBtn.dataset.published="1";
    els.submitScoreBtn.disabled=true;
    els.scoreMessage.disabled=true;
    els.submitScoreBtn.innerHTML="✓ PUNTUACIÓN PUBLICADA";
    els.submitScoreStatus.hidden=true;
    clearPendingScore();
    lastResult=null;
    playTone(880,.12,"triangle");
    return true;
  }catch(error){
    console.error("AMS Fly: error al publicar puntuación",error);
    const raw=String(error?.message||error?.details||error?.hint||"Error desconocido de Neon Data API");
    const detail=raw.includes("auth_required")
      ?"La sesión no está disponible. La puntuación quedó guardada y se reintentará cuando la sesión esté disponible."
      :raw;

    // Nunca eliminamos el resultado pendiente por un fallo de red, sesión o
    // Data API. El juego puede volver a intentarlo más adelante.
    els.submitScoreBtn.disabled=false;
    els.scoreMessage.disabled=false;
    if(!automatic) els.submitScoreStatus.textContent="No se pudo publicar: "+detail;
    else els.submitScoreStatus.textContent="Puntuación guardada localmente. Reintentaremos la publicación automáticamente.";
    return false;
  }
}

async function loadRanking(){
  showOnly(els.rankingScreen);
  els.rankingList.innerHTML='<div class="ranking-loading">Cargando pilotos...</div>';
  if(!NEON_DATA_READY()){els.rankingList.innerHTML='<div class="ranking-empty"><strong>Ranking mundial preparado.</strong><br><span>Falta conectar el Data API de Neon.</span></div>';return}
  try{
    const client=await getPublicNeonClient();
    const result=await client.from("ams_fly_scores")
      .select("participant_id,player_name,country_code,bird_id,score,message,created_at")
      .order("score",{ascending:false})
      .order("created_at",{ascending:true})
      .limit(1000);
    if(result.error)throw result.error;

    // El ranking muestra el mejor puntaje del piloto, pero el mensaje debe ser
    // siempre el de su publicación más reciente. Así un piloto puede actualizar
    // su mensaje aunque la nueva partida tenga menos puntos.
    const bestByParticipant=new Map();
    const latestByParticipant=new Map();
    (result.data||[]).forEach(row=>{
      const key=row.participant_id||((row.player_name||"").trim().toLowerCase()+"|"+(row.country_code||""));
      const currentBest=bestByParticipant.get(key);
      const currentLatest=latestByParticipant.get(key);
      const rowTime=new Date(row.created_at).getTime();
      if(!currentLatest || rowTime>new Date(currentLatest.created_at).getTime()){
        latestByParticipant.set(key,row);
      }
      if(!currentBest || Number(row.score||0)>Number(currentBest.score||0) ||
        (Number(row.score||0)===Number(currentBest.score||0) && rowTime<new Date(currentBest.created_at).getTime())){
        bestByParticipant.set(key,row);
      }
    });

    const rows=[...bestByParticipant.values()]
      .map(row=>{
        const key=row.participant_id||((row.player_name||"").trim().toLowerCase()+"|"+(row.country_code||""));
        const latest=latestByParticipant.get(key);
        return latest ? {
          ...row,
          bird_id:latest.bird_id||row.bird_id,
          country_code:latest.country_code||row.country_code,
          player_name:latest.player_name||row.player_name,
          message:latest.message||"",
          latestCreatedAt:latest.created_at
        } : row;
      })
      .sort((a,b)=>Number(b.score||0)-Number(a.score||0) || new Date(a.created_at).getTime()-new Date(b.created_at).getTime())
      .slice(0,RANKING_LIMIT);

    if(!rows.length){els.rankingList.innerHTML='<div class="ranking-empty">Aún no hay pilotos. ¡Sé el primero!</div>';return}
    els.rankingList.innerHTML="";
    rows.forEach((row,index)=>{
      const b=getBird(row.bird_id),country=getCountry(row.country_code);
      const card=document.createElement("article");card.className="ranking-card";
      const pos=document.createElement("div");pos.className="ranking-position "+(index<3?"top":"");pos.textContent="#"+(index+1);
      const avatar=document.createElement("div");avatar.className="ranking-avatar";avatar.innerHTML=birdMarkup(b,".43");
      const main=document.createElement("div");main.className="ranking-main";
      const name=document.createElement("div");name.className="ranking-name";name.textContent=row.player_name||"Piloto";
      const countryEl=document.createElement("div");countryEl.className="ranking-country";countryEl.textContent=country.flag+" "+country.name+" · "+b.name;
      const dateEl=document.createElement("div");dateEl.className="ranking-date";dateEl.textContent="Mejor puntuación · "+formatRankingDate(row.created_at);
      const message=document.createElement("div");message.className="ranking-message";message.textContent="“"+(row.message||"Sin mensaje")+"”";
      main.append(name,countryEl,dateEl,message);
      const score=document.createElement("div");score.className="ranking-score";
      const scoreValue=document.createElement("strong");scoreValue.textContent=String(Number(row.score||0));
      const scoreLabel=document.createElement("span");scoreLabel.textContent="PUNTOS";score.append(scoreValue,scoreLabel);
      card.append(pos,avatar,main,score);els.rankingList.appendChild(card);
    });
  }catch(error){
    console.error("AMS Fly: no se pudo cargar el ranking", error);
    const detail=error?.message || "No se pudo cargar el ranking.";
    els.rankingList.innerHTML='<div class="ranking-empty"><strong>No pudimos cargar el ranking.</strong><br><span>'+escapeHtml(detail)+'</span></div>';
  }
}
async function shareResult(){
  if(!game)return;
  const cfg=getEventConfig();
  const score=Number(game.score||0);
  const url=new URL("./",window.location.href).href;
  const text="🦅 Hice "+score+" puntos en AMS Fly. ¿Puedes superarme?\n"+(cfg.title||"Participa en el evento de AMS Fly.")+"\n"+url;
  try{
    if(navigator.share){await navigator.share({title:"AMS Fly",text,url});return;}
    await navigator.clipboard.writeText(text);
    els.submitScoreStatus.textContent="✓ Resultado copiado. Pégalo en WhatsApp o donde quieras compartirlo.";
  }catch(error){
    if(error?.name!=="AbortError") els.submitScoreStatus.textContent="No pudimos abrir el menú de compartir. Copia el enlace de AMS Fly y compártelo manualmente.";
  }
}
async function ensureParticipantReady(user){
  if(!user)return false;
  await loadAccountProfile(user);
  const validName=String(profile?.name||"").trim().length>=2 && String(profile?.name||"").trim().length<=18;
  const validPhone=/^\+[1-9]\d{7,14}$/.test(String(profile?.phone||""));
  const validCountry=countries.some(c=>c.code===profile?.country);
  const validBird=birds.some(b=>b.id===profile?.birdId);
  if(!validName||!validPhone||!validCountry||!validBird)return false;
  if(NEON_DATA_READY()){
    await syncParticipantProfile(user);
  }
  saveProfile();
  return true;
}
function startWithProfile(){
  // Jugar es público. La cuenta solo se necesita para participar y publicar
  // una puntuación durante un evento activo.
  resetGame();
}
function prepareFactThenGame(){
  const fact=colombiaFacts[currentFactIndex%colombiaFacts.length];currentFactIndex=(currentFactIndex+1)%colombiaFacts.length;localStorage.setItem(FACT_INDEX_KEY,String(currentFactIndex));
  els.factText.textContent=fact;els.factSourceHint.textContent="Una curiosidad sobre Colombia antes de volver a volar.";
  showOnly(els.factScreen);
}
function setAuthStatus(target,message,error=false){
  if(!target)return;target.textContent=message;target.classList.toggle("is-error",error);
}
function fillDialSelect(selectId,value="57"){
  const select=els[selectId];if(!select)return;
  select.innerHTML=countries.map(c=>'<option value="'+c.dial+'">'+c.flag+" +"+c.dial+" · "+c.name+'</option>').join("");
  select.value=String(value||"57");
}
function fullPhone(dial,phone){
  const digits=String(phone||"").replace(/\D/g,"");
  const code=String(dial||"57").replace(/\D/g,"");
  if(!digits)return "";
  return "+"+code+digits.replace(new RegExp("^"+code),"");
}
function splitStoredName(name){
  const parts=String(name||"").trim().split(/\s+/).filter(Boolean);
  return {first:parts.shift()||"",last:parts.join(" ")};
}
async function loadAccountProfile(user){
  if(!user)return null;
  const email=String(user.email||"").toLowerCase();
  const local=safeParse(STORAGE_KEY,null);
  const pending=safeParse(PENDING_REG_KEY,null);
  let candidate=local&&local.email===email?{...local}:null;
  if(!candidate&&pending&&pending.email===email){
    candidate={...pending};
  }
  if(!candidate){
    const parsed=splitStoredName(user.name||"");
    candidate={name:String(user.name||"").trim(),firstName:parsed.first,lastName:parsed.last,country:"CO",birdId:selectedBirdId,phone:"",dial:"57",participantId:null};
  }else{
    const parts=splitStoredName(candidate.name||"");
    candidate.firstName=candidate.firstName||parts.first;
    candidate.lastName=candidate.lastName||parts.last||"";
    candidate.name=String(candidate.name||[candidate.firstName,candidate.lastName].filter(Boolean).join(" ")).trim();
  }

  // Neon es la fuente de verdad cuando ya existe un piloto. Esto permite
  // recuperar celular, ave, país y aceptación después de borrar caché,
  // cambiar de dispositivo o volver a iniciar sesión.
  const remote=await getRemoteParticipantProfile(user);
  if(remote){
    candidate={
      ...candidate,
      ...remote,
      name:remote.name||candidate.name,
      firstName:remote.firstName||candidate.firstName,
      lastName:remote.lastName||candidate.lastName,
      country:remote.country||candidate.country,
      birdId:remote.birdId||candidate.birdId,
      phone:remote.phone||candidate.phone,
      dial:remote.dial||candidate.dial,
      participantId:remote.participantId,
      prizeEligible:remote.prizeEligible
    };
  }

  profile={...candidate,email};
  selectedBirdId=profile.birdId||selectedBirdId;
  saveProfile();
  return profile;
}
function populateAccountFields(){
  const p=profile||{};
  const parts=splitStoredName(p.name||"");
  els.accountName.value=p.firstName||parts.first||"";
  els.accountLastName.value=p.lastName||parts.last||"";
  const dialDigits=String(p.dial||"57").replace(/\D/g,"");
  els.accountPhone.value=String(p.phone||"").replace(new RegExp("^\\+"+dialDigits),"");
  els.accountCountry.value=p.country||"CO";
  els.accountEmail.textContent=p.email||"";
  fillDialSelect("accountDialCode",p.dial||"57");
}
async function refreshAuthUI(){
  try{
    const user=await getCurrentAuthUser();
    const signedIn=!!user;
    els.loginFields.hidden=signedIn;
    els.registerFields.hidden=true;
    els.accountDetails.hidden=!signedIn;
    if(signedIn){
      await loadAccountProfile(user);populateAccountFields();
      els.accountTitle.textContent="Tu cuenta";
      els.accountSubtitle.textContent="Tu identidad queda vinculada a tu participación. El correo es permanente.";
      setAuthStatus(els.authStatus,"");
    }else{
      els.accountTitle.textContent="Inicia sesión";
      els.accountSubtitle.textContent="Usa tu correo y contraseña para participar en el evento y guardar tu piloto.";
      els.authEmail.value="";els.authPassword.value="";
    }
    fillDialSelect("playerDialCode","57");
    return user;
  }catch(_){
    setAuthStatus(els.authStatus,"No se pudo consultar la sesión de Neon.",true);return null;
  }
}
function showRegistrationMode(email=""){
  els.loginFields.hidden=true;els.registerFields.hidden=false;els.accountDetails.hidden=true;
  const value=(email||els.authEmail.value||els.authEmail.dataset.registrationEmail||"").trim().toLowerCase();
  if(els.registerEmail)els.registerEmail.value=value;
  if(value)els.authEmail.dataset.registrationEmail=value;
  els.registerStatus.textContent="";
  els.registerStatus.classList.remove("is-error");
  els.playerName.focus();
}
async function signInPlayer(){
  const email=(els.authEmail.value||"").trim().toLowerCase(),password=els.authPassword.value||"";
  if(!VALID_EMAIL.test(email)){setAuthStatus(els.authStatus,"Escribe un correo electrónico válido.",true);return}
  if(password.length<8||password.length>128){setAuthStatus(els.authStatus,"La contraseña debe tener entre 8 y 128 caracteres.",true);return}
  els.authSignInBtn.disabled=true;setAuthStatus(els.authStatus,"Comprobando cuenta…");
  try{
    const client=await getNeonClient();
    const result=await client.auth.signIn.email({email,password,rememberMe:true});
    if(result?.error){
      const code=String(result.error.code||"").toUpperCase();
      const message=String(result.error.message||"");
      if(code==="USER_NOT_FOUND"||code==="CREDENTIAL_ACCOUNT_NOT_FOUND"){
        showRegistrationMode(email);
        setAuthStatus(els.registerStatus,"No encontramos una cuenta con ese correo. Completa tus datos para crearla.",false);
        return;
      }
      throw Object.assign(new Error(message||"No se pudo iniciar sesión."),{code,status:result.error.status});
    }
    const user=await getCurrentAuthUser();
    if(!user)throw new Error("No se pudo recuperar la sesión después de iniciar sesión.");
    await loadAccountProfile(user);
    if(profile?.name&&profile.name.length>=2&&/^\+[1-9]\d{7,14}$/.test(String(profile.phone||""))){
      try{
        await syncParticipantProfile(user);
        saveProfile();
        localStorage.removeItem(PENDING_REG_KEY);
      }catch(syncError){
        setAuthStatus(els.accountStatus,friendlyNeonSyncError(syncError),true);
      }
    }
    populateAccountFields();
    await refreshAuthUI();
    if(readPendingScore())restorePendingResult();
  }catch(error){
    setAuthStatus(els.authStatus,friendlyAuthError(error,"No se pudo iniciar sesión. Revisa tu correo y contraseña."),true);
  }finally{
    els.authSignInBtn.disabled=false;
  }
}
async function signUpPlayer(){
  const email=(els.registerEmail?.value||els.authEmail.dataset.registrationEmail||els.authEmail.value||"").trim().toLowerCase();
  const first=(els.playerName.value||"").trim().replace(/\s+/g," ");
  const last=(els.playerLastName.value||"").trim().replace(/\s+/g," ");
  const dial=els.playerDialCode.value||"57",phone=els.playerPhone.value||"";
  const country=els.playerCountry.value||"CO";
  const password=els.registerPassword.value||"",repeat=els.registerPasswordRepeat.value||"";
  if(!VALID_EMAIL.test(email)){setAuthStatus(els.registerStatus,"Correo inválido.",true);return}
  if(first.length<2||last.length<2){setAuthStatus(els.registerStatus,"Escribe nombre y apellido.",true);return}
  if((first+" "+last).length>18){setAuthStatus(els.registerStatus,"Nombre y apellido juntos deben tener máximo 18 caracteres para el registro del piloto.",true);return}
  if(password.length<8||password.length>128){setAuthStatus(els.registerStatus,"La contraseña debe tener entre 8 y 128 caracteres.",true);return}
  if(password!==repeat){setAuthStatus(els.registerStatus,"Las contraseñas no coinciden.",true);return}
  const full=fullPhone(dial,phone);
  if(!/^\+[1-9]\d{7,14}$/.test(full)){setAuthStatus(els.registerStatus,"Escribe un celular válido con código de país.",true);return}
  localStorage.setItem(PENDING_REG_KEY,JSON.stringify({
    email,firstName:first,lastName:last,name:first+" "+last,phone:full,dial,country,birdId:selectedBirdId,participantId:null
  }));
  els.authSignUpBtn.disabled=true;setAuthStatus(els.registerStatus,"Creando tu cuenta…");
  try{
    const client=await getNeonClient();
    const result=await client.auth.signUp.email({email,password,name:first+" "+last});
    if(result?.error){
      throw Object.assign(new Error(result.error.message||"No se pudo crear la cuenta."),{
        code:result.error.code,
        status:result.error.status
      });
    }
    const user=await getCurrentAuthUser();
    if(!user){setAuthStatus(els.registerStatus,"Cuenta creada. Si Neon solicita verificar el correo, verifica y vuelve a iniciar sesión.",false);return}
    profile={email,country,birdId:selectedBirdId,name:first+" "+last,firstName:first,lastName:last,phone:full,dial,participantId:null};
    // Guardar primero localmente para no perder el registro si la Data API
    // tarda, falla temporalmente o aún no tiene aplicada la migración.
    saveProfile();
    try{
      await syncParticipantProfile(user);
    }catch(syncError){
      console.error("AMS Fly: cuenta creada, pero el piloto aún no se pudo sincronizar",syncError);
      setAuthStatus(els.registerStatus,"✓ Cuenta creada y datos guardados localmente. "+friendlyNeonSyncError(syncError),true);
      await refreshAuthUI();
      if(readPendingScore()&&restorePendingResult())return;
      navigateTo("play");
      return;
    }
    localStorage.removeItem(PENDING_REG_KEY);
    saveProfile();await refreshAuthUI();
    if(readPendingScore()&&restorePendingResult())return;
    navigateTo("play");
  }catch(error){
    const code=String(error?.code||"").toUpperCase();
    if(code==="USER_ALREADY_EXISTS"||code==="EMAIL_ALREADY_EXISTS")localStorage.removeItem(PENDING_REG_KEY);
    setAuthStatus(els.registerStatus,friendlyAuthError(error,"No se pudo crear la cuenta. Si el correo ya existe, vuelve al inicio de sesión."),true);
  }
  finally{els.authSignUpBtn.disabled=false}
}
async function syncParticipantProfile(user){
  if(!user)throw new Error("auth_required");
  if(!NEON_DATA_READY())throw new Error("neon_not_configured");
  if(!profile)throw new Error("profile_missing");
  const name=String(profile.name||"").trim();
  if(name.length<2||name.length>18)throw new Error("invalid_participant");
  const client=await getPublicNeonClient();
  const payload={
    p_name:name,
    p_country:profile.country,
    p_bird_id:profile.birdId,
    p_phone:profile.phone||null,
    p_score:0
  };
  let result=await client.rpc("ams_fly_register_participant",payload);
  if(result.error&&neonAuthRetryable(result.error)){
    await new Promise(resolve=>setTimeout(resolve,450));
    const activeUser=await getCurrentAuthUser();
    if(!activeUser||(user.id&&activeUser.id!==user.id))throw new Error("auth_required");
    result=await client.rpc("ams_fly_register_participant",payload);
  }
  if(result.error)throw result.error;
  const remote=Array.isArray(result.data)?result.data[0]:(result.data||{});
  if(!remote.participant_id)throw new Error("participant_not_confirmed");
  profile.participantId=remote.participant_id;
  profile.prizeEligible=remote.prize_eligible!==false;
}
async function saveAccount(){
  const user=await getCurrentAuthUser().catch(()=>null);
  if(!user){await refreshAuthUI();return}
  const first=(els.accountName.value||"").trim().replace(/\s+/g," ");
  const last=(els.accountLastName.value||"").trim().replace(/\s+/g," ");
  const dial=els.accountDialCode.value||"57",phone=els.accountPhone.value||"";
  if(first.length<2||last.length<2){setAuthStatus(els.accountStatus,"Escribe nombre y apellido.",true);return}
  if((first+" "+last).length>18){setAuthStatus(els.accountStatus,"Nombre y apellido juntos deben tener máximo 18 caracteres para el piloto.",true);return}
  const full=fullPhone(dial,phone);
  if(!/^\+[1-9]\d{7,14}$/.test(full)){setAuthStatus(els.accountStatus,"Escribe un celular válido con código de país.",true);return}
  profile={
    ...profile,
    email:String(user.email||"").toLowerCase(),
    name:first+" "+last,
    firstName:first,
    lastName:last,
    dial,
    phone:full,
    country:els.accountCountry.value||"CO",
    birdId:profile?.birdId||selectedBirdId
  };
  saveProfile();
  renderBirds();
  setAuthStatus(els.accountStatus,"Guardado en este dispositivo. Sincronizando con Neon…");
  try{
    await syncParticipantProfile(user);
    saveProfile();
    localStorage.removeItem(PENDING_REG_KEY);
    setAuthStatus(els.accountStatus,"✓ Datos guardados y sincronizados.");
  }catch(error){
    console.error("AMS Fly: no se pudo sincronizar el perfil",error);
    setAuthStatus(els.accountStatus,"✓ Datos guardados en este dispositivo. "+friendlyNeonSyncError(error),true);
  }
}
async function signOutPlayer(){
  try{const client=await getNeonClient();await client.auth.signOut();profile=null;localStorage.removeItem(STORAGE_KEY);renderHomeBird();await refreshAuthUI();navigateTo("play")}
  catch(error){setAuthStatus(els.accountStatus,error?.message||"No se pudo cerrar sesión.",true)}
}
function bootHome(){
  loadProfile();hydrateStats();initCountries();renderBirds();renderHomeBird();applyEventConfig();
  fillDialSelect("playerDialCode","57");fillDialSelect("accountDialCode","57");
  if(NEON_DATA_READY()) loadRemoteEventConfig();
  refreshAuthUI();updateLargeScreenRecommendation();
  setTimeout(()=>els.loadingScreen.classList.add("is-gone"),500);
  if(restorePendingResult())return
  if(soundOn){startMusic();window.addEventListener("pointerdown",unlockMenuMusic,{once:true,passive:true,capture:true});window.addEventListener("keydown",unlockMenuMusic,{once:true})}
}
function navigateTo(target){
  const eventScreen=document.getElementById("amsFlyEventScreen");
  const map={play:els.homeScreen,event:eventScreen,account:els.profileScreen,ranking:els.rankingScreen};
  const screen=map[target]||els.homeScreen;
  if(target==="event"){document.querySelectorAll(".bottom-nav-item").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.nav==="event"));openEventScreen();return}
  if(target==="ranking"){document.querySelectorAll(".bottom-nav-item").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.nav==="ranking"));loadRanking();return}
  if(target==="account"){refreshAuthUI();showOnly(els.profileScreen)}
  else {showOnly(screen);if(target==="play"){renderBirds();renderHomeBird();if(soundOn)startMusic();}}
  document.querySelectorAll(".bottom-nav-item").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.nav===target));
}
let birdSyncQueue=Promise.resolve();
els.birdGrid?.addEventListener("click",event=>{
  const button=event.target.closest("[data-bird]");
  if(!button || !els.birdGrid.contains(button))return;
  const birdId=button.dataset.bird;
  if(!getBird(birdId))return;
  selectedBirdId=birdId;
  if(profile){
    profile.birdId=birdId;
    saveProfile();

    // La selección de ave es parte del perfil del piloto, no solo del
    // navegador. Serializamos los cambios para que dos clics rápidos no
    // puedan terminar guardando el ave equivocada en Neon.
    birdSyncQueue=birdSyncQueue.then(async()=>{
      const user=await getCurrentAuthUser().catch(()=>null);
      if(!user || !NEON_DATA_READY())return;
      try{
        await syncParticipantProfile(user);
        saveProfile();
      }catch(error){
        console.error("AMS Fly: no se pudo sincronizar el ave seleccionada",error);
        setAuthStatus(els.accountStatus,"El ave quedó seleccionada en este dispositivo, pero no pudimos sincronizarla con Neon todavía.",true);
      }
    }).catch(()=>{});
  }
  renderBirds();
  playTone(660,.06,"triangle");
});

els.startBtn?.addEventListener("click",()=>{
  startWithProfile();
});

els.factContinueBtn?.addEventListener("click",()=>{
  startWithProfile();
});

els.pauseBtn?.addEventListener("click",()=>{
  if(!game?.running)return;
  if(game.paused)return;
  game.paused=true;
  cancelAnimationFrame(raf);
  els.pauseScore.textContent=game.score+" puntos";
  showOnly(els.pauseScreen);
});

els.resumeBtn?.addEventListener("click",()=>{
  if(!game?.running)return;
  game.paused=false;
  game.last=performance.now();
  showOnly(els.gameScreen);
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
});

els.quitBtn?.addEventListener("click",()=>{
  if(!game?.running||!game.paused)return;
  if(!window.confirm("Si vuelves al menú, perderás los puntos de esta partida. ¿Quieres salir?"))return;
  game.running=false;
  game.paused=false;
  cancelAnimationFrame(raf);
  stopMusic();
  navigateTo("play");
});

els.againBtn?.addEventListener("click",()=>{
  startWithProfile();
});

els.submitScoreBtn?.addEventListener("click",()=>publishScore({automatic:false}));
els.scoreMessage?.addEventListener("input",()=>{
  if(!lastResult)return;
  lastResult={...lastResult,message:String(els.scoreMessage.value||"").slice(0,90)};
  savePendingScore(lastResult);
});
els.shareResultBtn?.addEventListener("click",shareResult);

document.querySelectorAll(".bottom-nav-item[data-nav]").forEach(btn=>btn.addEventListener("click",()=>navigateTo(btn.dataset.nav)));
els.accountBtn?.addEventListener("click",()=>navigateTo("account"));
els.authSignInBtn?.addEventListener("click",()=>signInPlayer());
els.authSignUpBtn?.addEventListener("click",()=>signUpPlayer());
els.saveAccountBtn?.addEventListener("click",()=>saveAccount());
els.authSignOutBtn?.addEventListener("click",()=>signOutPlayer());

els.authCreateAccountBtn?.addEventListener("click",()=>{
  const email=(els.authEmail.value||"").trim().toLowerCase();
  if(!VALID_EMAIL.test(email)){
    setAuthStatus(els.authStatus,"Escribe primero un correo válido para crear la cuenta.",true);
    els.authEmail.focus();
    return;
  }
  showRegistrationMode(email);
  setAuthStatus(els.registerStatus,"Completa los datos para crear tu cuenta.",false);
});
els.backToLoginBtn?.addEventListener("click",()=>{
  els.registerFields.hidden=true;
  els.loginFields.hidden=false;
  els.accountDetails.hidden=true;
  els.authPassword.value="";
  els.authEmail.dataset.registrationEmail="";
  els.registerStatus.textContent="";
  els.registerStatus.classList.remove("is-error");
  els.authEmail.focus();
});
els.rankingHeaderBtn?.addEventListener("click",()=>loadRanking());
els.backBtn?.addEventListener("click",()=>navigateTo("play"));
els.rankingBackBtn?.addEventListener("click",()=>navigateTo("play"));
els.rankingRefreshBtn?.addEventListener("click",loadRanking);
window.addEventListener("ams-fly-event-updated",event=>{if(!event.detail)return;saveEventConfig({...DEFAULT_EVENT,...event.detail});applyEventConfig()});
els.soundBtn.addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem("amsFlySound",soundOn?"1":"0");els.soundBtn.textContent=soundOn?"♪":"×";if(soundOn){playTone(600,.05);startMusic()}else stopMusic()});
function action(e){if(["BUTTON","INPUT","SELECT"].includes(e.target?.tagName))return;e.preventDefault();if(els.gameScreen.hidden)return;flap()}
els.gameScreen.addEventListener("pointerdown",action,{passive:false});
window.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(!els.gameScreen.hidden)flap()}if(e.code==="Escape"&&game?.running&&!game.paused){els.pauseBtn.click()}});
window.addEventListener("resize",()=>{updateLargeScreenRecommendation();if(!els.gameScreen.hidden){resizeCanvas();if(game?.bird)game.bird.x=clamp(game.bird.x,50,window.innerWidth*.32)}});
window.addEventListener("visibilitychange",()=>{if(document.hidden&&game?.running&&!game.paused){game.paused=true;cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen)}});
els.soundBtn.textContent=soundOn?"♪":"×";
bootHome();
})();