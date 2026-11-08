// NiteAcademy hosted-model router — disabled by default, paid generation is gated.
// No arbitrary user-selected URLs, no tool calls, no public keys or public inference.
// Three fixed provider adapters are dormant until separate scoped secrets and limits exist.
const ALLOWED_ORIGINS=new Set([
  "https://chaybuilds.github.io",
  "https://niteacademy.com",
  "https://www.niteacademy.com",
  "http://localhost:8767",
  "http://127.0.0.1:8767"
]);
const PROVIDERS=new Set(["openai","anthropic","gemini"]);
const SYSTEM_PROMPT="You are NiteAcademy, a concise learning coach. Help learners reason through fictional exercises and give actionable, honest feedback. Do not invent paying buyers, employment, reviews, completed transactions, regulated advice or accreditation. Distinguish observed facts from hypothetical outcomes, and identify assumptions. Do not claim to have run tools or external lookups. Do not reveal confidential information.";
function env(name){return (Deno.env.get(name)||"").trim();}
function cors(request){
 const origin=request.headers.get("origin")||"";
 return ALLOWED_ORIGINS.has(origin)?{
   "access-control-allow-origin":origin,
   "vary":"Origin",
   "access-control-allow-headers":"authorization,content-type,apikey",
   "access-control-allow-methods":"GET,POST,OPTIONS"
 }:{};
}
function json(request,body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{
   ...cors(request),"content-type":"application/json; charset=utf-8",
   "cache-control":"no-store","x-content-type-options":"nosniff"
 }});
}
function getKeys(){
 let publicKey=env("SUPABASE_ANON_KEY");
 let secretKey=env("SUPABASE_SERVICE_ROLE_KEY");
 try{
  if(!publicKey)publicKey=JSON.parse(env("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||"";
  if(!secretKey)secretKey=JSON.parse(env("SUPABASE_SECRET_KEYS")||"{}").default||"";
 }catch{}
 return {publicKey,secretKey};
}
const isJwt=s=>typeof s==="string"&&/^eyJ[A-Za-z0-9_.-]{100,}$/.test(s);
const isUUID=s=>typeof s==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
async function getIdentity(jwt,url,key){
 const res=await fetch(url+"/auth/v1/user",{
  headers:{"apikey":key,"authorization":"Bearer "+jwt},
  signal:AbortSignal.timeout(9000)
 });
 if(!res.ok)return null;
 const user=await res.json();
 return isUUID(user?.id)?user.id:null;
}
async function reserveDaily(uid,url,key,userLimit,globalLimit){
 const headers={"apikey":key,"content-type":"application/json"};
 if(key.startsWith("eyJ"))headers.authorization="Bearer "+key;
 const res=await fetch(url+"/rest/v1/rpc/academy_ai_reserve",{
  method:"POST",headers,
  body:JSON.stringify({p_user_id:uid,p_max_user_per_day:userLimit,p_max_total_per_day:globalLimit}),
  signal:AbortSignal.timeout(9000)
 });
 if(!res.ok)return false;
 return (await res.json())===true;
}
async function callProvider(provider,prompt,model,key){
 const maxOutput=256;
 let url,headers,body;
 if(provider==="openai"){
  url="https://api.openai.com/v1/responses";
  headers={"content-type":"application/json","authorization":"Bearer "+key};
  body={model,max_output_tokens:maxOutput,input:[
   {role:"system",content:SYSTEM_PROMPT},
   {role:"user",content:prompt}
  ]};
 }else if(provider==="anthropic"){
  url="https://api.anthropic.com/v1/messages";
  headers={"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"};
  body={model,max_tokens:maxOutput,system:SYSTEM_PROMPT,messages:[{role:"user",content:prompt}]};
 }else{
  url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent";
  headers={"content-type":"application/json","x-goog-api-key":key};
  body={systemInstruction:{parts:[{text:SYSTEM_PROMPT}]},
   contents:[{role:"user",parts:[{text:prompt}]}],
   generationConfig:{maxOutputTokens:maxOutput,temperature:0.3}};
 }
 const res=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 if(!res.ok){console.error("NiteAcademy provider rejected request",provider,res.status);return {ok:false};}
 const result=await res.json();
 let output="";
 if(provider==="openai")output=String(result.output_text||result.output?.flatMap((x)=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n")||"");
 else if(provider==="anthropic")output=String((result.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("\n")||"");
 else output=String((result.candidates?.[0]?.content?.parts||[]).map(x=>x.text||"").join("\n")||"");
 return {ok:true,text:output.trim().slice(0,4600)};
}
Deno.serve(async request=>{
 if(request.method==="OPTIONS"){
  if(!ALLOWED_ORIGINS.has(request.headers.get("origin")||""))return json(request,{error:"origin_not_allowed"},403);
  return new Response(null,{status:204,headers:cors(request)});
 }
 if(request.method==="GET")return json(request,{
   product:"NiteAcademy hosted model gateway",
   state:env("NITEACADEMY_HOSTED_AI_ENABLED")==="true"?"restricted_beta":"locked",
   enabled:env("NITEACADEMY_HOSTED_AI_ENABLED")==="true" &&
     env("NITEACADEMY_ALLOWED_USER_IDS").split(",").some(x=>isUUID(x.trim())) &&
     Number(env("NITEACADEMY_USER_DAILY_REQUEST_CAP"))>=1 &&
     Number(env("NITEACADEMY_GLOBAL_DAILY_REQUEST_CAP"))>=1 &&
     ["OPENAI","ANTHROPIC","GEMINI"].some(p=>env("NITEACADEMY_"+p+"_API_KEY")&&env("NITEACADEMY_"+p+"_MODEL")),
   provider_adapters:["openai","anthropic","gemini"],
   requirements:["approved user session","dedicated provider secret","fixed provider model","daily quotas","explicit activation"],
   default_spend_usd:0,
   max_output_tokens:256,
   note:"Existing local learning coach and manual AI comparisons remain free and separate."
 });
 if(request.method!=="POST")return json(request,{error:"method_not_allowed"},405);
 const origin=request.headers.get("origin");
 if(origin&&!ALLOWED_ORIGINS.has(origin))return json(request,{error:"origin_not_allowed"},403);
 // No hidden fallback to the platform's other business-wide AI keys.
 if(env("NITEACADEMY_HOSTED_AI_ENABLED")!=="true")
   return json(request,{error:"hosted_ai_locked",message:"Hosted generation is not activated. Use the free coach or opt-in local WebLLM."},503);
 const userLimit=Number(env("NITEACADEMY_USER_DAILY_REQUEST_CAP"));
 const globalLimit=Number(env("NITEACADEMY_GLOBAL_DAILY_REQUEST_CAP"));
 const allowed=new Set(env("NITEACADEMY_ALLOWED_USER_IDS").split(",").map(x=>x.trim()).filter(isUUID));
 if(!allowed.size||!Number.isInteger(userLimit)||userLimit<1||userLimit>2||
    !Number.isInteger(globalLimit)||globalLimit<1||globalLimit>20)
   return json(request,{error:"strict_budget_or_identity_not_configured"},503);
 const bearer=request.headers.get("authorization")||"";
 const jwt=bearer.toLowerCase().startsWith("bearer ")?bearer.slice(7):"";
 if(!isJwt(jwt))return json(request,{error:"valid_session_required"},401);
 const url=env("SUPABASE_URL");
 const {publicKey,secretKey}=getKeys();
 if(!url||!publicKey||!secretKey)return json(request,{error:"identity_or_quota_backend_unavailable"},503);
 let uid;
 try{uid=await getIdentity(jwt,url,publicKey);}catch{return json(request,{error:"identity_check_unavailable"},503);}
 if(!uid)return json(request,{error:"valid_session_required"},401);
 if(!allowed.has(uid))return json(request,{error:"model_beta_access_not_authorized"},403);
 const length=Number(request.headers.get("content-length")||0);
 if(length>8000)return json(request,{error:"request_too_large"},413);
 let input;
 try{const raw=await request.text();if(raw.length>8000)throw Error("size");input=JSON.parse(raw);}catch{return json(request,{error:"invalid_request"},400);}
 const provider=input?.provider,prompt=input?.prompt;
 if(!PROVIDERS.has(provider)||typeof prompt!=="string"||prompt.trim().length<12||prompt.length>3000)
   return json(request,{error:"invalid_provider_or_prompt"},422);
 const suffix=provider.toUpperCase();
 const key=env("NITEACADEMY_"+suffix+"_API_KEY");
 const model=env("NITEACADEMY_"+suffix+"_MODEL");
 if(!key||!model||!/^[A-Za-z0-9_.:/-]{2,120}$/.test(model))
   return json(request,{error:"provider_not_configured"},503);
 let admitted=false;
 try{admitted=await reserveDaily(uid,url,secretKey,userLimit,globalLimit);}
 catch{return json(request,{error:"quota_guard_unavailable"},503);}
 if(!admitted)return json(request,{error:"daily_request_limit_reached"},429);
 try{
  const result=await callProvider(provider,prompt,model,key);
  if(!result.ok||!result.text)return json(request,{error:"provider_temporarily_unavailable"},502);
  return json(request,{provider,model,answer:result.text,notice:"Hosted AI response; independently verify consequential claims. Your quota is measured in requests, not dollars."});
 }catch{
  return json(request,{error:"provider_timeout_or_network_failure"},502);
 }
});
