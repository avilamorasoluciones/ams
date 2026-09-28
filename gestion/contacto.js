(()=>{const p=location.pathname,isGestion=p.includes("/gestion/"),isRoot=p.endsWith("/gestion/")||p.endsWith("/gestion/index.html");if(!isGestion)return;if(!isRoot&&sessionStorage.amsGestionAuth!=="1"){location.replace("../index.html");return}
const CK="ams_clients_v2",PK="ams_projects_v2",FK="ams_finance_v2",TK="ams_process_v1",MK="ams_store_migrated_v2";
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),arr=k=>{const v=read(k);return Array.isArray(v)?v:[]};
const localToday=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const uid=p=>p+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
const text=v=>String(v??"").trim();
const same=(a,b)=>{a=text(a).toLowerCase();b=text(b).toLowerCase();return !!a&&!!b&&a===b};
function clientKey(c){return text(c.email).toLowerCase()||text(c.company).toLowerCase()}
function normalizeClient(c){const s=c.subscription||{};return Object.assign({id:uid("cli"),company:"",contact:"",email:"",phone:"",country:"Colombia",city:"",address:"",webType:"",domain:"",url:"",hosting:"",created:new Date().toISOString(),updated:new Date().toISOString(),subscription:{price:0,currency:"USD",period:"monthly",start:"",due:"",grace:7,lastPayment:"",suspended:false}},c,{subscription:Object.assign({price:0,currency:"USD",period:"monthly",start:"",due:"",grace:7,lastPayment:"",suspended:false},s)})}
function normalizeProject(p){return Object.assign({id:uid("pro"),clientId:"",client:"",project:"",email:"",phone:"",service:"Landing / web",stage:"Lead",price:0,currency:"USD",domain:"",domainStatus:"No definido",staging:"",url:"",deadline:"",next:"",notes:"",created:new Date().toISOString(),updated:new Date().toISOString()},p)}
function normalizeFinance(x){return Object.assign({id:uid("fin"),type:"Gasto",currency:"USD",amount:0,date:localToday(),clientId:"",projectId:"",party:"",category:"Otro",description:"",recurring:"no",ref:"",created:new Date().toISOString()},x)}
function writeMirrors(){
 const cs=arr(CK),ps=arr(PK),fs=arr(FK);
 write("ams_subscriptions_v1",cs.map(c=>{const s=c.subscription||{};return {id:c.id,company:c.company,contact:c.contact,email:c.email,phone:c.phone,country:c.country,webType:c.webType,domain:c.domain,url:c.url,hosting:c.hosting,price:Number(s.price||0),currency:s.currency||"USD",period:s.period||"monthly",start:s.start||"",due:s.due||"",grace:Number(s.grace||7),suspended:!!s.suspended,created:c.created,lastPayment:s.lastPayment||""}}));
 write("ams_ops_projects_v1",ps);
 write("ams_cash_v1",fs);
 write("ams_ops_expenses_v1",fs.filter(x=>x.type==="Gasto").map(x=>({id:x.id,concept:x.description||"Sin concepto",vendor:x.party||"",project:x.projectId||"",category:x.category||"Otro",amount:Number(x.amount||0),currency:x.currency||"USD",date:x.date||localToday(),recurring:x.recurring==="yes"?"Mensual":"No recurrente",ref:x.ref||""})));
}
function migrate(){
 if(read(MK))return;
 let clients=arr("ams_subscriptions_v1").map(x=>normalizeClient({id:"cli_"+x.id,company:x.company,contact:x.contact,email:x.email,phone:x.phone,country:x.country||"Colombia",webType:x.webType,domain:x.domain,url:x.url,hosting:x.hosting,created:x.created||new Date().toISOString(),subscription:{price:Number(x.price||0),currency:x.currency||"USD",period:x.period||"monthly",start:x.start||"",due:x.due||"",grace:Number(x.grace||7),lastPayment:x.lastPayment||"",suspended:!!x.suspended}}));
 const byKey=new Map();clients.forEach(c=>{const k=clientKey(c);if(k)byKey.set(k,c.id)});
 const projects=[];
 arr("ams_ops_projects_v1").forEach(old=>{let key=text(old.email).toLowerCase()||text(old.client).toLowerCase(),cid=byKey.get(key);if(!cid){const c=normalizeClient({company:old.client,email:old.email,phone:old.phone||"",webType:old.service||"",domain:old.domain||"",url:old.url||"",created:old.created||new Date().toISOString()});clients.push(c);cid=c.id;const k=clientKey(c);if(k)byKey.set(k,cid)}projects.push(normalizeProject(Object.assign({},old,{clientId:cid})))});
 const finance=[];const seen=new Set();const projectIdFor=v=>{const k=text(v);if(!k)return"";const p=projects.find(q=>q.id===k||same(q.project,k)||same(q.client,k));return p?p.id:""};
 arr("ams_cash_v1").forEach(x=>{const f=normalizeFinance(x),k=[f.date,f.type,f.currency,f.amount,f.description,f.party].join("|");if(!seen.has(k)){seen.add(k);finance.push(f)}});
 arr("ams_ops_expenses_v1").forEach(x=>{const f=normalizeFinance({id:x.id?"fin_"+x.id:undefined,type:"Gasto",currency:x.currency||"USD",amount:Number(x.amount||0),date:x.date||localToday(),party:x.vendor||"",category:x.category||"Otro",description:x.concept||"",recurring:x.recurring&&x.recurring!=="No recurrente"?"yes":"no",ref:x.ref||"",projectId:projectIdFor(x.project)}),k=[f.date,f.type,f.currency,f.amount,f.description,f.party].join("|");if(!seen.has(k)){seen.add(k);finance.push(f)}});
 write(CK,clients);write(PK,projects);write(FK,finance);write(TK,read(TK)||{});write(MK,{at:new Date().toISOString(),version:2});writeMirrors();
}
migrate();
const api={
 version:2,
 today:localToday,
 clients:()=>arr(CK).map(normalizeClient),
 saveClients:v=>{write(CK,v.map(normalizeClient));writeMirrors();return api.clients()},
 upsertClient(c){const a=arr(CK).map(normalizeClient),x=normalizeClient(c),i=a.findIndex(y=>y.id===x.id),sameIdx=i>-1?i:a.findIndex(y=>same(clientKey(y),clientKey(x)));x.updated=new Date().toISOString();if(sameIdx>-1){x.id=a[sameIdx].id;a[sameIdx]=Object.assign(a[sameIdx],x,{subscription:Object.assign({},a[sameIdx].subscription,x.subscription)})}else a.push(x);write(CK,a);writeMirrors();return a.find(y=>y.id===(sameIdx>-1?a[sameIdx].id:x.id))},
 findClient(id){return api.clients().find(c=>c.id===id)},
 deleteClient(id){const a=arr(CK).filter(c=>c.id!==id);write(CK,a);const p=arr(PK).map(normalizeProject);p.forEach(x=>{if(x.clientId===id)x.clientId=""});write(PK,p);writeMirrors();},
 projects:()=>arr(PK).map(normalizeProject),
 saveProjects:v=>{write(PK,v.map(normalizeProject));writeMirrors();return api.projects()},
 upsertProject(p){const a=arr(PK).map(normalizeProject),x=normalizeProject(p),i=a.findIndex(y=>y.id===x.id);x.updated=new Date().toISOString();if(i>-1)a[i]=Object.assign(a[i],x);else a.push(x);write(PK,a);writeMirrors();return x},
 findProject(id){return api.projects().find(p=>p.id===id)},
 finance:()=>arr(FK).map(normalizeFinance),
 saveFinance:v=>{write(FK,v.map(normalizeFinance));writeMirrors();return api.finance()},
 addFinance(x){const a=api.finance(),f=normalizeFinance(x);a.push(f);write(FK,a);writeMirrors();return f},
 deleteFinance(id){write(FK,arr(FK).filter(x=>x.id!==id).map(normalizeFinance));writeMirrors()},
 tasks:()=>read(TK)||{},
 setTask(projectId,key,value){const all=read(TK)||{};all[projectId]=all[projectId]||{};all[projectId][key]=!!value;write(TK,all);return all[projectId]},
 projectTasks(projectId){return Object.assign({},(read(TK)||{})[projectId]||{})},
 removeTask(projectId){const all=read(TK)||{};delete all[projectId];write(TK,all)},
 advanceDue(base,period){let d=new Date(text(base)||localToday()+"T12:00:00");if(isNaN(d))d=new Date();const day=d.getDate();if(period==="annual"){d.setFullYear(d.getFullYear()+1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}d.setDate(1);d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")},
 subscriptionStatus(c){const s=c.subscription||{},d=new Date((s.due||localToday())+"T12:00:00"),n=Math.ceil((d-new Date())/86400000),gr=Number(s.grace||0);if(s.suspended)return {key:"suspended",days:n,label:"Suspendido"};if(n<0&&n>=-gr)return {key:"grace",days:n,label:"En gracia"};if(n<0)return {key:"overdue",days:n,label:"Vencido"};if(n<=7)return {key:"pending",days:n,label:"Por vencer"};return {key:"active",days:n,label:"Activo"}},
 recordPayment(clientId,date){const a=arr(CK).map(normalizeClient),i=a.findIndex(c=>c.id===clientId);if(i<0)throw Error("Cliente no encontrado");const c=a[i],s=c.subscription||{},paid=date||localToday();if(s.lastPayment===paid)throw Error("Este pago ya figura registrado para hoy.");const baseText=s.due&&new Date(s.due+"T12:00:00")>new Date(paid+"T12:00:00")?s.due:paid;s.lastPayment=paid;s.due=api.advanceDue(baseText,s.period);c.subscription=s;c.updated=new Date().toISOString();a[i]=c;write(CK,a);writeMirrors();return c},
 backup(){const local={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||"";if(k.startsWith("ams_doc_")||k==="ams_calc_v3")local[k]=localStorage.getItem(k)}return {version:3,date:new Date().toISOString(),clients:api.clients(),projects:api.projects(),finance:api.finance(),tasks:api.tasks(),local}},
 restore(d){if(!d||!Array.isArray(d.clients)||!Array.isArray(d.projects)||!Array.isArray(d.finance))throw Error("Respaldo inválido");for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||"";if(k.startsWith("ams_doc_")||k==="ams_calc_v3")localStorage.removeItem(k)}write(CK,d.clients.map(normalizeClient));write(PK,d.projects.map(normalizeProject));write(FK,d.finance.map(normalizeFinance));write(TK,d.tasks&&typeof d.tasks==="object"?d.tasks:{});if(d.local&&typeof d.local==="object")Object.keys(d.local).forEach(k=>{if(k.startsWith("ams_doc_")||k==="ams_calc_v3")localStorage.setItem(k,String(d.local[k]))});write(MK,{at:new Date().toISOString(),version:4});writeMirrors();return true}};
window.AMSStore=api;
})();