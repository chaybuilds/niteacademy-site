import {allLessons,getLesson,evaluateDraft} from "./content.mjs";
const root="niteacademy_model_arena_v1";
const $=id=>document.getElementById(id);
const PROVIDERS={
 chatgpt:{label:"OpenAI ChatGPT",url:"https://chatgpt.com/"},
 claude:{label:"Anthropic Claude",url:"https://claude.ai/"},
 gemini:{label:"Google Gemini",url:"https://gemini.google.com/app"},
 mistral:{label:"Mistral Vibe",url:"https://chat.mistral.ai/"},
 qwen:{label:"Qwen Chat",url:"https://chat.qwen.ai/"}
};
let history=[];
try{
 const data=JSON.parse(localStorage.getItem(root)||"[]");
 if(Array.isArray(data))history=data.filter(r=>r&&PROVIDERS[r.provider]&&getLesson(r.lessonKey)&&Number.isFinite(r.score)).slice(0,50);
}catch{}
const select=$("arena-lesson");
for(const {track,lesson,key} of allLessons()){
 const o=document.createElement("option");
 o.value=key;o.textContent=track.title+" / "+lesson.title;select.append(o);
}
function makePacket(){
 const info=getLesson(select.value)||allLessons()[0],lesson=info.lesson;
 const lines=[
 "NITEACADEMY / OPEN MODEL COMPARISON — SYNTHETIC LEARNING EXERCISE",
 "This is a fictional scenario, not an actual order, customer, paid task, or income claim.",
 "",
 "LESSON: "+info.track.title+" — "+lesson.title,
 "CONTEXT: "+lesson.why,
 "FICTIONAL CASE: "+lesson.scenario,
 "YOUR TASK: "+lesson.task,
 "",
 "Deliver a practical, structured answer a beginner can evaluate.",
 "Rubric checklist: "+lesson.checks.map(x=>x.label).join("; ")+".",
 "Distinguish observation, assumptions and proposed actions.",
 "Do not invent buyers, revenue, facts, professional credentials or payment evidence.",
 "If information is missing, explain the gap and suggest how to verify it.",
 "Keep the answer specific, original and concise."
 ];
 return lines.join("\n");
}
function updatePacket(){
 $("arena-packet").value=makePacket();
 const p=PROVIDERS[$("arena-provider").value]||PROVIDERS.chatgpt;
 const link=$("arena-open");link.href=p.url;link.textContent="Open "+p.label+" ↗";
 $("arena-answer").value="";
 $("arena-feedback").textContent="Paste the model answer here. Scores reflect simple rubric coverage, not truth, reasoning quality or provider verification.";
}
function render(){
 const host=$("arena-history-list");
 host.replaceChildren();
 if(!history.length){const p=document.createElement("p");p.className="muted";p.textContent="Your comparisons will appear here after evaluation.";host.append(p);return;}
 for(const r of history){
  const entry=document.createElement("div"),info=document.createElement("div"),name=document.createElement("strong"),note=document.createElement("small"),stat=document.createElement("b");
  name.textContent=(PROVIDERS[r.provider]?.label||"Unknown provider")+" · "+(getLesson(r.lessonKey)?.lesson.title||"Practice");
  const d=new Date(r.date),date=Number.isFinite(d.getTime())?d.toLocaleDateString():"Recorded";
  note.textContent=date+" · "+r.words+" words · manually supplied result";
  stat.textContent=r.score+"/100";
  info.append(name,note);entry.className="arena-entry";entry.append(info,stat);host.append(entry);
 }
}
select.addEventListener("change",updatePacket);
$("arena-provider").addEventListener("change",updatePacket);
$("arena-copy").addEventListener("click",async()=>{
 const packet=$("arena-packet");
 try{
  if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(packet.value);
  else{packet.focus();packet.select();if(!document.execCommand("copy"))throw new Error("copy not supported");}
  $("arena-copy-status").textContent="Copied the fictional task packet. Open your selected AI tool and paste it there. No NiteAcademy API key was used.";
 }catch{
  packet.focus();packet.select();
  $("arena-copy-status").textContent="Clipboard permission unavailable. The prompt is selected so you can manually copy it.";
 }
});
$("arena-score").addEventListener("click",()=>{
 const response=$("arena-answer").value.trim();
 if(response.length<40){$("arena-feedback").textContent="Paste a model answer of at least 40 characters. Do not include customer or private information.";return;}
 const lesson=getLesson(select.value);
 if(!lesson)return;
 const result=evaluateDraft(lesson.lesson,response);
 const p=PROVIDERS[$("arena-provider").value];
 $("arena-feedback").textContent="Rubric coverage: "+result.score+"/100 ("+result.checks.filter(c=>c.pass).length+" of 4 concepts; "+result.words+" words). "+
 (result.pass?"The answer contains the expected phrases for this practice case.":"The answer needs more of the expected concepts or at least 20 words.")+
 " This is a keyword-based practice comparison, NOT an independently verified model-quality score.";
 history.unshift({provider:$("arena-provider").value,lessonKey:lesson.key,score:result.score,words:result.words,date:new Date().toISOString()});
 history=history.slice(0,50);
 try{localStorage.setItem(root,JSON.stringify(history));}catch{}
 render();
});
$("arena-clear").addEventListener("click",()=>{
 if(!history.length)return;
 if(!window.confirm("Clear all locally recorded model comparisons?"))return;
 history=[];try{localStorage.removeItem(root);}catch{}
 render();
 $("arena-feedback").textContent="All local comparisons cleared. Your lesson progress is unaffected.";
});
$("arena-export").addEventListener("click",()=>{
 const data={notice:"Manually supplied outputs; keyword rubric only. Not a verified model benchmark.",exported_at:new Date().toISOString(),comparisons:history};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="niteacademy-model-comparisons.json";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
});
updatePacket();render();
