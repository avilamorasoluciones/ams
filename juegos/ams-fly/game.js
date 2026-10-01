(() => {
"use strict";

const STORAGE_KEY = "amsFlyProfileV1";
const STATS_KEY = "amsFlyStatsV1";
const FACT_INDEX_KEY = "amsFlyFactIndexV1";
const RANKING_API = "";
const RANKING_LIMIT = 50;
const EVENT_API = "";
const EVENT_TOKEN_STORAGE = "amsFlyAdminTokenV1";
const EVENT_CONFIG_KEY = "amsFlyEventConfigV1";
const LEADS_KEY = "amsFlyLeadsV1";
const DEFAULT_EVENT = {
  active:true,
  badge:"🏆 EVENTO ESPECIAL 2026",
  title:"¡Gana una Landing Page Gratis!",
  desc:"Vuela, consigue el mayor puntaje y participa por el desarrollo de una Landing Page.",
  cta:"VER DETALLES DEL EVENTO",
  prizeTitle:"Desarrollo de Landing Page 100% GRATIS",
  prizeDesc:"El ganador recibe el desarrollo de una Landing Page responsive para su negocio.",
  conditionTitle:"Publicación y alojamiento",
  conditionDesc:"La publicación y gestión del sitio se contrata por separado según las condiciones vigentes de Avila Mora Soluciones.",
  waTemplate:"Hola {name}, te escribimos de Avila Mora Soluciones sobre tu récord de {score} puntos en {event}."
};

const countries = [
  {code:"CO",name:"Colombia",flag:"🇨🇴",bird:"Cóndor de los Andes"},
  {code:"VE",name:"Venezuela",flag:"🇻🇪",bird:"Turpial venezolano"},
  {code:"EC",name:"Ecuador",flag:"🇪🇨",bird:"Cóndor de los Andes"},
  {code:"US",name:"Estados Unidos",flag:"🇺🇸",bird:"Águila calva"},
  {code:"MX",name:"México",flag:"🇲🇽",bird:"Águila real"},
  {code:"AR",name:"Argentina",flag:"🇦🇷",bird:"Hornero"},
  {code:"CL",name:"Chile",flag:"🇨🇱",bird:"Cóndor de los Andes"},
  {code:"PE",name:"Perú",flag:"🇵🇪",bird:"Gallito de las rocas"},
  {code:"BR",name:"Brasil",flag:"🇧🇷",bird:"Sabiá-laranjeira"},
  {code:"PA",name:"Panamá",flag:"🇵🇦",bird:"Águila harpía"}
];

const birds = [
  {id:"condor-co",country:"CO",name:"Cóndor de los Andes",short:"Colombia",a:"#111827",b:"#475569",c:"#f8fafc",d:"#111827",info:"El cóndor de los Andes es el ave nacional de Colombia y uno de sus símbolos naturales más reconocibles."},
  {id:"turpial",country:"VE",name:"Turpial venezolano",short:"Venezuela",a:"#f59e0b",b:"#111827",c:"#fbbf24",d:"#f59e0b",info:"El turpial es el ave nacional de Venezuela y destaca por su contraste de amarillo intenso y negro."},
  {id:"condor-ec",country:"EC",name:"Cóndor de los Andes",short:"Ecuador",a:"#1f2937",b:"#64748b",c:"#f8fafc",d:"#111827",info:"El cóndor de los Andes también es un símbolo nacional de Ecuador y está asociado a sus paisajes andinos."},
  {id:"eagle-us",country:"US",name:"Águila calva",short:"Estados Unidos",a:"#f8fafc",b:"#64748b",c:"#f8fafc",d:"#f59e0b",info:"El águila calva es el ave nacional y uno de los símbolos más conocidos de Estados Unidos."},
  {id:"eagle-mx",country:"MX",name:"Águila real",short:"México",a:"#78350f",b:"#d97706",c:"#92400e",d:"#facc15",info:"El águila real ocupa un lugar central en la identidad mexicana y aparece en el escudo nacional."},
  {id:"hornero",country:"AR",name:"Hornero",short:"Argentina",a:"#92400e",b:"#b45309",c:"#f59e0b",d:"#78350f",info:"El hornero es el ave nacional de Argentina y es famoso por construir nidos de barro con forma de horno."},
  {id:"condor-cl",country:"CL",name:"Cóndor de los Andes",short:"Chile",a:"#1e293b",b:"#64748b",c:"#f8fafc",d:"#111827",info:"El cóndor forma parte de los símbolos naturales más representativos de Chile y de la cordillera de los Andes."},
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
  "loadingScreen","factLoading","homeScreen","profileScreen","factScreen","gameScreen","pauseScreen","gameOverScreen",
  "homeBest","homeGames","startBtn","profileForm","playerName","playerCountry","playerPhone","birdGrid","selectedBirdInfo","profileError",
  "factTitle","factText","factSourceHint","factContinueBtn","gameCanvas","scoreValue","difficultyValue","pauseBtn","gameStartHint",
  "pauseScore","resumeBtn","quitBtn","resultBird","resultEyebrow","resultTitle","finalScore","resultBest","resultGames","newRecord",
  "againBtn","changePilotBtn","soundBtn","homeBirdArt","rankingBtn","rankingFromResultBtn","rankingBackBtn","rankingRefreshBtn","rankingList","rankingStatus","scoreMessage","submitScoreBtn","submitScoreStatus","rankingScreen"
].forEach(id => els[id] = document.getElementById(id));

const ctx = els.gameCanvas.getContext("2d", {alpha:false});
let profile = null;
let stats = {games:0,best:0};
let selectedBirdId = "condor-co";
let currentFactIndex = Number(localStorage.getItem(FACT_INDEX_KEY) || 0);
let soundOn = localStorage.getItem("amsFlySound") !== "0";
let audioCtx = null;
let musicTimer = 0;
let musicStep = 0;
let game = null;
let raf = 0;
let lastStage = 0;
const stages = [
  {at:0,name:"CIELO ANDINO",top:"#07091a",mid:"#111536",bottom:"#17102b",pipe:"#6d42c9",glow:"#8b5cf6",particle:"#c4b5fd"},
  {at:25,name:"ATARDECER COLOMBIANO",top:"#211329",mid:"#6b294d",bottom:"#1b1230",pipe:"#e16b8c",glow:"#f472b6",particle:"#facc15"},
  {at:50,name:"SELVA VIVA",top:"#031b1b",mid:"#075e54",bottom:"#081f26",pipe:"#16a085",glow:"#34d399",particle:"#facc15"},
  {at:75,name:"CIELO NEÓN",top:"#07102d",mid:"#1e2a78",bottom:"#2a1050",pipe:"#22d3ee",glow:"#22d3ee",particle:"#a78bfa"},
  {at:100,name:"ÓRBITA AMS",top:"#02030b",mid:"#11133a",bottom:"#250d40",pipe:"#a855f7",glow:"#ec4899",particle:"#fff"}
];


function getEventConfig(){
  return safeParse(EVENT_CONFIG_KEY, DEFAULT_EVENT);
}
function saveEventConfig(config){
  localStorage.setItem(EVENT_CONFIG_KEY, JSON.stringify(config));
}
function getLocalLeads(){
  return safeParse(LEADS_KEY, []);
}
function saveLocalLead(lead){
  const rows=getLocalLeads();
  const key=(lead.name||"").toLowerCase()+"|"+(lead.country||"");
  const existing=rows.findIndex(x=>((x.name||"").toLowerCase()+"|"+(x.country||""))===key);
  if(existing>=0){
    rows[existing]={...rows[existing],...lead,score:Math.max(Number(rows[existing].score||0),Number(lead.score||0)),updatedAt:new Date().toISOString()};
  }else rows.unshift({...lead,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  localStorage.setItem(LEADS_KEY,JSON.stringify(rows));
}
function eventTemplate(template,lead){
  return String(template||"").replaceAll("{name}",lead.name||"").replaceAll("{score}",String(lead.score||0)).replaceAll("{event}",getEventConfig().title||"AMS Fly");
}
function eventPhoneUrl(phone,name,score){
  let digits=String(phone||"").replace(/\\D/g,"");
  if(digits.length===10&&digits.startsWith("3"))digits="57"+digits;
  if(digits.length<8)return "";
  return "https://wa.me/"+digits+"?text="+encodeURIComponent(eventTemplate(getEventConfig().waTemplate,{name,score}));
}
function applyEventConfig(){
  const cfg=getEventConfig();
  let banner=document.getElementById("amsFlyEventBanner");
  if(!banner){
    banner=document.createElement("section");banner.id="amsFlyEventBanner";banner.className="event-banner-card";
    const home=els.homeScreen;const stats=home.querySelector(".home-stats");
    home.insertBefore(banner,stats||home.querySelector("#startBtn"));
  }
  banner.hidden=!cfg.active;
  banner.innerHTML='<span class="event-badge">'+cfg.badge+'</span><h3>'+cfg.title+'</h3><p>'+cfg.desc+'</p><button id="amsFlyEventOpen" class="event-cta-button" type="button">'+cfg.cta+' <span>→</span></button>';
  banner.querySelector("#amsFlyEventOpen").onclick=()=>openEventScreen();
}
function openEventScreen(){
  let screen=document.getElementById("amsFlyEventScreen");
  if(!screen){
    screen=document.createElement("section");screen.id="amsFlyEventScreen";screen.className="screen app-screen";screen.hidden=true;
    screen.innerHTML='<div class="section-heading"><span class="eyebrow">AMS FLY · EVENTO</span><h2 id="eventTitle"></h2><p id="eventDesc"></p></div><div class="event-details-card"><div class="event-detail-block"><span class="event-badge">🏆 PREMIO</span><h3 id="eventPrizeTitle"></h3><p id="eventPrizeDesc"></p></div><div class="event-detail-block"><span class="event-badge">📋 CONDICIONES</span><h3 id="eventConditionTitle"></h3><p id="eventConditionDesc"></p></div><button id="eventJoinButton" class="primary-button" type="button">PARTICIPAR Y VOLAR <span>✦</span></button><button id="eventBackButton" class="secondary-button" type="button">← VOLVER</button></div>';
    document.querySelector(".app-shell").insertBefore(screen,els.profileScreen);
    screen.querySelector("#eventBackButton").onclick=()=>showOnly(els.homeScreen);
    screen.querySelector("#eventJoinButton").onclick=()=>{if(profile)prepareFactThenGame();else showOnly(els.profileScreen)};
  }
  const cfg=getEventConfig();
  screen.querySelector("#eventTitle").textContent=cfg.title;
  screen.querySelector("#eventDesc").textContent=cfg.desc;
  screen.querySelector("#eventPrizeTitle").textContent=cfg.prizeTitle;
  screen.querySelector("#eventPrizeDesc").textContent=cfg.prizeDesc;
  screen.querySelector("#eventConditionTitle").textContent=cfg.conditionTitle;
  screen.querySelector("#eventConditionDesc").textContent=cfg.conditionDesc;
  showOnly(screen);
  screen.hidden=false;
}
function openEventAdmin(){
  let panel=document.getElementById("amsFlyAdminPanel");
  if(!panel){
    panel=document.createElement("section");panel.id="amsFlyAdminPanel";panel.className="admin-panel";
    panel.innerHTML='<div class="admin-card"><div class="admin-head"><div><span class="eyebrow">AMS FLY · GESTIÓN</span><h2>Gestión del evento</h2></div><button id="adminClose" class="secondary-button" type="button">Cerrar</button></div><p class="admin-note">La configuración local sirve para pruebas. Para gestión real multi-dispositivo usa EVENT_API con el servidor seguro de Neon.</p><label>Token de administrador<input id="adminToken" type="password" autocomplete="off" placeholder="Token del servidor"></label><div class="admin-grid"><label>Evento activo<input id="cfgActive" type="checkbox"></label><label>Badge<input id="cfgBadge" type="text"></label><label>Título<input id="cfgTitle" type="text"></label><label>CTA<input id="cfgCta" type="text"></label></div><label>Descripción<textarea id="cfgDesc"></textarea></label><label>Premio - título<input id="cfgPrizeTitle" type="text"></label><label>Premio - descripción<textarea id="cfgPrizeDesc"></textarea></label><label>Condición - título<input id="cfgConditionTitle" type="text"></label><label>Condición - descripción<textarea id="cfgConditionDesc"></textarea></label><label>Plantilla WhatsApp<textarea id="cfgWaTemplate"></textarea></label><div class="admin-actions"><button id="adminSave" class="primary-button" type="button">GUARDAR CONFIGURACIÓN</button><button id="adminLoadRemote" class="secondary-button" type="button">CARGAR DESDE SERVIDOR</button><button id="adminExport" class="secondary-button" type="button">EXPORTAR PARTICIPANTES CSV</button></div><p id="adminStatus" class="submit-status"></p><div id="adminParticipants" class="admin-participants"></div></div>';
    document.body.appendChild(panel);
    panel.querySelector("#adminClose").onclick=()=>panel.remove();
    panel.querySelector("#adminSave").onclick=saveAdminConfig;
    panel.querySelector("#adminLoadRemote").onclick=loadRemoteEventConfig;
    panel.querySelector("#adminExport").onclick=exportLocalLeads;
  }
  const cfg=getEventConfig(), token=sessionStorage.getItem(EVENT_TOKEN_STORAGE)||"";
  panel.querySelector("#adminToken").value=token;
  panel.querySelector("#cfgActive").checked=!!cfg.active;
  panel.querySelector("#cfgBadge").value=cfg.badge;panel.querySelector("#cfgTitle").value=cfg.title;panel.querySelector("#cfgCta").value=cfg.cta;panel.querySelector("#cfgDesc").value=cfg.desc;
  panel.querySelector("#cfgPrizeTitle").value=cfg.prizeTitle;panel.querySelector("#cfgPrizeDesc").value=cfg.prizeDesc;panel.querySelector("#cfgConditionTitle").value=cfg.conditionTitle;panel.querySelector("#cfgConditionDesc").value=cfg.conditionDesc;panel.querySelector("#cfgWaTemplate").value=cfg.waTemplate;
  renderAdminParticipants();
}
function saveAdminConfig(){
  const p=document.getElementById("amsFlyAdminPanel"),cfg={active:p.querySelector("#cfgActive").checked,badge:p.querySelector("#cfgBadge").value.trim()||DEFAULT_EVENT.badge,title:p.querySelector("#cfgTitle").value.trim()||DEFAULT_EVENT.title,cta:p.querySelector("#cfgCta").value.trim()||DEFAULT_EVENT.cta,desc:p.querySelector("#cfgDesc").value.trim()||DEFAULT_EVENT.desc,prizeTitle:p.querySelector("#cfgPrizeTitle").value.trim()||DEFAULT_EVENT.prizeTitle,prizeDesc:p.querySelector("#cfgPrizeDesc").value.trim()||DEFAULT_EVENT.prizeDesc,conditionTitle:p.querySelector("#cfgConditionTitle").value.trim()||DEFAULT_EVENT.conditionTitle,conditionDesc:p.querySelector("#cfgConditionDesc").value.trim()||DEFAULT_EVENT.conditionDesc,waTemplate:p.querySelector("#cfgWaTemplate").value.trim()||DEFAULT_EVENT.waTemplate};
  saveEventConfig(cfg);sessionStorage.setItem(EVENT_TOKEN_STORAGE,p.querySelector("#adminToken").value.trim());applyEventConfig();openEventScreen();showOnly(els.homeScreen);
}
function renderAdminParticipants(){
  const p=document.getElementById("amsFlyAdminPanel");if(!p)return;
  const rows=getLocalLeads().sort((a,b)=>Number(b.score||0)-Number(a.score||0));
  p.querySelector("#adminParticipants").innerHTML=rows.length?rows.map((x,i)=>'<div class="admin-participant"><strong>#'+(i+1)+' '+String(x.name||"Piloto").replace(/[<>&]/g,"")+'</strong><span>'+getCountry(x.country).name+' · '+getBird(x.birdId).name+' · '+Number(x.score||0)+' pts</span><span>'+((x.phone||"Sin WhatsApp"))+'</span>'+(x.phone?'<a href="'+eventPhoneUrl(x.phone,x.name,x.score)+'" target="_blank" rel="noopener">WhatsApp ↗</a>':"")+'</div>').join(""):'<p class="admin-note">Todavía no hay participantes guardados en este dispositivo.</p>';
}
async function loadRemoteEventConfig(){
  const p=document.getElementById("amsFlyAdminPanel"),status=p.querySelector("#adminStatus");
  if(!EVENT_API){status.textContent="No hay EVENT_API configurada todavía. La gestión local está disponible para pruebas.";return}
  try{const res=await fetch(EVENT_API+"/event");if(!res.ok)throw new Error();const cfg=await res.json();saveEventConfig({...DEFAULT_EVENT,...cfg});applyEventConfig();status.textContent="✓ Configuración cargada desde servidor."}catch(_){status.textContent="No se pudo cargar la configuración remota."}
}
function exportLocalLeads(){
  const rows=getLocalLeads();if(!rows.length)return;
  const header="Nombre,País,Ave,Puntaje,WhatsApp,Mensaje,Fecha\n";
  const csv=header+rows.map(x=>[x.name,x.country,x.birdId,x.score,x.phone||"",x.message||"",x.updatedAt||x.createdAt||""].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="ams-fly-participantes.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
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
function renderHomeBird(){
  if(!els.homeBirdArt) return;
  const bird=getBird(profile?.birdId || selectedBirdId || "condor-co");
  els.homeBirdArt.innerHTML=birdMarkup(bird,"1.25");
}
function showOnly(target){
  [els.homeScreen,els.profileScreen,els.factScreen,els.gameScreen,els.pauseScreen,els.gameOverScreen,els.rankingScreen].forEach(x=>x.hidden=true);
  ["amsFlyEventScreen","amsFlyAdminPanel"].forEach(id=>{const x=document.getElementById(id);if(x)x.hidden=true;});
  target.hidden=false;
}
function hydrateStats(){
  stats=safeParse(STATS_KEY,{games:0,best:0});
  els.homeBest.textContent=stats.best||0;els.homeGames.textContent=stats.games||0;
}
function initCountries(){
  els.playerCountry.innerHTML=countries.map(c=>'<option value="'+c.code+'">'+c.flag+' '+c.name+'</option>').join("");
  els.playerCountry.value=profile?.country || "CO";
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
  if(profile?.name && getBird(profile.birdId)){selectedBirdId=profile.birdId}
  else profile=null;
}
function playTone(freq=440,duration=.08,type="sine"){
  if(!soundOn)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    const now=audioCtx.currentTime;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.045,now+.012);
    g.gain.exponentialRampToValueAtTime(.001,now+duration);
    o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+duration+.02);
  }catch(_){}
}
function stopMusic(){
  if(musicTimer){clearTimeout(musicTimer);musicTimer=0}
}
function startMusic(){
  if(!soundOn||musicTimer)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    const notes=[196,220,247,262,247,220,196,165];
    const tick=()=>{
      if(!soundOn){stopMusic();return}
      try{
        const now=audioCtx.currentTime;
        const o=audioCtx.createOscillator(),g=audioCtx.createGain();
        o.type="triangle";o.frequency.setValueAtTime(notes[musicStep%notes.length],now);
        g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.012,now+.025);
        g.gain.exponentialRampToValueAtTime(.0001,now+.36);
        o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+.38);
      }catch(_){}
      musicStep++;
      musicTimer=setTimeout(tick,420);
    };
    tick();
  }catch(_){}
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
function currentStage(score){let stage=stages[0];for(const item of stages){if(score>=item.at)stage=item}return stage}
function showStageBanner(stage){
  let banner=document.getElementById("stageBanner");
  if(!banner){banner=document.createElement("div");banner.id="stageBanner";banner.className="stage-banner";els.gameScreen.appendChild(banner)}
  banner.textContent=stage.name+" · "+stage.at+" PUNTOS";
  banner.classList.remove("show");void banner.offsetWidth;banner.classList.add("show");
  clearTimeout(banner._timer);banner._timer=setTimeout(()=>banner.classList.remove("show"),1800);
}
function playStageSound(stage){
  const notes=stage.at>=100?[392,523,659,784]:stage.at>=75?[330,440,554,660]:stage.at>=50?[294,392,494,587]:[262,330,392,523];
  notes.forEach((note,index)=>setTimeout(()=>playTone(note,.11,"triangle"),index*70));
}
function updateStage(){
  const stage=currentStage(game.score);
  if(stage.at!==lastStage){
    lastStage=stage.at;
    if(stage.at>0){showStageBanner(stage);playStageSound(stage)}
  }
  game.stage=stage;
}
function difficultyFor(score){
  return 1 + Math.min(5,Math.floor(score/12)*.28);
}
function resetGame(){
  resizeCanvas();
  const w=window.innerWidth,h=window.innerHeight;
  const bird=getBird(profile?.birdId||selectedBirdId);
  game={
    running:true,paused:false,started:false,score:0,time:0,last:performance.now(),spawn:0,
    bird:{x:Math.max(75,w*.22),y:h*.48,vy:0,r:18},
    pipes:[],bird,
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
  const body=ctx.createLinearGradient(-22,-18,22,18);body.addColorStop(0,game.bird.a);body.addColorStop(1,game.bird.b);ctx.fillStyle=body;
  ctx.beginPath();ctx.ellipse(0,0,24,18,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.32)";ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle=game.bird.c;ctx.beginPath();ctx.ellipse(-8,7,16,9,-.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.bird.d;ctx.beginPath();ctx.moveTo(20,-2);ctx.lineTo(39,4);ctx.lineTo(20,8);ctx.closePath();ctx.fill();
  ctx.fillStyle="#111827";ctx.beginPath();ctx.arc(12,-9,4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(13,-10,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.bird.c;ctx.beginPath();ctx.moveTo(-18,-2);ctx.quadraticCurveTo(-39,-22,-31,5);ctx.quadraticCurveTo(-24,12,-11,7);ctx.closePath();ctx.fill();
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
function saveCurrentLead(message=""){
  if(!profile||!game)return;
  saveLocalLead({id:"lead_"+Date.now(),name:profile.name,country:profile.country,birdId:profile.birdId,score:game.score,message,phone:profile.phone||"",date:new Date().toISOString()});
}
function publishScore(){
  if(!profile||!game)return;
  const message=(els.scoreMessage.value||"").trim().slice(0,90);
  if(!RANKING_API){els.submitScoreStatus.textContent="El ranking está preparado; falta conectar el endpoint seguro con Neon.";return}
  els.submitScoreBtn.disabled=true;els.submitScoreStatus.textContent="Publicando...";
  fetch(RANKING_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:profile.name,country:profile.country,birdId:profile.birdId,score:game.score,message})})
    .then(response=>{if(!response.ok)throw new Error("No se pudo publicar");els.submitScoreStatus.textContent="¡Puntuación publicada!";playTone(880,.12,"triangle")})
    .catch(()=>{els.submitScoreStatus.textContent="No se pudo publicar ahora. Tu récord local sigue guardado."})
    .finally(()=>{els.submitScoreBtn.disabled=false});
}
function loadRanking(){
  showOnly(els.rankingScreen);
  els.rankingList.innerHTML='<div class="ranking-loading">Cargando pilotos...</div>';
  if(!RANKING_API){els.rankingList.innerHTML='<div class="ranking-empty"><strong>Ranking mundial preparado.</strong><br><span>Falta conectar el endpoint seguro con Neon.</span></div>';return}
  fetch(RANKING_API+"?limit="+RANKING_LIMIT,{headers:{"Accept":"application/json"}})
    .then(response=>{if(!response.ok)throw new Error("Ranking no disponible");return response.json()})
    .then(data=>{
      const rows=Array.isArray(data)?data:(data.rows||[]);
      if(!rows.length){els.rankingList.innerHTML='<div class="ranking-empty">Aún no hay pilotos. ¡Sé el primero!</div>';return}
      els.rankingList.innerHTML="";
      rows.slice(0,RANKING_LIMIT).forEach((row,index)=>{
        const b=getBird(row.birdId),country=getCountry(row.country);
        const card=document.createElement("article");card.className="ranking-card";
        const pos=document.createElement("div");pos.className="ranking-position "+(index<3?"top":"");pos.textContent="#"+(index+1);
        const avatar=document.createElement("div");avatar.className="ranking-avatar";avatar.innerHTML=birdMarkup(b,".43");
        const main=document.createElement("div");main.className="ranking-main";
        const name=document.createElement("div");name.className="ranking-name";name.textContent=row.name||"Piloto";
        const countryEl=document.createElement("div");countryEl.className="ranking-country";countryEl.textContent=country.flag+" "+country.name+" · "+b.name;
        const message=document.createElement("div");message.className="ranking-message";message.textContent="“"+(row.message||"Sin mensaje")+"”";
        main.append(name,countryEl,message);
        const score=document.createElement("div");score.className="ranking-score";
        const scoreValue=document.createElement("strong");scoreValue.textContent=String(Number(row.score||0));
        const scoreLabel=document.createElement("span");scoreLabel.textContent="PUNTOS";score.append(scoreValue,scoreLabel);
        card.append(pos,avatar,main,score);els.rankingList.appendChild(card);
      });
    })
    .catch(()=>{els.rankingList.innerHTML='<div class="ranking-empty">No pudimos cargar el ranking en este momento.</div>';});
}
function endGame(){
  if(!game?.running)return;
  game.running=false;stopMusic();cancelAnimationFrame(raf);
  stats.games++;const previous=stats.best;stats.best=Math.max(stats.best,game.score);saveStats();hydrateStats();
  const isNew=game.score>previous && game.score>0;
  els.finalScore.textContent=game.score;els.resultBest.textContent=stats.best;els.resultGames.textContent=stats.games;els.newRecord.hidden=!isNew;
  els.resultTitle.textContent=game.score>=80?"Vuelo legendario.":game.score>=40?"¡Muy buen vuelo!":game.score>=15?"Vas tomando altura.":"El cielo todavía tiene revancha.";
  els.resultEyebrow.textContent=isNew?"NUEVO RÉCORD":"VUELO TERMINADO";
  els.resultBird.innerHTML=birdMarkup(game.bird,".9");
  els.scoreMessage.value="";els.submitScoreStatus.textContent="";
  showOnly(els.gameOverScreen);playTone(isNew?880:180,.16,isNew?"triangle":"sawtooth");
}
function startWithProfile(){
  resetGame();
}
function prepareFactThenGame(){
  const fact=colombiaFacts[currentFactIndex%colombiaFacts.length];currentFactIndex=(currentFactIndex+1)%colombiaFacts.length;localStorage.setItem(FACT_INDEX_KEY,String(currentFactIndex));
  els.factText.textContent=fact;els.factSourceHint.textContent="Una curiosidad sobre Colombia antes de volver a volar.";
  showOnly(els.factScreen);
}
function submitProfile(e){
  e.preventDefault();
  const name=els.playerName.value.trim().replace(/\s+/g," ");
  if(name.length<2){els.profileError.textContent="Escribe al menos 2 caracteres para tu nombre.";els.profileError.hidden=false;els.playerName.focus();return}
  profile={name:name.slice(0,18),country:els.playerCountry.value,birdId:selectedBirdId,phone:(els.playerPhone?.value||"").trim().slice(0,30)};
  saveProfile();els.profileError.hidden=true;prepareFactThenGame();
}
function bootHome(){
  loadProfile();hydrateStats();initCountries();renderBirds();renderHomeBird();applyEventConfig();
  if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;if(els.playerPhone)els.playerPhone.value=profile.phone||"";selectedBirdId=profile.birdId;renderBirds()}
  els.homeBirdArt.innerHTML=birdMarkup(getBird(selectedBirdId),".95");
  setTimeout(()=>els.loadingScreen.classList.add("is-gone"),500);
}
els.rankingBtn.addEventListener("click",loadRanking);
els.rankingFromResultBtn.addEventListener("click",loadRanking);
els.rankingBackBtn.addEventListener("click",()=>showOnly(els.homeScreen));
els.rankingRefreshBtn.addEventListener("click",loadRanking);
els.submitScoreBtn.addEventListener("click",()=>{saveCurrentLead((els.scoreMessage.value||"").trim().slice(0,90));publishScore();});
els.birdGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-bird]");if(!btn)return;selectedBirdId=btn.dataset.bird;renderBirds();playTone(350,.04)});
els.startBtn.addEventListener("click",()=>{playTone(440,.07);startMusic();if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;selectedBirdId=profile.birdId;renderBirds()}showOnly(els.profileScreen)});
els.profileForm.addEventListener("submit",submitProfile);
els.factContinueBtn.addEventListener("click",()=>{playTone(560,.05);startMusic();startWithProfile()});
els.pauseBtn.addEventListener("click",()=>{if(!game?.running)return;game.paused=true;stopMusic();cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen);playTone(300,.05)});
els.resumeBtn.addEventListener("click",()=>{if(!game?.running)return;game.paused=false;startMusic();game.last=performance.now();showOnly(els.gameScreen);playTone(420,.05);raf=requestAnimationFrame(loop)});
els.quitBtn.addEventListener("click",()=>{if(game)game.running=false;stopMusic();cancelAnimationFrame(raf);showOnly(els.homeScreen);hydrateStats()});
els.againBtn.addEventListener("click",()=>{prepareFactThenGame()});
els.changePilotBtn.addEventListener("click",()=>{showOnly(els.profileScreen);if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;selectedBirdId=profile.birdId}renderBirds()});
els.changePilotHomeBtn.addEventListener("click",()=>{playTone(440,.05);if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;selectedBirdId=profile.birdId}renderBirds();showOnly(els.profileScreen)});
els.adminNavBtn?.addEventListener("click",openEventAdmin);
els.soundBtn.addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem("amsFlySound",soundOn?"1":"0");els.soundBtn.textContent=soundOn?"♪":"×";if(soundOn){playTone(600,.05);startMusic()}else stopMusic()});
function action(e){if(["BUTTON","INPUT","SELECT"].includes(e.target?.tagName))return;e.preventDefault();if(els.gameScreen.hidden)return;flap()}
els.gameScreen.addEventListener("pointerdown",action,{passive:false});
window.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(!els.gameScreen.hidden)flap()}if(e.code==="Escape"&&game?.running&&!game.paused){els.pauseBtn.click()}});
window.addEventListener("resize",()=>{if(!els.gameScreen.hidden){resizeCanvas();if(game?.bird)game.bird.x=clamp(game.bird.x,50,window.innerWidth*.32)}});
window.addEventListener("visibilitychange",()=>{if(document.hidden&&game?.running&&!game.paused){game.paused=true;cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen)}});
els.soundBtn.textContent=soundOn?"♪":"×";
bootHome();
})();