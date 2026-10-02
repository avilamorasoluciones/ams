import express from "express";
import { neon } from "@neondatabase/serverless";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app=express();
const port=Number(process.env.PORT||3000);
const sql=neon(process.env.DATABASE_URL);
const NEON_AUTH_JWKS_URL=process.env.NEON_AUTH_JWKS_URL||"";
const ADMIN_JWKS=NEON_AUTH_JWKS_URL?createRemoteJWKSet(new URL(NEON_AUTH_JWKS_URL)):null;
const CORS_ORIGINS=new Set((process.env.CORS_ORIGIN||"https://avilamorasoluciones.com").split(",").map(origin=>origin.trim().replace(/\/$/,"")).filter(Boolean));
const allowedCountries=new Set(["CO","VE","EC","US","MX","AR","CL","PE","BR","PA"]);
const allowedBirds=new Set(["condor-co","turpial","tucan-ec","eagle-us","eagle-mx","hornero","chucao-cl","cock-rock","sabia","harpia"]);
const TWILIO_ACCOUNT_SID=process.env.TWILIO_ACCOUNT_SID||"";
const TWILIO_API_KEY=process.env.TWILIO_API_KEY||"";
const TWILIO_API_SECRET=process.env.TWILIO_API_SECRET||"";
const TWILIO_VERIFY_SERVICE_SID=process.env.TWILIO_VERIFY_SERVICE_SID||"";
const phoneSendAttempts=new Map();

function validPhone(phone){
  const value=String(phone||"").trim();
  return /^\+[1-9]\d{7,14}$/.test(value)?value:"";
}
function twilioReady(){
  return !!(TWILIO_ACCOUNT_SID&&TWILIO_API_KEY&&TWILIO_API_SECRET&&TWILIO_VERIFY_SERVICE_SID);
}
function allowPhoneSend(phone){
  const now=Date.now(),windowMs=60*1000;
  const recent=(phoneSendAttempts.get(phone)||[]).filter(t=>now-t<windowMs);
  if(recent.length>=3)return false;
  recent.push(now);phoneSendAttempts.set(phone,recent);return true;
}
async function twilioPost(path,params){
  const body=new URLSearchParams(params);
  const auth=Buffer.from(TWILIO_API_KEY+":"+TWILIO_API_SECRET).toString("base64");
  const response=await fetch("https://verify.twilio.com/v2/"+path,{
    method:"POST",
    headers:{"Authorization":"Basic "+auth,"Content-Type":"application/x-www-form-urlencoded"},
    body
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||"twilio_request_failed");
  return data;
}

app.use(express.json({limit:"16kb"}));
app.use((req,res,next)=>{
  const origin=req.get("origin");
  if(origin&&CORS_ORIGINS.has(origin)){
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS");
  }
  if(req.method==="OPTIONS"){
    if(!origin||!CORS_ORIGINS.has(origin))return res.sendStatus(403);
    return res.sendStatus(204);
  }
  next();
});

async function admin(req,res,next){
  const token=(req.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!ADMIN_JWKS)return res.status(503).json({error:"auth_not_configured"});
  if(!token)return res.status(401).json({error:"Unauthorized"});
  let payload;
  try{
    ({payload}=await jwtVerify(token,ADMIN_JWKS,{requiredClaims:["exp","sub"]}));
  }catch(_){return res.status(401).json({error:"Unauthorized"});}
  if(typeof payload.sub!=="string")return res.status(401).json({error:"Unauthorized"});
  let rows;
  try{
    rows=await sql`select id,email,role,"emailVerified" from neon_auth."user" where id=${payload.sub} limit 1`;
  }catch(_){return res.status(503).json({error:"auth_database_unavailable"});}
  const user=rows[0];
  if(!user)return res.status(401).json({error:"Unauthorized"});
  const roles=Array.isArray(user.role)?user.role.map(String):String(user.role||"").split(/[,\s]+/);
  if(user.emailVerified!==true||!roles.includes("admin"))return res.status(403).json({error:"admin_role_required"});
  req.admin={id:user.id,email:user.email};
  next();
}
function text(value,max){
  return String(value??"").trim().slice(0,max);
}
function validScore(value){
  const n=Number(value);
  return Number.isInteger(n)&&n>=0&&n<=1000000?n:null;
}

app.get("/health",(req,res)=>res.json({ok:true,service:"ams-fly-neon-api"}));
app.get("/admin/me",admin,(req,res)=>res.json({user:{id:req.admin.id,email:req.admin.email}}));

app.post("/phone/send",async(req,res)=>{
  const phone=validPhone(req.body?.phone);
  if(!phone)return res.status(400).json({error:"invalid_phone"});
  if(!twilioReady())return res.status(503).json({error:"phone_verification_not_configured"});
  if(!allowPhoneSend(phone))return res.status(429).json({error:"too_many_requests"});
  try{
    await twilioPost("Services/"+TWILIO_VERIFY_SERVICE_SID+"/Verifications",{To:phone,Channel:"sms"});
    res.json({ok:true});
  }catch(e){
    console.error("AMS Fly phone send error",e);
    res.status(502).json({error:"verification_send_failed"});
  }
});

app.post("/phone/verify",async(req,res)=>{
  const phone=validPhone(req.body?.phone);
  const code=String(req.body?.code||"").trim();
  if(!phone||!/^\d{4,10}$/.test(code))return res.status(400).json({error:"invalid_verification"});
  if(!twilioReady())return res.status(503).json({error:"phone_verification_not_configured"});
  try{
    const result=await twilioPost("Services/"+TWILIO_VERIFY_SERVICE_SID+"/VerificationCheck",{To:phone,Code:code});
    if(result.status!=="approved")return res.status(400).json({error:"invalid_code"});
    await sql`update ams_fly_participants set phone_verified=true,updated_at=now() where phone=${phone}`;
    res.json({ok:true,phone_verified:true});
  }catch(e){
    console.error("AMS Fly phone verify error",e);
    res.status(502).json({error:"verification_check_failed"});
  }
});

app.get("/event",async(req,res)=>{
  try{
    const rows=await sql`select active,badge,title,description as desc,cta,prize_title as "prizeTitle",prize_description as "prizeDesc",condition_title as "conditionTitle",condition_description as "conditionDesc",wa_template as "waTemplate" from ams_fly_event_config where id=1`;
    res.json(rows[0]||{active:false});
  }catch(e){res.status(500).json({error:"event_read_failed"});}
});

app.put("/event",admin,async(req,res)=>{
  const b=req.body||{};
  const cfg={
    active:Boolean(b.active),
    badge:text(b.badge,80)||"🏆 EVENTO ESPECIAL 2026",
    title:text(b.title,120)||"¡Gana una Landing Page Gratis!",
    desc:text(b.desc,500),
    cta:text(b.cta,80)||"VER DETALLES DEL EVENTO",
    prizeTitle:text(b.prizeTitle,160),
    prizeDesc:text(b.prizeDesc,1000),
    conditionTitle:text(b.conditionTitle,160),
    conditionDesc:text(b.conditionDesc,1000),
    waTemplate:text(b.waTemplate,500)
  };
  try{
    await sql`insert into ams_fly_event_config (id,active,badge,title,description,cta,prize_title,prize_description,condition_title,condition_description,wa_template,updated_at)
      values (1,${cfg.active},${cfg.badge},${cfg.title},${cfg.desc},${cfg.cta},${cfg.prizeTitle},${cfg.prizeDesc},${cfg.conditionTitle},${cfg.conditionDesc},${cfg.waTemplate},now())
      on conflict (id) do update set active=excluded.active,badge=excluded.badge,title=excluded.title,description=excluded.description,cta=excluded.cta,prize_title=excluded.prize_title,prize_description=excluded.prize_description,condition_title=excluded.condition_title,condition_description=excluded.condition_description,wa_template=excluded.wa_template,updated_at=now()`;
    res.json({ok:true,...cfg});
  }catch(e){res.status(500).json({error:"event_write_failed"});}
});

app.get("/ranking",async(req,res)=>{
  const limit=Math.min(Math.max(Number(req.query.limit)||50,1),100);
  try{
    const rows=await sql`select player_name as name,country_code as country,bird_id as "birdId",score,message,created_at from ams_fly_scores order by score desc,created_at asc limit ${limit}`;
    res.json(rows);
  }catch(e){res.status(500).json({error:"ranking_read_failed"});}
});

app.post("/ranking",async(req,res)=>{
  const b=req.body||{},name=text(b.name,18),country=text(b.country,2),bird=text(b.birdId,32),message=text(b.message,90),score=validScore(b.score);
  if(name.length<2||!allowedCountries.has(country)||!allowedBirds.has(bird)||score===null||message.length<2)return res.status(400).json({error:"invalid_score"});
  try{
    await sql`insert into ams_fly_scores(player_name,country_code,bird_id,score,message) values(${name},${country},${bird},${score},${message})`;
    res.status(201).json({ok:true});
  }catch(e){res.status(500).json({error:"score_write_failed"});}
});

app.post("/participants",async(req,res)=>{
  const b=req.body||{},name=text(b.name,18),country=text(b.country,2),bird=text(b.birdId,32),phone=text(b.phone,30),score=validScore(b.score);
  if(name.length<2||!allowedCountries.has(country)||!allowedBirds.has(bird)||phone.replace(/\D/g,"").length<7)return res.status(400).json({error:"invalid_participant"});
  try{
    await sql`insert into ams_fly_participants(player_name,country_code,bird_id,phone,score) values(${name},${country},${bird},${phone},${score??0})
      on conflict(player_name,country_code) do update set bird_id=excluded.bird_id,phone=excluded.phone,score=greatest(ams_fly_participants.score,excluded.score),updated_at=now()`;
    res.status(201).json({ok:true});
  }catch(e){res.status(500).json({error:"participant_write_failed"});}
});

app.get("/participants",admin,async(req,res)=>{
  try{
    const rows=await sql`select player_name as name,country_code as country,bird_id as "birdId",phone,score,created_at,updated_at from ams_fly_participants order by score desc,updated_at asc`;
    res.json(rows);
  }catch(e){res.status(500).json({error:"participant_read_failed"});}
});

app.listen(port,()=>console.log("AMS Fly API listening on "+port));
