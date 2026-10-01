(() => {
"use strict";

const STORAGE_KEY = "amsFlyProfileV1";
const STATS_KEY = "amsFlyStatsV1";
const FACT_INDEX_KEY = "amsFlyFactIndexV1";
const RANKING_API = ""; // Endpoint HTTPS seguro que leerá/escribirá en Neon. Nunca pongas credenciales de Neon aquí.
const RANKING_LIMIT = 50;

const countries = [
  {code:"CO",name:"Colombia",flag:"🇨🇴",bird:"Cóndor de los Andes",host:true},
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
  "Colombia es reconocido como el país con mayor diversidad de aves del mundo, con más de 1.900 especies registradas.",
  "Colombia reúne costas en el Caribe y el Pacífico, además de tres cordilleras andinas y grandes regiones de selva, llanura y montaña.",
  "La Sierra Nevada de Santa Marta es una de las montañas costeras más altas del mundo y tiene ecosistemas únicos.",
  "El río Amazonas atraviesa el sur de Colombia y forma parte de una de las regiones con mayor biodiversidad del planeta.",
  "El cóndor de los Andes, nuestro personaje anfitrión, es el ave nacional de Colombia.",
  "Colombia posee una enorme variedad de ecosistemas: páramos, bosques andinos, selvas tropicales, sabanas, manglares y arrecifes.",
  "Los páramos colombianos son ecosistemas de alta montaña fundamentales para la regulación y producción de agua.",
  "El Valle del Cocora, en Quindío, es famoso por sus enormes palmas de cera, el árbol nacional de Colombia.",
  "La palma de cera puede superar varias decenas de metros de altura y forma uno de los paisajes más reconocibles de los Andes colombianos.",
  "Colombia tiene territorios en ambos océanos y una geografía que cambia radicalmente en distancias relativamente cortas."
];

const els = {};
[
  "loadingScreen","factLoading","homeScreen","profileScreen","factScreen","gameScreen","pauseScreen","gameOverScreen",
  "homeBest","homeGames","startBtn","profileForm","playerName","playerCountry","birdGrid","selectedBirdInfo","profileError",
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
let game = null;
let raf = 0;
let lastStage = 0;
let lastStageTone = 0;
const stages = [
  {at:0,name:"CIELO ANDINO",top:"#07091a",mid:"#111536",bottom:"#17102b",pipe:"#6d42c9",glow:"#8b5cf6",particle:"#c4b5fd"},
  {at:25,name:"ATARDECER COLOMBIANO",top:"#211329",mid:"#6b294d",bottom:"#1b1230",pipe:"#e16b8c",glow:"#f472b6",particle:"#facc15"},
  {at:50,name:"SELVA VIVA",top:"#031b1b",mid:"#075e54",bottom:"#081f26",pipe:"#16a085",glow:"#34d399",particle:"#facc15"},
  {at:75,name:"CIELO NEÓN",top:"#07102d",mid:"#1e2a78",bottom:"#2a1050",pipe:"#22d3ee",glow:"#22d3ee",particle:"#a78bfa"},
  {at:100,name:"ÓRBITA AMS",top:"#02030b",mid:"#11133a",bottom:"#250d40",pipe:"#a855f7",glow:"#ec4899",particle:"#fff"}
];

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
function showOnly(target){
  [els.homeScreen,els.profileScreen,els.factScreen,els.gameScreen,els.pauseScreen,els.gameOverScreen].forEach(x=>x.hidden=true);
  target.hidden=false;
}
function hydrateStats(){
  stats=safeParse(STATS_KEY,{games:0,best:0});
  els.homeBest.textContent=stats.best||0;els.homeGames.textContent=stats.games||0;
}
function initCountries(){
  els.playerCountry.innerHTML=countries.map(c=>'<option value="'+c.code+'">'+c.flag+' '+c.name+(c.host?" · ANFITRIÓN 🇨🇴":"")+'</option>').join("");
  els.playerCountry.value=profile?.country || "CO";
}
function renderBirds(){
  els.birdGrid.innerHTML=birds.map(b=>{
    const c=getCountry(b.country);
    return '<button type="button" class="bird-option '+(b.id===selectedBirdId?"selected ":"")+(b.country==="CO"?"host":"")+'" data-bird="'+b.id+'" role="radio" aria-checked="'+(b.id===selectedBirdId)+'">'+
      (b.country==="CO"?'<span class="host-badge">🇨🇴 ANFITRIÓN</span>':"")+
      '<span class="bird-mini">'+birdMarkup(b,".52")+'</span><span><strong>'+b.name+'</strong><small>'+c.flag+" "+c.name+'</small></span></button>';
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
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
    o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
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
function currentStage(score){let s=stages[0];for(const candidate of stages)if(score>=candidate.at)s=candidate;return s}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
function stageForScore(score){
  const stage=currentStage(score);
  if(stage.at!==lastStage){lastStage=stage.at;showStageBanner(stage);if(stage.at>0){playStageSound(stage);lastStageTone=stage.at}}
  return stage;
}
function showStageBanner(stage){
  let banner=document.getElementById("stageBanner");
  if(!banner){banner=document.createElement("div");banner.id="stageBanner";banner.className="stage-banner";els.gameScreen.appendChild(banner)}
  banner.innerHTML="<strong>"+stage.name+"</strong><span>Has llegado a "+stage.at+" puntos.</span>";
  banner.classList.remove("show");void banner.offsetWidth;banner.classList.add("show");
  clearTimeout(banner._timer);banner._timer=setTimeout(()=>banner.classList.remove("show"),1900);
}
function playStageSound(stage){
  if(!soundOn)return;
  const notes=stage.at>=100?[392,523,659,784]:stage.at>=75?[330,440,554,660]:stage.at>=50?[294,392,494,587]:[262,330,392,523];
  notes.forEach((n,i)=>setTimeout(()=>playTone(n,.12,"triangle"),i*75));
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
    worldSpeed:Math.max(145,Math.min(225,w*.23)),
    gravity:1250,flap:-390,
    gap:Math.max(145,Math.min(205,h*.23)),pipeW:62,
    deathAt:0,
    stage:currentStage(0)
  };
  lastStage=0;lastStageTone=0;
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
  const margin=Math.max(72,h*.11);
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
  game.stage=stageForScore(game.score);
  game.worldSpeed=Math.min(285,Math.max(145,window.innerWidth*.23)+(d-1)*20);
  game.gravity=1250+(d-1)*42;
  game.bird.vy+=game.gravity*dt;game.bird.y+=game.bird.vy*dt;
  game.spawn-=dt;
  if(game.spawn<=0){spawnPipe();game.spawn=Math.max(.88,1.28-(d-1)*.06)}
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
  ctx.fillStyle=game.bird.c;ctx.beginPath();ctx.ellipse(-8,7,16,9,-.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.bird.d;ctx.beginPath();ctx.moveTo(20,-2);ctx.lineTo(39,4);ctx.lineTo(20,8);ctx.closePath();ctx.fill();
  ctx.fillStyle="#111827";ctx.beginPath();ctx.arc(12,-9,4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(13,-10,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.bird.c;ctx.beginPath();ctx.moveTo(-18,-2);ctx.quadraticCurveTo(-39,-22,-31,5);ctx.quadraticCurveTo(-24,12,-11,7);ctx.closePath();ctx.fill();
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
async function publishScore(){
  if(!profile || !game)return;
  const message=(els.scoreMessage?.value||"").trim().slice(0,90);
  if(!RANKING_API){els.submitScoreStatus.textContent="El ranking ya está diseñado. Falta conectar el endpoint seguro con Neon para publicar esta puntuación.";return}
  els.submitScoreBtn.disabled=true;els.submitScoreStatus.textContent="Publicando...";
  try{
    const response=await fetch(RANKING_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      name:profile.name,country:profile.country,birdId:profile.birdId,score:game.score,message
    })});
    if(!response.ok)throw new Error("No se pudo publicar la puntuación.");
    els.submitScoreStatus.textContent="¡Puntuación publicada en el ranking mundial!";
    playTone(880,.12,"triangle");
  }catch(error){els.submitScoreStatus.textContent="No se pudo publicar ahora. Tu récord local sigue guardado."}
  finally{els.submitScoreBtn.disabled=false}
}
async function loadRanking(){
  showOnly(els.rankingScreen);els.rankingList.innerHTML='<div class="ranking-loading">Cargando pilotos...</div>';els.rankingStatus.textContent="";
  if(!RANKING_API){els.rankingList.innerHTML='<div class="ranking-empty"><strong>Ranking mundial preparado.</strong><br><span>Falta conectar el endpoint seguro con Neon. Mientras tanto, tus récords locales siguen funcionando.</span></div>';return}
  try{
    const response=await fetch(RANKING_API+"?limit="+RANKING_LIMIT,{headers:{"Accept":"application/json"}});
    if(!response.ok)throw new Error("Ranking no disponible");
    const data=await response.json();const rows=Array.isArray(data)?data:(data.rows||[]);
    if(!rows.length){els.rankingList.innerHTML='<div class="ranking-empty">Aún no hay pilotos. ¡Sé el primero!</div>';return}
    els.rankingList.innerHTML=rows.slice(0,RANKING_LIMIT).map((row,index)=>{
      const b=getBird(row.birdId);const country=getCountry(row.country);
      return '<article class="ranking-card"><div class="ranking-position '+(index<3?"top":"")+"'>#"+(index+1)+"</div><div class="ranking-avatar">'+birdMarkup(b,".43")+'</div><div class="ranking-main"><div class="ranking-name">'+escapeHtml(row.name||"Piloto")+'</div><div class="ranking-country">'+country.flag+" "+escapeHtml(country.name)+" · "+escapeHtml(b.name)+'</div><div class="ranking-message">“'+escapeHtml(row.message||"Sin mensaje")+'”</div></div><div class="ranking-score"><strong>'+Number(row.score||0)+'</strong><span>PUNTOS</span></div></article>';
    }).join("");
  }catch(_){els.rankingList.innerHTML='<div class="ranking-empty">No pudimos cargar el ranking en este momento.</div>';els.rankingStatus.textContent="Inténtalo de nuevo en unos segundos."}
}
function endGame(){
  if(!game?.running)return;
  game.running=false;cancelAnimationFrame(raf);
  stats.games++;const previous=stats.best;stats.best=Math.max(stats.best,game.score);saveStats();hydrateStats();
  const isNew=game.score>previous && game.score>0;
  els.finalScore.textContent=game.score;els.resultBest.textContent=stats.best;els.resultGames.textContent=stats.games;els.newRecord.hidden=!isNew;
  els.resultTitle.textContent=game.score>=80?"Vuelo legendario.":game.score>=40?"¡Muy buen vuelo!":game.score>=15?"Vas tomando altura.":"El cielo todavía tiene revancha.";
  els.resultEyebrow.textContent=isNew?"NUEVO RÉCORD":"VUELO TERMINADO";
  els.resultBird.innerHTML=birdMarkup(game.bird,".9");
  els.scoreMessage.value="";
  els.submitScoreStatus.textContent="";
  showOnly(els.gameOverScreen);playTone(isNew?880:180,.16,isNew?"triangle":"sawtooth");
}
function startWithProfile(){
  resetGame();
}
function prepareFactThenGame(){
  const fact=colombiaFacts[currentFactIndex%colombiaFacts.length];currentFactIndex=(currentFactIndex+1)%colombiaFacts.length;localStorage.setItem(FACT_INDEX_KEY,String(currentFactIndex));
  els.factText.textContent=fact;els.factSourceHint.textContent="Colombia arriba. Un dato más antes de volver a volar.";
  showOnly(els.factScreen);
}
function submitProfile(e){
  e.preventDefault();
  const name=els.playerName.value.trim().replace(/\s+/g," ");
  if(name.length<2){els.profileError.textContent="Escribe al menos 2 caracteres para tu nombre.";els.profileError.hidden=false;els.playerName.focus();return}
  profile={name:name.slice(0,18),country:els.playerCountry.value,birdId:selectedBirdId};
  saveProfile();els.profileError.hidden=true;prepareFactThenGame();
}
function bootHome(){
  loadProfile();hydrateStats();initCountries();renderBirds();
  if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country;selectedBirdId=profile.birdId;renderBirds()}
  els.homeBirdArt.innerHTML=birdMarkup(getBird(selectedBirdId),".95");
  setTimeout(()=>els.loadingScreen.classList.add("is-gone"),500);
}
els.birdGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-bird]");if(!btn)return;selectedBirdId=btn.dataset.bird;renderBirds();playTone(350,.04)});
els.rankingBtn.addEventListener("click",loadRanking);\nels.rankingFromResultBtn.addEventListener("click",loadRanking);\nels.rankingBackBtn.addEventListener("click",()=>showOnly(els.homeScreen));\nels.rankingRefreshBtn.addEventListener("click",loadRanking);\nels.submitScoreBtn.addEventListener("click",publishScore);\nels.startBtn.addEventListener("click",()=>{playTone(440,.07);if(profile){prepareFactThenGame()}else showOnly(els.profileScreen)});
els.profileForm.addEventListener("submit",submitProfile);
els.factContinueBtn.addEventListener("click",()=>{playTone(560,.05);startWithProfile()});
els.pauseBtn.addEventListener("click",()=>{if(!game?.running)return;game.paused=true;cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen);playTone(300,.05)});
els.resumeBtn.addEventListener("click",()=>{if(!game?.running)return;game.paused=false;game.last=performance.now();showOnly(els.gameScreen);playTone(420,.05);raf=requestAnimationFrame(loop)});
els.quitBtn.addEventListener("click",()=>{if(game)game.running=false;cancelAnimationFrame(raf);showOnly(els.homeScreen);hydrateStats()});
els.againBtn.addEventListener("click",()=>{prepareFactThenGame()});
els.changePilotBtn.addEventListener("click",()=>{showOnly(els.profileScreen);if(profile){els.playerName.value=profile.name;els.playerCountry.value=profile.country}renderBirds()});
els.soundBtn.addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem("amsFlySound",soundOn?"1":"0");els.soundBtn.textContent=soundOn?"♪":"×";if(soundOn)playTone(600,.05)});
function action(e){if(["BUTTON","INPUT","SELECT"].includes(e.target?.tagName))return;e.preventDefault();if(els.gameScreen.hidden)return;flap()}
els.gameScreen.addEventListener("pointerdown",action,{passive:false});
window.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(!els.gameScreen.hidden)flap()}if(e.code==="Escape"&&game?.running&&!game.paused){els.pauseBtn.click()}});
window.addEventListener("resize",()=>{if(!els.gameScreen.hidden){resizeCanvas();if(game?.bird)game.bird.x=clamp(game.bird.x,50,window.innerWidth*.32)}});
window.addEventListener("visibilitychange",()=>{if(document.hidden&&game?.running&&!game.paused){game.paused=true;cancelAnimationFrame(raf);els.pauseScore.textContent=game.score+" puntos";showOnly(els.pauseScreen)}});
els.soundBtn.textContent=soundOn?"♪":"×";
bootHome();
})();