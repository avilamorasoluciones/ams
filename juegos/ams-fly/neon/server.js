import express from "express";
import { neon } from "@neondatabase/serverless";

const app=express();
const port=Number(process.env.PORT||3000);
const sql=neon(process.env.DATABASE_URL);
const ADMIN_TOKEN=process.env.ADMIN_TOKEN||"";
const CORS_ORIGIN=process.env.CORS_ORIGIN||"*";
const allowedCountries=new Set(["CO","VE","EC","US","MX","AR","CL","PE","BR","PA"]);
const allowedBirds=new Set(["condor-co","turpial","condor-ec","eagle-us","eagle-mx","hornero","condor-cl","cock-rock","sabia","harpia"]);

app.use(express.json({limit:"16kb"}));
app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin",CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS");
  if(req.method==="OPTIONS")return res.sendStatus(204);
  next();
});

function admin(req,res,next){
  const token=(req.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!ADMIN_TOKEN||token!==ADMIN_TOKEN)return res.status(401).json({error:"Unauthorized"});
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
