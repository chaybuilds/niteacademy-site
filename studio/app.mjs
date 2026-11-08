import {TRACKS,GOALS,allLessons,getTrack,getLesson,evaluateDraft,getPlan,summary} from "./content.mjs";
const $=id=>document.getElementById(id);
const STORAGE_KEY="niteacademy_studio_2026_v1";
const defaults=()=>({version:1,goal:"remote",level:"new",minutes:90,planSet:false,completed:{},drafts:{}});
let state=defaults();
let activeFilter="all",activeLesson=null,lastEvaluation=null;
let localEngine=null,localModel="",modelLoading=false;
let isStorageAvailable=true;

function load(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return;
  const parsed=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||parsed.version!==1)return;
  state.goal=GOALS.some(g=>g.id===parsed.goal)?parsed.goal:"remote";
  state.level=["new","some","advanced"].includes(parsed.level)?parsed.level:"new";
  state.minutes=[45,90,180,360].includes(Number(parsed.minutes))?Number(parsed.minutes):90;
  state.planSet=Boolean(parsed.planSet);
  state.completed={};
  for(const {key} of allLessons()){
   const entry=parsed.completed?.[key];
   if(entry&&Number(entry.score)>=75&&Number(entry.score)<=100&&typeof entry.date==="string")
    state.completed[key]={score:Number(entry.score),date:entry.date};
  }
  state.drafts={};
  for(const {key} of allLessons()){
   if(typeof parsed.drafts?.[key]==="string")state.drafts[key]=parsed.drafts[key].slice(0,8000);
  }
 }catch{state=defaults();isStorageAvailable=false;}
}
function save(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
 catch{isStorageAvailable=false;return false;}
}
const safe=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setElementText(id,value){$(id).textContent=value;}
function formatDate(value){
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"Recorded";
}
function formatNumber(value){return new Intl.NumberFormat().format(value);}
function updateStats(){
 const s=summary(state.completed);
 $("metric-done").innerHTML=s.done+"<span>/"+s.total+"</span>";
 setElementText("metric-xp",formatNumber(s.xp));
 setElementText("metric-rate",s.percent+"%");
 setElementText("portfolio-count",s.done+" / "+s.total);
 $("portfolio-meter").style.width=s.percent+"%";
 setElementText("portfolio-caption",s.done? "You have "+s.done+" completed practice submission"+(s.done===1?"":"s")+". Practice feedback is not professional certification.":"No completed lessons yet. Open a track to start building your evidence journal.");
 renderPortfolio();
}
function renderPortfolio(){
 const host=$("completed-list");
 host.replaceChildren();
 const done=allLessons().filter(x=>Boolean(state.completed[x.key]));
 if(!done.length){const p=document.createElement("p");p.className="muted";p.textContent="Your completed practice sessions will appear here.";host.append(p);return;}
 for(const {track,lesson,key} of done){
  const entry=state.completed[key],item=document.createElement("div"),info=document.createElement("span"),mark=document.createElement("b");
  const title=document.createElement("strong"),detail=document.createElement("small");
  title.textContent=lesson.title;
  detail.textContent=track.title+" · "+formatDate(entry.date)+" · Practice only";
  mark.textContent=entry.score+"/100";
  info.append(title,detail);item.append(info,mark);host.append(item);
 }
}
function renderTracks(){
 const host=$("course-grid");host.replaceChildren();
 for(let i=0;i<TRACKS.length;i++){
  const t=TRACKS[i];
  if(activeFilter!=="all"&&activeFilter!==t.id)continue;
  const count=t.lessons.filter(l=>Boolean(state.completed[t.id+":"+l.id])).length;
  const card=document.createElement("article");card.className="course-card";card.style.setProperty("--course-tint",t.color);
  card.innerHTML=
   '<div class="course-top"><span class="course-glyph" aria-hidden="true">'+safe(t.symbol)+'</span><span class="course-id">TRACK '+String(i+1).padStart(2,"0")+' / 06</span></div>'+
   '<span class="course-label">'+safe(t.tag)+'</span><h3>'+safe(t.title)+'</h3>'+
   '<p>'+safe(t.description)+'</p><div class="course-meter"><i style="width:'+(count/t.lessons.length*100)+'%"></i></div>'+
   '<div class="course-meta"><span>'+count+'/'+t.lessons.length+' completed</span><span>'+t.lessons.reduce((a,l)=>a+l.minutes,0)+' min total</span></div>';
  const button=document.createElement("button");button.className="course-open";button.type="button";
  button.dataset.openTrack=t.id;
  button.setAttribute("aria-label","Open "+t.title+" curriculum");
  button.innerHTML='<span>Explore lessons</span><span aria-hidden="true">↗</span>';
  card.append(button);host.append(card);
 }
}
function showTrackPicker(id){
 const t=getTrack(id);
 const host=$("course-grid");
 const existing=host.querySelector("[data-track-detail]");
 if(existing)existing.remove();
 const block=document.createElement("article");
 block.className="course-detail panel";block.dataset.trackDetail=t.id;
 block.style.gridColumn="1 / -1";
 const intro=document.createElement("div");intro.className="course-detail-header";
 const text=document.createElement("div"),title=document.createElement("h3"),desc=document.createElement("p");
 title.textContent=t.title+" · choose a challenge";desc.textContent=t.outcome;
 text.append(title,desc);intro.append(text);
 const close=document.createElement("button");close.type="button";close.className="button button-outline button-small";close.textContent="Close";close.addEventListener("click",()=>block.remove());
 intro.append(close);block.append(intro);
 const list=document.createElement("div");list.className="lesson-pick-list";
 for(const [i,l] of t.lessons.entries()){
  const key=t.id+":"+l.id,btn=document.createElement("button");
  btn.type="button";btn.className="lesson-pick";btn.dataset.lesson=key;
  const done=Boolean(state.completed[key]);
  btn.innerHTML='<span class="pick-index">'+String(i+1).padStart(2,"0")+'</span>'+
  '<span class="pick-copy"><strong>'+safe(l.title)+'</strong><small>'+safe(l.why)+'</small></span>'+
  '<span class="pick-state">'+(done?"✓ DONE":l.minutes+" MIN")+'</span>';
  list.append(btn);
 }
 block.append(list);host.append(block);
 block.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center"});
}
function showLesson(key){
 const found=getLesson(key);
 if(!found)return;
 activeLesson=found;lastEvaluation=null;
 const t=found.track,l=found.lesson;
 setElementText("lesson-track",t.tag);
 setElementText("lesson-minutes","~"+l.minutes+" MIN");
 setElementText("lesson-title",l.title);
 setElementText("lesson-why",l.why);
 setElementText("lesson-scenario",l.scenario);
 setElementText("lesson-task",l.task);
 $("practice-draft").value=state.drafts[found.key]||"";
 $("complete-lesson").disabled=true;
 setElementText("practice-saved",state.completed[found.key]?"Previously completed. You can improve your answer.":"Drafts stay on this device.");
 $("practice-feedback").replaceChildren();
 const p=document.createElement("p");p.textContent="Write at least 20 words, then use Check my work. The checker gives transparent practice feedback; it does not substitute for a human evaluator."; $("practice-feedback").append(p);
 $("lesson").hidden=false;
 $("lesson").scrollIntoView({behavior:"smooth",block:"start"});
}
let draftSaveTimer=null;
function draftChanged(){
 lastEvaluation=null;$("complete-lesson").disabled=true;
 if(!activeLesson)return;
 state.drafts[activeLesson.key]=$("practice-draft").value.slice(0,8000);
 if(draftSaveTimer)clearTimeout(draftSaveTimer);
 draftSaveTimer=setTimeout(()=>{save();setElementText("practice-saved",isStorageAvailable?"Draft saved on this device.":"Local storage is unavailable. Copy your work before leaving.");},280);
}
function evaluateCurrent(){
 if(!activeLesson)return;
 const draft=$("practice-draft").value;
 const score=evaluateDraft(activeLesson.lesson,draft);
 lastEvaluation=score;
 const panel=$("practice-feedback");panel.replaceChildren();
 const heading=document.createElement("h4");
 heading.textContent="Practice rubric: "+score.score+"/100 · "+score.words+" words";
 panel.append(heading);
 const msg=document.createElement("p");msg.textContent=score.pass?"All required concepts are present for this practice challenge. Save your work, then consider a human review for production use.":"Practice check incomplete. Improve your answer using the missing criteria below (minimum 20 words).";panel.append(msg);
 const ul=document.createElement("ul");for(const c of score.checks){
  const li=document.createElement("li");li.className=c.pass?"passed":"needs-work";li.textContent=(c.pass?"✓ ":"○ ")+c.label+(c.pass?"":" — "+c.tip);ul.append(li);
 }
 panel.append(ul);
 $("complete-lesson").disabled=!score.pass;
 return score;
}
function completeCurrent(){
 if(!activeLesson||!lastEvaluation?.pass)return;
 const key=activeLesson.key;
 state.completed[key]={score:lastEvaluation.score,date:new Date().toISOString()};
 state.drafts[key]=$("practice-draft").value.slice(0,8000);
 save();updateStats();renderTracks();
 setElementText("practice-saved","Practice saved. "+(isStorageAvailable?"It will be here on your next visit.":"Storage is unavailable; export your work."));
 $("complete-lesson").disabled=true;
 const p=document.createElement("p");p.className="passed";p.textContent="Saved to your practice portfolio. These points reflect completing the rubric—not a job, certificate or externally reviewed qualification."; $("practice-feedback").append(p);
}
function renderPlan(){
 const plan=getPlan(state.goal,state.level,state.minutes);
 const host=$("plan-items");host.replaceChildren();
 for(let i=0;i<plan.weeks.length;i++){
  const item=plan.weeks[i],row=document.createElement("div");row.className="plan-item";
  const num=document.createElement("span");num.className="plan-step";num.textContent=String(i+1).padStart(2,"0");
  const details=document.createElement("span"),label=document.createElement("strong"),small=document.createElement("small");
  label.textContent=item.track.title;
  small.textContent="~"+item.minutes+" min/week · "+item.track.lessons[0].title;
  details.append(label,small);
  const btn=document.createElement("button");btn.type="button";btn.textContent="Open ↗";btn.dataset.planTrack=item.track.id;
  row.append(num,details,btn);host.append(row);
 }
 setElementText("plan-tag","3 PRIORITY TRACKS");
 setElementText("plan-guidance",plan.guidance+" These are recommendations, not predictions of revenue or employment.");
}
function setupPlan(){
 $("goal").value=state.goal;$("experience").value=state.level;$("minutes").value=String(state.minutes);
 if(state.planSet)renderPlan();
 $("path-form").addEventListener("submit",e=>{
  e.preventDefault();state.goal=$("goal").value;state.level=$("experience").value;state.minutes=Number($("minutes").value)||90;state.planSet=true;
  save();renderPlan();
  $("plan-items").scrollIntoView({behavior:"smooth",block:"nearest"});
 });
 $("plan-items").addEventListener("click",event=>{
  const btn=event.target.closest("[data-plan-track]");if(!btn)return;
  activeFilter="all";setTabs();renderTracks();showTrackPicker(btn.dataset.planTrack);
 });
}
function setTabs(){
 for(const b of $("track-filter").querySelectorAll("[data-track]")){
  const active=b.dataset.track===activeFilter;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));
 }
}
function setupLessons(){
 $("track-filter").addEventListener("click",e=>{
  const btn=e.target.closest("[data-track]");if(!btn)return;activeFilter=btn.dataset.track;setTabs();renderTracks();
 });
 $("course-grid").addEventListener("click",e=>{
  const lesson=e.target.closest("[data-lesson]"),track=e.target.closest("[data-open-track]");
  if(lesson)showLesson(lesson.dataset.lesson);
  else if(track)showTrackPicker(track.dataset.openTrack);
 });
 $("close-lesson").addEventListener("click",()=>{
  $("lesson").hidden=true;activeLesson=null;lastEvaluation=null;
  $("tracks").scrollIntoView({behavior:"smooth"});
 });
 $("fill-template").addEventListener("click",()=>{
  if(!activeLesson)return;
  const draft=$("practice-draft");
  if(draft.value.trim()&&!window.confirm("Replace your current draft with the original starter outline?"))return;
  draft.value=activeLesson.lesson.starter;draftChanged();draft.focus();
 });
 $("practice-draft").addEventListener("input",draftChanged);
 $("evaluate-draft").addEventListener("click",evaluateCurrent);
 $("complete-lesson").addEventListener("click",completeCurrent);
}
function download(filename,data,type){
 const blob=new Blob([data],{type});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function portfolioMarkdown(){
 const completed=allLessons().filter(x=>state.completed[x.key]),stats=summary(state.completed);
 let result="# NiteAcademy Studio — Personal Practice Portfolio\n\n";
 result+="Exported: "+new Date().toISOString()+"\n\n";
 result+="Practice exercises completed: "+stats.done+"/"+stats.total+"\nPractice XP: "+stats.xp+"\n\n";
 result+="This document is self-authored practice, not externally validated employment, credentials or earning history.\n\n";
 for(const item of completed){
  const record=state.completed[item.key];
  result+="## "+item.track.title+" / "+item.lesson.title+"\n\n";
  result+="Completed: "+record.date+" · Rubric: "+record.score+"/100 (automated practice criteria)\n\n";
  result+="### Fictional scenario\n"+item.lesson.scenario+"\n\n";
  result+="### Learner draft\n\n"+(state.drafts[item.key]||"(draft unavailable)")+"\n\n";
  result+="---\n\n";
 }
 if(!completed.length)result+="Complete a free lesson to create your first portfolio entry.\n";
 return result;
}
function setupExports(){
 $("export-markdown").addEventListener("click",()=>download("niteacademy-practice-portfolio.md",portfolioMarkdown(),"text/markdown;charset=utf-8"));
 $("export-json").addEventListener("click",()=>{
  const data={exported_at:new Date().toISOString(),notice:"Practice-only record, not evidence of verified earnings.",progress:state.completed,drafts:state.drafts,plan:{goal:state.goal,level:state.level,minutes:state.minutes}};
  download("niteacademy-practice-progress.json",JSON.stringify(data,null,2),"application/json;charset=utf-8");
 });
 $("import-json").addEventListener("click",()=> $("import-json-file").click());
 $("import-json-file").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  e.target.value="";
  if(file.size>1024*1024){setElementText("import-status","File exceeds the 1 MB import limit.");return;}
  try{
   const raw=await file.text();
   const doc=JSON.parse(raw);
   if(!doc||typeof doc!=="object"||Array.isArray(doc)||!doc.progress||typeof doc.progress!=="object"||Array.isArray(doc.progress))
    throw Error("This is not a NiteAcademy practice-progress export.");
   let added=0,updated=0;
   for(const {key} of allLessons()){
    const rec=doc.progress[key];
    if(!rec||typeof rec!=="object"||Number(rec.score)<75||Number(rec.score)>100||!Number.isInteger(Number(rec.score)))continue;
    const time=Date.parse(rec.date);
    if(!Number.isFinite(time)||time>Date.now()+86400000||time<946684800000)continue;
    const existing=state.completed[key];
    if(!existing||Number(rec.score)>Number(existing.score)){
     state.completed[key]={score:Number(rec.score),date:new Date(time).toISOString()};
     existing?updated++:added++;
    }
    const draft=doc.drafts?.[key];
    if(typeof draft==="string"&&draft.length<=8000&&!state.drafts[key])state.drafts[key]=draft;
   }
   if(doc.plan&&GOALS.some(g=>g.id===doc.plan.goal)){
    state.goal=doc.plan.goal;
    state.level=["new","some","advanced"].includes(doc.plan.level)?doc.plan.level:"new";
    state.minutes=[45,90,180,360].includes(Number(doc.plan.minutes))?Number(doc.plan.minutes):90;
    state.planSet=true;
    $("goal").value=state.goal;$("experience").value=state.level;$("minutes").value=String(state.minutes);
    renderPlan();
   }
   if(!save())throw Error("Browser storage is unavailable or full. Try exporting your existing progress before leaving.");
   updateStats();renderTracks();
   setElementText("import-status","Imported "+added+" new completed lesson(s), updated "+updated+" higher practice score(s). Existing progress was preserved.");
  }catch(error){
   setElementText("import-status","Import rejected: "+String(error.message||error).slice(0,220));
  }
 });
 $("reset-progress").addEventListener("click",()=>{
  if(!window.confirm("Erase all progress, practice drafts, learning preferences and model comparisons stored by NiteAcademy in this browser? Export first if you want a backup."))return;
  try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem("niteacademy_model_arena_v1");}
  catch{}
  location.reload();
 });
}
function offlineCoach(question){
 const q=question.toLowerCase(),focus=activeLesson?.lesson;
 const themes=[
  {test:/pay|earn|buyer|project|job|task|client/,answer:"Before promising work, verify buyer identity, a written scope, acceptance rules, payment terms, and actual settlement. Mark unverified projects as leads, not jobs."},
  {test:/price|profit|margin|money|fee|cost|mrr|arr/,answer:"Separate transaction volume, recognized revenue, direct costs and operating expense. Run a conservative/base/upside sensitivity analysis and update from real transactions."},
  {test:/prompt|agent|ai|model|automate|workflow/,answer:"Define the job-to-be-done, known inputs, expected output, permissions, validation and human escalation. Test missing data and duplicates before connecting actions."},
  {test:/video|clip|content|creator|editing/,answer:"Write an original brief with audience, deliverable specs, licensed assets, revisions and buyer acceptance evidence. Never claim real customer results that are unverified."},
  {test:/clean|detail|service|appointment|dispatch/,answer:"Preserve city/service context from the inbound link, collect minimal fields, acknowledge quickly and wait for qualified provider acceptance before confirming a booking."},
  {test:/lead|sales|outreach|pitch|cold/,answer:"Find evidence of fit, identify a likely decision-maker and offer one scoped next step. Report response and conversion rates, not outreach count alone."}
 ];
 const theme=themes.find(t=>t.test.test(q));
 const topic=theme?.answer||"Choose one concrete result, write down the evidence you already have, create a small test, and define what would disprove your assumption.";
 const extra=focus?"\n\nCurrent lesson: "+focus.title+"\nPractice objective: "+focus.task+"\nStart by using these sections:\n"+focus.starter:"\n\nNext step: select a free lesson and compare your answer against its transparent rubric.";
 return "STRUCTURED PRACTICE COACH (NOT A GENERATIVE AI RESPONSE)\n\n"+topic+extra+"\n\n4D check: What is observed now? What would change? What action will you take? What measured outcome would confirm success?";
}
function setupCoach(){
 const mode=$("coach-mode"),button=$("coach-respond"),load=$("load-model");
 function sync(){
  const isLocal=mode.value==="local";
  load.hidden=!isLocal||Boolean(localEngine);
  button.disabled=isLocal&&!localEngine;
  setElementText("coach-status",isLocal?(localEngine?"LOCAL MODEL READY":"LOCAL MODEL NOT STARTED"):"RUBRIC MODE · FREE");
  setElementText("coach-info",isLocal?"Real optional browser-local inference downloads an open model and uses WebGPU on your device. No external paid provider API key is required.":"This structured coach is an original rule-based learning aid. It is not a generative AI model and does not send your question to a provider.");
  setElementText("model-warning",isLocal?"Only download a model on a device with sufficient GPU memory, storage and stable connectivity. Model downloads may be hundreds of MB to several GB.":"The optional open-source model is never loaded unless you choose it.");
 }
 mode.addEventListener("change",sync);
 button.addEventListener("click",async()=>{
  const question=$("coach-question").value.trim();
  if(question.length<10){$("coach-response").textContent="Please write a specific question of at least 10 characters.";return;}
  if(mode.value==="rubric"){$("coach-response").textContent=offlineCoach(question);return;}
  if(!localEngine){$("coach-response").textContent="Start the local model first, or choose the always-available practice coach.";return;}
  button.disabled=true;
  $("coach-response").textContent="Generating locally with "+localModel+"...";
  try{
   const context=activeLesson?"Current lesson: "+activeLesson.lesson.title+"\nTask: "+activeLesson.lesson.task+"\n":"";
   const result=await localEngine.chat.completions.create({messages:[
    {role:"system",content:"You are a concise, evidence-focused tutor for NiteAcademy. Help learners reason, give actionable and cautious feedback. Do not invent real buyers, income, licenses, credentials, provider integrations, or guaranteed results. Keep explanations under 250 words. Challenge unsupported claims and distinguish simulated from real outcomes."},
    {role:"user",content:context+question.slice(0,2400)}
   ],temperature:0.35,max_tokens:330});
   const answer=result?.choices?.[0]?.message?.content;
   $("coach-response").textContent=(typeof answer==="string"&&answer.trim()?answer:"No response returned by the local model.")+"\n\n[Generated locally using "+localModel+". Verify important claims independently.]";
  }catch(error){$("coach-response").textContent="Local model could not complete the request: "+String(error?.message||error).slice(0,210)+"\nTry the free structured coach instead.";}
  finally{button.disabled=false;}
 });
 load.addEventListener("click",async()=>{
  if(modelLoading||localEngine)return;
  modelLoading=true;load.disabled=true;load.textContent="Checking browser...";
  const response=$("coach-response");
  try{
   if(!window.isSecureContext||!navigator.gpu)throw Error("This browser does not expose WebGPU. Choose the free structured coach or use a compatible, GPU-capable browser.");
   const adapter=await navigator.gpu.requestAdapter();
   if(!adapter)throw Error("No compatible GPU adapter is available on this device.");
   response.textContent="Loading the open-source runtime. No premium vendor API will be called.";
   const webllm=await import("https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.87/+esm");
   const options=(webllm.prebuiltAppConfig?.model_list||[]).filter(m=>/0\.5B|0\.6B|1B|1\.5B/i.test(String(m.model_id)));
   options.sort((a,b)=>(Number(a.vram_required_MB)||9999)-(Number(b.vram_required_MB)||9999));
   const selected=options[0];
   if(!selected)throw Error("This runtime did not advertise a small compatible prebuilt model.");
   if(!window.confirm("Download "+selected.model_id+" for browser-local AI? This may use substantial network data, device memory and disk cache."))throw Error("Model download cancelled; no model was loaded.");
   response.textContent="Downloading open-source model: "+selected.model_id+". Keep this tab open.";
   const engine=await webllm.CreateMLCEngine(selected.model_id,{initProgressCallback:p=>{
    if(p?.text)response.textContent="Local model setup: "+String(p.text).slice(0,200);
   }});
   localEngine=engine;localModel=selected.model_id;
   response.textContent="Local AI is ready. Enter a question and click Get coaching. Processing will occur on this device.";
  }catch(error){
   response.textContent="Local model unavailable: "+String(error?.message||error).slice(0,290)+"\n\nThe free structured coach and lessons still work without GPU or downloads.";
  }finally{modelLoading=false;load.disabled=false;load.textContent="Download & start local model";sync();}
 });
 sync();
}
function setupHostedGateway(){
 const button=$("hosted-gateway-check"),status=$("hosted-gateway-status");
 if(!button||!status)return;
 button.addEventListener("click",async()=>{
  button.disabled=true;
  status.textContent="Checking the secured Academy AI gateway...";
  try{
   const resp=await fetch("https://succvbtctjkzsowotcsy.supabase.co/functions/v1/academy-model-gateway",{
    method:"GET",headers:{"accept":"application/json"},cache:"no-store"
   });
   if(!resp.ok)throw Error("Gateway check returned HTTP "+resp.status);
   const data=await resp.json();
   status.textContent=data?.enabled===false?
    "Verified: secure gateway deployed; paid model generation LOCKED. Zero provider API requests are activated.":
    "Gateway reports a changed activation state. An authenticated, approved account and documented spending limit are still required.";
  }catch{
   status.textContent="Live gateway status is temporarily unavailable. The free practice coach and external model comparison still work.";
  }finally{button.disabled=false;}
 });
}
function init(){
 load();setupPlan();setupLessons();setupExports();setupCoach();setupHostedGateway();updateStats();renderTracks();
 window.addEventListener("error",event=>{
  if(event.message?.includes("ResizeObserver loop"))event.preventDefault();
 });
}
init();
