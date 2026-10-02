(() => {
"use strict";

const STORAGE_KEY = "amsFlyProfileV2";
const STATS_KEY = "amsFlyStatsV1";
const FACT_INDEX_KEY = "amsFlyFactIndexV1";
const NEON_DATA_READY = () => !!window.AMS_FLY_NEON_CONFIG?.dataApiUrl;
const PHONE_API_URL = String(window.AMS_FLY_NEON_CONFIG?.phoneApiUrl || "").replace(/\/$/,"");
async function getNeonClient(){
  if(!window.AMS_FLY_NEON?.getClient) throw new Error("Cliente Neon no disponible.");
  return window.AMS_FLY_NEON.getClient();
}
async function getPublicNeonClient(){
  if(!window.AMS_FLY_NEON?.getPublicClient) throw new Error("Cliente público Neon no disponible.");
  return window.AMS_FLY_NEON.getPublicClient();
}
const RANKING_LIMIT = 50;
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
const EVENT_CONFIG_KEY = "amsFlyEventConfigV1";
const LEADS_KEY = "amsFlyLeadsV1";
const DEFAULT_EVENT = {
  active:true,
  badge:"🏆 EVENTO ESPECIAL 2026",
  title:"¡Gana una Landing Page Gratis!",
  desc:"Vuela durante 2026, consigue la puntuación válida más alta y gana el desarrollo de una Landing Page profesional para estrenar en 2027.",
  cta:"VER DETALLES DEL EVENTO",
  prizeTitle:"Desarrollo de Landing Page 100% GRATIS",
  prizeDesc:"El ganador recibe el desarrollo completo y profesional de una Landing Page responsive, adaptada a su negocio, con diseño, estructura UX/UI, SEO básico y conexión a sus canales de venta.",
  conditionTitle:"Reglas, vigencia y servicio posterior",
  conditionDesc:"El evento termina el 31 de diciembre de 2026 a las 11:59 p. m. Ganará el participante elegible con la puntuación válida más alta. El equipo de Avila Mora Soluciones puede jugar, pero sus puntuaciones no son elegibles para el premio. En caso de empate, gana quien haya alcanzado primero esa puntuación. El desarrollo de la Landing Page es gratis; hosting y dominio gestionados por Avila Mora Soluciones: $10 USD/mes o $100 USD/año, con mantenimiento básico incluido. Servicios adicionales se cotizan por separado.",
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
  "homeBest","homeGames","startBtn","changePilotHomeBtn","profileForm","playerName","playerCountry","playerPhoneCountry","playerPhone","phoneVerificationBox","sendPhoneCodeBtn","phoneCodeRow","phoneCode","verifyPhoneCodeBtn","phoneVerifyStatus","birdGrid","selectedBirdInfo","profileError",
  "factTitle","factText","factSourceHint","factContinueBtn","gameCanvas","scoreValue","difficultyValue","pauseBtn","gameStartHint",
  "pauseScore","resumeBtn","quitBtn","resultBird","resultEyebrow","resultTitle","finalScore","resultBest","resultGames","newRecord",
  "againBtn","changePilotBtn","soundBtn","backBtn","adminNavBtn","homeBirdArt","rankingBtn","rankingFromResultBtn","rankingBackBtn","rankingRefreshBtn","rankingList","rankingStatus","scoreMessage","submitScoreBtn","submitScoreStatus","shareResultBtn","termsConsent","rankingScreen"
].forEach(id => els[id] = document.getElementById(id));

const ctx = els.gameCanvas.getContext("2d", {alpha:false});
let profile = null;
let stats = {games:0,best:0};
let selectedBirdId = "condor-co";
let pendingPhoneProfile = null;
let currentFactIndex = Number(localStorage.getItem(FACT_INDEX_KEY) || 0);
let soundOn = localStorage.getItem("amsFlySound") !== "0";
let audioCtx = null;
let musicTimer = 0;
let musicStep = 0;
let musicStarting = false;
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
  return safeParse(EVENT_CONFIG_KEY, DEFAULT_EVENT);
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
    const home=els.homeScreen;const statsEl=home.querySelector(".home-stats");
    home.insertBefore(banner,statsEl||home.querySelector("#startBtn"));
  }
  banner.hidden=!cfg.active;
  banner.replaceChildren();
  const badge=document.createElement("span");badge.className="event-badge";badge.textContent=cfg.badge;
  const title=document.createElement("h3");title.textContent=cfg.title;
  const desc=document.createElement("p");desc.textContent=cfg.desc;
  const button=document.createElement("button");button.id="amsFlyEventOpen";button.className="event-cta-button";button.type="button";button.textContent=cfg.cta+" →";
  button.onclick=openEventScreen;
  banner.append(badge,title,desc,button);
}
function renderEventRichText(target,text){
  target.replaceChildren();
  const blocks=String(text||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  blocks.forEach(block=>{
    const item=document.createElement("div");
    item.className="event-rich-item";
    const marker=document.createElement("span");
    marker.className="event-rich-marker";
    const content=document.createElement("p");
    content.className="event-rich-text";

    const match=block.match(/^((?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D)+)\s+([\s\S]*)$/u);
    if(match){
      item.classList.add("is-heading");
      marker.textContent=match[1];
      content.textContent=match[2].trim();
    }else{
      marker.textContent="•";
      content.textContent=block;
    }
    item.append(marker,content);
    target.appendChild(item);
  });
}
function openEventScreen(){
  let screen=document.getElementById("amsFlyEventScreen");
  if(!screen){
    screen=document.createElement("section");screen.id="amsFlyEventScreen";screen.className="screen app-screen";screen.hidden=true;
    screen.innerHTML='<div class="section-heading"><span class="eyebrow">AMS FLY · EVENTO</span><h2 id="eventTitle"></h2><p id="eventDesc"></p></div><div class="event-details-card"><div class="event-detail-block"><span class="event-badge">🏆 PREMIO</span><h3 id="eventPrizeTitle"></h3><div id="eventPrizeDesc" class="event-rich-content"></div></div><div class="event-detail-block"><span class="event-badge">📋 CONDICIONES</span><h3 id="eventConditionTitle"></h3><div id="eventConditionDesc" class="event-rich-content"></div></div><button id="eventJoinButton" class="primary-button" type="button">PARTICIPAR Y VOLAR <span>✦</span></button><button id="eventBackButton" class="secondary-button" type="button">← VOLVER</button></div>';
    document.querySelector(".app-shell").insertBefore(screen,els.profileScreen);
    screen.querySelector("#eventBackButton").onclick=()=>showOnly(els.homeScreen);
    screen.querySelector("#eventJoinButton").onclick=()=>{if(profile)prepareFactThenGame();else showOnly(els.profileScreen)};
  }
  const cfg=getEventConfig();
  screen.querySelector("#eventTitle").textContent=cfg.title;
  screen.querySelector("#eventDesc").textContent=cfg.desc;
  screen.querySelector("#eventPrizeTitle").textContent=cfg.prizeTitle;
  renderEventRichText(screen.querySelector("#eventPrizeDesc"),cfg.prizeDesc);
  screen.querySelector("#eventConditionTitle").textContent=cfg.conditionTitle;
  renderEventRichText(screen.querySelector("#eventConditionDesc"),cfg.conditionDesc);
  showOnly(screen);
  screen.hidden=false;
  screen.scrollTop=0;
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
  }catch(_){}
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
  els.playerPhoneCountry.innerHTML=countries.map(c=>'<option value="'+c.dial+'">'+c.flag+" +"+c.dial+" · "+c.name+'</option>').join("");
  els.playerPhoneCountry.value=profile?.phoneCountry || getCountry(profile?.country || "CO").dial;
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
  if(profile?.name && getBird(profile.birdId)){
    if(profile.birdId==="condor-ec")profile.birdId="tucan-ec";
    if(profile.birdId==="condor-cl")profile.birdId="chucao-cl";
    selectedBirdId=profile.birdId;
    if(!profile.phoneCountry)profile.phoneCountry=getCountry(profile.country||"CO").dial;
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
  window.removeEventListener("pointerdown",unlockMenuMusic);
  window.removeEventListener("keydown",unlockMenuMusic);
  if(soundOn)startMusic();
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
function resetGame(){
  resizeCanvas();
  const w=window.innerWidth,h=window.innerHeight;
  const birdData=getBird(profile?.birdId||selectedBirdId);
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
async function saveCurrentLead(message=""){
  if(!profile||!game||!NEON_DATA_READY())return null;
  const lead={id:"lead_"+Date.now(),name:profile.name,country:profile.country,birdId:profile.birdId,score:game.score,message,phone:profile.phone||"",date:new Date().toISOString()};
  saveLocalLead(lead);
  try{
    const client=await getPublicNeonClient();
    const result=await client.rpc("ams_fly_register_participant",{p_name:lead.name,p_country:lead.country,p_bird_id:lead.birdId,p_phone:lead.phone,p_score:lead.score});
    if(result.error)throw result.error;
    return result.data||null;
  }catch(error){console.warn("AMS Fly: no se pudo registrar el participante",error);return null}
}
async function publishScore(){
  if(!profile||!game)return;
  if(!eventIsOpen()){
    els.submitScoreStatus.textContent="El evento ya no está vigente. Las puntuaciones solo pueden publicarse durante el periodo oficial del evento.";
    return;
  }
  if(game.score<=0){
    els.submitScoreStatus.textContent="Necesitas al menos 1 punto para publicar.";
    return;
  }
  if(els.submitScoreBtn.dataset.published==="1")return;
  const message=(els.scoreMessage.value||"").trim().slice(0,90);
  if(message.length<3){
    els.submitScoreStatus.textContent="Escribe un mensaje de al menos 3 caracteres para confirmar tu puntuación.";
    els.scoreMessage.focus();
    return;
  }
  if(!NEON_DATA_READY()){
    els.submitScoreStatus.textContent="No se puede publicar todavía: falta conectar el Data API de Neon.";
    return;
  }
  els.submitScoreBtn.disabled=true;
  els.submitScoreStatus.textContent="Guardando tu puntuación en el ranking…";
  try{
    const participant=await saveCurrentLead(message);
    const participantId=participant?.participant_id||profile.participantId||null;
    if(!participantId) throw new Error("No se pudo identificar tu piloto. Vuelve a registrar tu número antes de publicar.");
    profile.participantId=participantId;saveProfile();
    const client=await getPublicNeonClient();
    const result=await client.rpc("ams_fly_submit_score",{
      p_participant_id:participantId,p_name:profile.name,p_country:profile.country,
      p_bird_id:profile.birdId,p_score:game.score,p_message:message,
      p_duration_ms:Math.round((game.time||0)*1000)
    });
    if(result.error) throw result.error;
    els.submitScoreBtn.dataset.published="1";
    els.submitScoreBtn.disabled=true;
    els.submitScoreBtn.innerHTML="✓ PUNTUACIÓN CONFIRMADA";
    els.submitScoreStatus.textContent=(result.data?.provisional===true)?"✓ Puntuación publicada. Quedó como provisional hasta verificar la identidad del participante.":"✓ Listo. Tu puntuación quedó publicada en el ranking mundial. Puedes verla cuando quieras.";
    playTone(880,.12,"triangle");
  }catch(error){
    console.error("AMS Fly: error al publicar puntuación", error);
    const detail=error?.message || error?.details || error?.hint || "Error desconocido de Neon Data API";
    els.submitScoreStatus.textContent="No se pudo publicar todavía: "+detail;
    els.submitScoreBtn.disabled=false;
  }
}
async function loadRanking(){
  showOnly(els.rankingScreen);
  els.rankingList.innerHTML='<div class="ranking-loading">Cargando pilotos...</div>';
  if(!NEON_DATA_READY()){els.rankingList.innerHTML='<div class="ranking-empty"><strong>Ranking mundial preparado.</strong><br><span>Falta conectar el Data API de Neon.</span></div>';return}
  try{
    const client=await getPublicNeonClient();
    const result=await client.from("ams_fly_scores")
      .select("player_name,country_code,bird_id,score,message,created_at")
      .order("score",{ascending:false})
      .order("created_at",{ascending:true})
      .limit(RANKING_LIMIT);
    if(result.error)throw result.error;
    const rows=(result.data||[]).map(row=>({
      name:row.player_name,country:row.country_code,birdId:row.bird_id,score:row.score,message:row.message,created_at:row.created_at
    }));
    if(!rows.length){els.rankingList.innerHTML='<div class="ranking-empty">Aún no hay pilotos. ¡Sé el primero!</div>';return}
    els.rankingList.innerHTML="";
    rows.forEach((row,index)=>{
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
  }catch(error){
    console.error("AMS Fly: no se pudo cargar el ranking", error);
    const detail=error?.message || error?.details || error?.hint || "Error desconocido de Neon Data API";
    els.rankingList.innerHTML='<div class="ranking-empty"><strong>No pudimos cargar el ranking.</strong><br><span>'+escapeHtml(detail)+'</span><br><small>Revisa los permisos/RLS de Neon y vuelve a actualizar.</small></div>';
  }
}
function endGame(){
  if(!game?.running)return;
  game.running=false;stopMusic();cancelAnimationFrame(raf);
  stats.games++;const previous=stats.best;stats.best=Math.max(stats.best,game.score);saveStats();hydrateStats();
  const isNew=game.score>previous && game.score>0;
  els.finalScore.textContent=game.score;els.resultBest.textContent=stats.best;els.resultGames.textContent=stats.games;els.newRecord.hidden=!isNew;
  els.resultTitle.textContent=game.score>=80?"Vuelo legendario.":game.score>=40?"¡Muy buen vuelo!":game.score>=15?"Vas tomando altura.":"El cielo todavía tiene revancha.";
  els.resultEyebrow.textContent=isNew?"NUEVO RÉCORD":"VUELO TERMINADO";
  els.resultBird.innerHTML=birdMarkup(game.birdData,".9");
  els.scoreMessage.value="";
  els.scoreMessage.required=true;
  els.submitScoreBtn.dataset.published="0";
  els.submitScoreBtn.disabled=game.score<=0;
  els.submitScoreBtn.innerHTML="PUBLICAR PUNTUACIÓN <span>↑</span>";
  els.submitScoreStatus.textContent=game.score>0
    ?"Tu vuelo terminó. Escribe un mensaje y pulsa “PUBLICAR PUNTUACIÓN” para confirmar que quieres entrar al ranking."
    :"Necesitas conseguir al menos 1 punto para poder publicar.";
  showOnly(els.gameOverScreen);
  playTone(isNew?880:180,.16,isNew?"triangle":"sawtooth");
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
function startWithProfile(){
  resetGame();
}
function prepareFactThenGame(){
  const fact=colombiaFacts[currentFactIndex%colombiaFacts.length];currentFactIndex=(currentFactIndex+1)%colombiaFacts.length;localStorage.setItem(FACT_INDEX_KEY,String(currentFactIndex));
  els.factText.textContent=fact;els.factSourceHint.textContent="Una curiosidad sobre Colombia antes de volver a volar.";
  showOnly(els.factScreen);
}
async function submitProfile(e){
  e.preventDefault();
  const name=els.playerName.value.trim().replace(/\s+/g," ");
  if(name.length<2){els.profileError.textContent="Escribe al menos 2 caracteres para tu nombre.";els.profileError.hidden=false;els.playerName.focus();return}
  if(els.termsConsent && !els.termsConsent.checked){els.profileError.textContent="Debes aceptar los Términos y Condiciones y la Política de Privacidad para participar.";els.profileError.hidden=false;els.termsConsent.focus();return}
  const phoneCountry=els.playerPhoneCountry?.value || getCountry(els.playerCountry.value).dial;
  const rawPhone=(els.playerPhone?.value||"").replace(/\D/g,"");
  if(rawPhone.length<7){els.profileError.textContent="El número de celular es obligatorio para identificar tu piloto.";els.profileError.hidden=false;els.playerPhone?.focus();return}
  if(!NEON_DATA_READY()){els.profileError.textContent="No podemos registrar el piloto todavía porque Neon no está conectado.";els.profileError.hidden=false;return}
  const candidate={name:name.slice(0,18),country:els.playerCountry.value,birdId:selectedBirdId,phoneCountry,phone:"+"+phoneCountry+rawPhone,phoneVerified:false};
  try{
    const client=await getPublicNeonClient();
    const result=await client.rpc("ams_fly_register_participant",{p_name:candidate.name,p_country:candidate.country,p_bird_id:candidate.birdId,p_phone:candidate.phone,p_score:0});
    if(result.error)throw result.error;
    const remote=result.data;
    candidate.participantId=remote?.participant_id||candidate.participantId||null;
    if(remote?.existing){
      if(remote.name && remote.name.toLowerCase()!==candidate.name.toLowerCase())throw new Error("Este celular ya está asociado a otro piloto. Usa el número del piloto correcto.");
      candidate.name=remote.name||candidate.name;candidate.country=remote.country||candidate.country;candidate.birdId=remote.bird_id||candidate.birdId;candidate.phoneVerified=!!remote.phone_verified;candidate.participantId=remote.participant_id||candidate.participantId||null;
    }
    if(PHONE_API_URL && !candidate.phoneVerified){
      pendingPhoneProfile=candidate;
      els.phoneVerificationBox.hidden=false;
      els.phoneCodeRow.hidden=true;
      els.phoneVerifyStatus.textContent="Este número necesita una verificación. Te enviaremos un código SMS.";
      els.profileError.hidden=true;
      await sendPhoneCode();
      return;
    }
    finishProfile(candidate);
  }catch(error){
    console.error("AMS Fly: no se pudo registrar el piloto",error);
    els.profileError.textContent=error?.message||"No pudimos registrar este piloto. Inténtalo de nuevo.";els.profileError.hidden=false;
  }
}
function finishProfile(candidate){
  profile=candidate;selectedBirdId=profile.birdId;saveProfile();renderBirds();
  els.phoneVerificationBox.hidden=true;prepareFactThenGame();
}
async function sendPhoneCode(){
  if(!PHONE_API_URL||!pendingPhoneProfile)return;
  els.sendPhoneCodeBtn.disabled=true;els.phoneVerifyStatus.textContent="Enviando código…";
  try{
    const response=await fetch(PHONE_API_URL+"/phone/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:pendingPhoneProfile.phone})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"No pudimos enviar el código.");
    els.phoneCodeRow.hidden=false;els.phoneVerifyStatus.textContent="Código enviado. Revisa tus SMS.";els.phoneCode.focus();
  }catch(error){els.phoneVerifyStatus.textContent=error.message||"No pudimos enviar el código.";}
  finally{els.sendPhoneCodeBtn.disabled=false}
}
async function verifyPhoneCode(){
  if(!PHONE_API_URL||!pendingPhoneProfile)return;
  const code=(els.phoneCode.value||"").trim();
  if(!/^\d{4,10}$/.test(code)){els.phoneVerifyStatus.textContent="Escribe el código recibido por SMS.";return}
  els.verifyPhoneCodeBtn.disabled=true;els.phoneVerifyStatus.textContent="Verificando…";
  try{
    const response=await fetch(PHONE_API_URL+"/phone/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:pendingPhoneProfile.phone,code})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"Código incorrecto.");
    pendingPhoneProfile.phoneVerified=true;els.phoneVerifyStatus.textContent="✓ Celular verificado.";finishProfile(pendingPhoneProfile);pendingPhoneProfile=null;
  }catch(error){els.phoneVerifyStatus.textContent=error.message||"No pudimos verificar el código."}
  finally{els.verifyPhoneCodeBtn.disabled=false}
}
function bootHome(){
  loadProfile();hydrateStats();initCountries();renderBirds();renderHomeBird();applyEventConfig();
  if(NEON_DATA_READY()) loadRemoteEventConfig();
  if(profile){
    els.playerName.value=profile.name;els.playerCountry.value=profile.country;
    if(els.playerPhoneCountry)els.playerPhoneCountry.value=profile.phoneCountry||getCountry(profile.country).dial;
    if(els.playerPhone){
      const dial=els.playerPhoneCountry?.value||getCountry(profile.country).dial;
      const raw=String(profile.phone||"").replace(/\D/g,"");
      els.playerPhone.value=raw.startsWith(dial)?raw.slice(dial.length):raw;
    }
    selectedBirdId=profile.birdId;renderBirds()
  }
  els.homeBirdArt.innerHTML=birdMarkup(getBird(selectedBirdId),".95");
  setTimeout(()=>els.loadingScreen.classList.add("is-gone"),500);
  if(soundOn){
    startMusic();
    window.addEventListener("pointerdown",unlockMenuMusic,{once:true,passive:true});
    window.addEventListener("keydown",unlockMenuMusic,{once:true});
  }
}
els.rankingBtn.addEventListener("click",loadRanking);
els.rankingFromResultBtn.addEventListener("click",loadRanking);
els.rankingBackBtn.addEventListener("click",()=>showOnly(els.homeScreen));
els.backBtn?.addEventListener("click",()=>{ if(game?.running && !game?.paused){ game.paused=true; stopMusic(); cancelAnimationFrame(raf); els.pauseScore.textContent=game.score+" puntos"; showOnly(els.pauseScreen); } else if(!els.profileScreen.hidden){ showOnly(els.homeScreen); } else if(!els.factScreen.hidden){ showOnly(els.profileScreen); } else if(!els.rankingScreen.hidden){ showOnly(els.homeScreen); } else { showOnly(els.homeScreen); } });
els.rankingRefreshBtn.addEventListener("click",loadRanking);
els.submitScoreBtn.addEventListener("click",()=>{publishScore();});
els.shareResultBtn?.addEventListener("click",shareResult);
els.birdGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-bird]");if(!btn)return;selectedBirdId=btn.dataset.bird;renderBirds();playTone(350,.04)});
els.startBtn.addEventListener("click",()=>{playTone(440,.07);startMusic();if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;if(els.playerPhoneCountry)els.playerPhoneCountry.value=profile.phoneCountry||getCountry(profile.country).dial;if(els.playerPhone){const dial=els.playerPhoneCountry?.value||getCountry(profile.country).dial;const raw=String(profile.phone||"").replace(/\D/g,"");els.playerPhone.value=raw.startsWith(dial)?raw.slice(dial.length):raw}selectedBirdId=profile.birdId;renderBirds()}showOnly(els.profileScreen)});
els.profileForm.addEventListener("submit",submitProfile);
els.sendPhoneCodeBtn?.addEventListener("click",sendPhoneCode);
els.verifyPhoneCodeBtn?.addEventListener("click",verifyPhoneCode);
els.factContinueBtn.addEventListener("click",()=>{playTone(560,.05);startMusic();startWithProfile()});
els.pauseBtn.addEventListener("click",()=>{if(!game?.running)return;game.paused=true;stopMusic();cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen);playTone(300,.05)});
els.resumeBtn.addEventListener("click",()=>{if(!game?.running)return;game.paused=false;startMusic();game.last=performance.now();showOnly(els.gameScreen);playTone(420,.05);raf=requestAnimationFrame(loop)});
els.quitBtn.addEventListener("click",()=>{if(game)game.running=false;stopMusic();cancelAnimationFrame(raf);showOnly(els.homeScreen);hydrateStats();startMusic()});
els.againBtn.addEventListener("click",()=>{prepareFactThenGame()});
els.changePilotBtn.addEventListener("click",()=>{showOnly(els.profileScreen);if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;if(els.playerPhoneCountry)els.playerPhoneCountry.value=profile.phoneCountry||getCountry(profile.country).dial;if(els.playerPhone){const dial=els.playerPhoneCountry?.value||getCountry(profile.country).dial;const raw=String(profile.phone||"").replace(/\D/g,"");els.playerPhone.value=raw.startsWith(dial)?raw.slice(dial.length):raw}selectedBirdId=profile.birdId}renderBirds()});
els.changePilotHomeBtn.addEventListener("click",()=>{playTone(440,.05);if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;if(els.playerPhoneCountry)els.playerPhoneCountry.value=profile.phoneCountry||getCountry(profile.country).dial;if(els.playerPhone){const dial=els.playerPhoneCountry?.value||getCountry(profile.country).dial;const raw=String(profile.phone||"").replace(/\D/g,"");els.playerPhone.value=raw.startsWith(dial)?raw.slice(dial.length):raw}selectedBirdId=profile.birdId}renderBirds();showOnly(els.profileScreen)});
els.adminNavBtn?.addEventListener("click",()=>window.dispatchEvent(new Event("ams-fly-admin-open")));
window.addEventListener("ams-fly-event-updated",event=>{if(!event.detail)return;saveEventConfig({...DEFAULT_EVENT,...event.detail});applyEventConfig()});
els.soundBtn.addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem("amsFlySound",soundOn?"1":"0");els.soundBtn.textContent=soundOn?"♪":"×";if(soundOn){playTone(600,.05);startMusic()}else stopMusic()});
function action(e){if(["BUTTON","INPUT","SELECT"].includes(e.target?.tagName))return;e.preventDefault();if(els.gameScreen.hidden)return;flap()}
els.gameScreen.addEventListener("pointerdown",action,{passive:false});
window.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(!els.gameScreen.hidden)flap()}if(e.code==="Escape"&&game?.running&&!game.paused){els.pauseBtn.click()}});
window.addEventListener("resize",()=>{if(!els.gameScreen.hidden){resizeCanvas();if(game?.bird)game.bird.x=clamp(game.bird.x,50,window.innerWidth*.32)}});
window.addEventListener("visibilitychange",()=>{if(document.hidden&&game?.running&&!game.paused){game.paused=true;cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen)}});
els.soundBtn.textContent=soundOn?"♪":"×";
bootHome();
})();