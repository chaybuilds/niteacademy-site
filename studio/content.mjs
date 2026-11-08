/* NiteAcademy original course catalog: fictional scenarios and practice-only rubrics. */
const L=(id,title,minutes,why,scenario,task,starter,checks)=>({id,title,minutes,why,scenario,task,starter,
checks:checks.map(([label,terms,tip])=>({label,terms,tip}))});
export const TRACKS=[
{id:"ai",title:"AI Operator",tag:"SYSTEMS / AI",symbol:"✳",color:"#cff1b6",
description:"Design AI workflows that are specific, tested, permissioned and auditable.",
outcome:"Prompt, evaluation plan and human handoff map",lessons:[
L("spec","Write the operator spec",16,"Define an outcome and acceptance criteria before selecting a model.",
"A fictional Raleigh cleaning customer sends a request but provides no date. No technician is booked.",
"Write an instruction for an AI-assisted customer reply that never invents availability.",
"Role:\nKnown inputs:\nRequired reply:\nDo not:\nHuman review:",
[["Identify known inputs",["input","city","raleigh","date"],"Name the fields actually available."],["Define the output",["reply","draft","email","response"],"Define the reply to generate."],["Prevent false booking",["not confirmed","availability","unconfirmed","do not book"],"Say the service is not booked."],["Add validation",["review","check","verify","approve"],"Define a human or quality check."]]),
L("eval","Evaluate failure cases",18,"One good answer isn't proof; test normal, missing and adversarial cases.",
"An AI replies 'your cleaner arrives tomorrow' although the date field is missing.",
"Design three independent tests, a pass/fail rule and escalation.",
"Normal case:\nMissing data:\nAdversarial case:\nPass rule:\nEscalation:",
[["Missing-data case",["missing","no date","unknown"],"Test absent critical data."],["Adversarial case",["adversarial","malicious","injection","contradict"],"Add a malicious or conflicting input."],["Pass criterion",["pass","fail","threshold","accuracy"],"Define an outcome threshold."],["Human escalation",["human","manual","escalate","review"],"Define when a human takes over."]]),
L("workflow","Build a recoverable workflow",20,"An automation needs event IDs, retries, access checks and observable results.",
"A fictional form receives duplicate leads while email delivery fails for ten minutes.",
"Specify trigger, idempotency, retry, audit and human ownership.",
"Trigger:\nPermission:\nDedupe key:\nRetry:\nAudit trail:\nHuman owner:",
[["Trigger",["trigger","webhook","form"],"Name the initiating event."],["Deduplicate",["duplicate","idempot","dedup"],"Avoid repeated actions."],["Failure recovery",["retry","queue","backoff","fail"],"Define retry and exception behavior."],["Audit evidence",["audit","log","proof","timestamp"],"Record what actually happened."]])
]},
{id:"sales",title:"Sales Intelligence",tag:"BUYERS / REVENUE",symbol:"↗",color:"#ffe0a6",
description:"Qualify real buying demand and test trustworthy, permission-aware outreach.",
outcome:"Buyer brief, honest message and conversion scorecard",lessons:[
L("buyer","Research a paying problem",16,"A prospect is not a confirmed buyer.",
"A fictional vacation-rental manager advertises 24 properties but has not requested a new cleaning vendor.",
"Separate verified facts from hypotheses and write a qualification question.",
"Observed evidence:\nHypothesis:\nBuyer/decision maker:\nQualifying question:\nDisqualify if:",
[["Evidence",["observed","listing","verified","evidence"],"Record a checkable fact."],["Uncertainty",["hypothesis","assume","might","unverified"],"Label guesses as guesses."],["Decision maker",["decision","buyer","vendor","who"],"Find who can authorize."],["Stop rule",["stop","disqual","not a fit","no need"],"Know when not to pursue."]]),
L("reach","Write a grounded offer",14,"Specific outreach is better than unsupported superlatives.",
"A fictional cafe might benefit from two original vertical videos. No price or interest has been agreed.",
"Write a concise first message with one factual observation and one question.",
"Hello...\nI noticed...\nThe offer...\nWould it help to...?",
[["Genuine relevance",["noticed","your menu","site","saw"],"Cite a real observation."],["Concrete offer",["video","package","content","deliver"],"Describe a scoped deliverable."],["Clear question",["?","would","could"],"Give a low-pressure next step."],["Avoid promises",["pilot","test","no guarantee","review"],"Do not guarantee revenue."]]),
L("funnel","Measure actual profit",18,"Activity, paid transactions and contribution are different.",
"Synthetic team: 80 outreach messages, 12 replies, 4 meetings, 1 paid $500 project, $325 direct costs.",
"Calculate response %, sale-to-contact %, contribution, then choose one measurable experiment.",
"Response rate:\nSale rate:\nContribution:\nNext experiment:",
[["Response rate",["15%","15 percent","12/80"],"12 divided by 80 is 15%."],["Sale rate",["1.25%","1.25 percent","1/80"],"1 divided by 80 is 1.25%."],["Contribution",["175","500-325","500 - 325"],"$500 less $325 equals $175."],["Experiment",["test","experiment","compare","hypothesis"],"Design a measurable change."]])
]},
{id:"earn",title:"Verified Earn Network",tag:"ONLINE / WORK",symbol:"◎",color:"#bad6ff",
description:"Evaluate buyer-funded remote opportunities without misleading payout claims.",
outcome:"Buyer-checklist, consent plan and payout ledger",lessons:[
L("proof","Verify a paying buyer",16,"An online task posting is not proof of available funds.",
"A fictional AI-data post quotes $25 per video but names no contracting company.",
"Draft a list of buyer verification and payment questions.",
"Buyer identity:\nScope:\nAcceptance rules:\nPayment terms:\nRed flag:",
[["Identity",["buyer","company","entity"],"Know who is buying."],["Acceptance",["accept","reject","criteria"],"Know what is approved."],["Payment timing",["pay","settle","invoice","terms"],"Know when funds clear."],["Risk",["risk","fraud","unverified","red flag"],"Know when not to recruit."]]),
L("rights","Respect contributor rights",16,"Permission and usage rights are prerequisites, not afterthoughts.",
"A fictional buyer wants videos with faces and voices, and might redistribute each clip.",
"Design a participant consent form outline and complaint process.",
"Data collected:\nInformed consent:\nReuse license:\nRetention:\nWithdrawal process:",
[["Scope",["video","face","voice","audio"],"Explain what will be recorded."],["Consent",["consent","permission","opt in"],"Get documented authorization."],["Rights",["license","usage","reuse","rights"],"Define downstream usage."],["Support",["withdraw","delete","contact","support"],"Document complaints/withdrawals."]]),
L("settle","Reconcile an approved batch",19,"Approved work may still be unpaid until the buyer actually settles.",
"Synthetic buyer approves 40 clips at $20, network fee 10%; buyer has not sent payment.",
"Calculate approved GMV, network fee, contributor pool and settlement status.",
"Approved volume:\nPlatform fee:\nContributor pool:\nSettlement:\nProof required:",
[["GMV",["800","40*20","40 x 20"],"40 clips × $20 = $800."],["Fee",["80","10%"],"10% of $800 = $80."],["Pool",["720","800-80","800 - 80"],"Contributor pool = $720."],["No early payout",["pending","not paid","settle","not yet"],"Approval is not settlement."]])
]},
{id:"creator",title:"Creator Studio",tag:"PRODUCTION / MEDIA",symbol:"▧",color:"#f1bdd9",
description:"Brief, deliver and quality-check licensed creative products.",
outcome:"Production brief, approval checklist and pricing math",lessons:[
L("brief","Make a creator brief",16,"A clear brief reduces conflict and unpriced revisions.",
"Fictional cafe requests two 15-second vertical videos of a new drink.",
"Specify audience, files, timeline, revisions, usage rights and review rules.",
"Audience:\n2 deliverables:\nTimeline:\nRevisions:\nUsage license:",
[["Audience",["audience","customer","viewer"],"Name the target viewer."],["Specs",["two","2","15","vertical"],"Specify length and format."],["Revision terms",["revision","round","deadline"],"Set edit limits."],["License",["rights","license","usage","permission"],"Agree where assets may be used."]]),
L("qa","Review the deliverable",18,"Buyer acceptance requires objective proof of delivery.",
"One fictional video is the wrong aspect ratio and includes unlicensed music.",
"Write pass/fail review notes and an approved handoff.",
"Format:\nCopyright:\nFix request:\nApproval evidence:",
[["Format",["aspect","ratio","vertical","format"],"Check technical specs."],["Rights",["copyright","license","music","rights"],"Do not publish unlicensed assets."],["Corrections",["fix","replace","revise","correct"],"Make feedback specific."],["Acceptance",["approve","accept","evidence","signoff"],"Record approval evidence."]]),
L("margin","Price a scoped package",15,"Price must cover labor, payment costs and change requests.",
"Fictional price $320; creator $160; editing $45; transaction/risk $15.",
"Compute direct costs, contribution and a fair revision policy.",
"Total costs:\nContribution:\nRevision allowance:\nNo-guarantee language:",
[["Costs",["220","160+45+15"],"Direct costs total $220."],["Contribution",["100","320-220","320 - 220"],"Unit contribution is $100."],["Revisions",["revision","round","limit"],"Specify scope."],["No fabricated results",["no guarantee","not guarantee","pilot"],"Don't promise reach."]])
]},
{id:"services",title:"Service Dispatch",tag:"LOCAL / OPERATIONS",symbol:"⌁",color:"#bcead0",
description:"Route cleaning, detailing and seasonal requests quickly and honestly.",
outcome:"Fast intake path, assignment SLA and job margin",lessons:[
L("intake","Preserve city and service",14,"People arriving from a local listing should not repeat their selections.",
"Fictional Raleigh customer clicks a NightClean listing and lands on a generic homepage.",
"Redesign the path with minimum fields and honest request status.",
"Entry path:\nRaleigh/service preselected:\nEssential fields:\nStatus message:",
[["Keep city",["raleigh","city"],"Preserve city context."],["Keep service",["clean","service","preselect"],"Preserve cleaning choice."],["Minimal fields",["name","phone","contact","minimum"],"Don't collect unnecessary details."],["Unconfirmed request",["request","availability","not confirmed"],"Do not fabricate bookings."]]),
L("sla","Escalate unanswered demand",18,"Fast confirmation means an accepted appointment, not just a bot reply.",
"Fictional request at 3:00, automatic acknowledgement 3:01, no supplier at 3:12.",
"Define response targets, provider confirmation and review escalation.",
"Received:\nAcknowledged:\nAssignment target:\nEscalation:\nMeasurement:",
[["Timed response",["3:01","minute","time","sla"],"Track acknowledgement."],["Unassigned case",["escalat","unassigned","overdue"],"Escalate unmatched work."],["Provider approval",["provider","accept","qualified"],"Never invent a technician."],["Outcome measurement",["metric","log","audit","timestamp"],"Capture actual data."]]),
L("profit","Track actual job contribution",18,"Invoice amount is not profit or cash in hand.",
"Fictional detail job: customer invoice $300, subcontractor $195, payment/quality risk $14.",
"Calculate margin, accounting position and risk.",
"Price:\nProvider cost:\nDirect cost:\nContribution:\nPrincipal or agent:\nRisk:",
[["Contribution",["91","300-195-14"],"$91 before overhead."],["Supplier cost",["195","provider","contractor"],"Include provider pay."],["Accounting role",["principal","agent","commission"],"Check gross versus net recognition."],["Risk",["damage","insurance","refund","dispute"],"Account for operational downside."]])
]},
{id:"venture",title:"Venture Builder",tag:"VALIDATION / 4D",symbol:"◇",color:"#e1d3fa",
description:"Test a problem, ship a minimal product and learn from actual outcomes.",
outcome:"Seven-day test, MVP scope and measured learning loop",lessons:[
L("validate","Prove a buyer problem",16,"A software stack isn't a business until someone wants the outcome.",
"Fictional founder proposes an AI property management OS with zero paying buyers.",
"Design a seven-day customer-discovery experiment and disqualification rule.",
"Target buyer:\nPain:\nHypothesis:\n7-day test:\nStop condition:",
[["Buyer",["buyer","customer","manager"],"Choose a buyer type."],["Problem",["pain","problem","cost","time"],"Name an expensive issue."],["Short test",["7 day","week","test","interview"],"Bound the test."],["Stop condition",["stop","fail","threshold"],"Define invalidating evidence."]]),
L("mvp","Ship a narrow MVP",20,"Start with one user job and a measurable outcome.",
"Fictional customer only needs an inquiry form connected to a CRM; the founder wants a full enterprise OS.",
"Write the minimum build and exclude everything not needed.",
"One user job:\nWorkflow:\nAcceptance test:\nExcluded features:\nApproval gate:",
[["One job",["lead","crm","single","one"],"Choose the smallest useful workflow."],["Acceptance criterion",["pass","test","measure"],"Define success."],["Excluded scope",["exclude","later","out of scope"],"Say what's not included."],["Safety gate",["consent","permission","review","secure"],"Require authorization."]]),
L("loop","Run a 4D feedback loop",18,"Past → present → possible futures → action → outcome.",
"Fictional baseline form conversion is 4%. New shorter form might reach 6%; no trial has run.",
"Write a prediction and a measurable experiment, without claiming the gain occurred.",
"Historical baseline:\nCurrent state:\nPredicted future:\nIntervention:\nObserved outcome:\nDecision rule:",
[["Observed baseline",["4%","baseline"],"Separate baseline from prediction."],["Future hypothesis",["6%","target","hypothesis"],"Do not call 6% achieved."],["Intervention",["shorter","form","experiment"],"Describe what to change."],["Measured outcome",["measure","observ","compare"],"Collect post-change evidence."]])
]}
];
export const GOALS=[
{id:"remote",title:"Find legitimate online paid work",trackIds:["earn","sales","ai","creator","venture","services"]},
{id:"ai",title:"Build AI agents and workflows",trackIds:["ai","venture","services","sales","earn","creator"]},
{id:"business",title:"Start a real business",trackIds:["venture","sales","ai","services","creator","earn"]},
{id:"creative",title:"Sell original creative services",trackIds:["creator","sales","venture","ai","earn","services"]},
{id:"local",title:"Build local-service operations",trackIds:["services","sales","ai","venture","earn","creator"]}
];
export const getTrack=id=>TRACKS.find(t=>t.id===id)||TRACKS[0];
export const allLessons=()=>TRACKS.flatMap(track=>track.lessons.map(lesson=>({track,lesson,key:track.id+":"+lesson.id})));
export function getLesson(key){const a=String(key).split(":"),t=TRACKS.find(x=>x.id===a[0]),l=t?.lessons.find(x=>x.id===a[1]);return t&&l?{track:t,lesson:l,key:a[0]+":"+a[1]}:null;}
export function evaluateDraft(lesson,answer){
 const text=String(answer||"").toLowerCase().normalize("NFKC").replace(/\s+/g," ").trim();
 const checks=lesson.checks.map(c=>({...c,pass:c.terms.some(x=>text.includes(x))}));
 const words=text.split(/\s+/).filter(Boolean).length;
 const score=Math.round(100*checks.filter(x=>x.pass).length/checks.length);
 return {checks,words,score,pass:words>=20&&score>=75};
}
export function getPlan(goalId,level,weeklyMinutes){
 const goal=GOALS.find(x=>x.id===goalId)||GOALS[0];
 const budget=Math.max(30,Math.min(480,Number(weeklyMinutes)||90));
 const weeks=goal.trackIds.slice(0,3).map((id,i)=>({track:getTrack(id),minutes:Math.round(budget*[.5,.3,.2][i])}));
 const guidance=level==="advanced"?"Collect evidence and measure real outcomes.":level==="some"?"Improve one existing process, then compare before and after.":"Begin with a low-risk fictional exercise.";
 return {goal,budget,weeks,guidance};
}
export function summary(completions={}){
 const all=allLessons(),done=all.filter(x=>completions[x.key]);
 return {done:done.length,total:all.length,percent:Math.round(100*done.length/all.length),xp:done.reduce((s,x)=>s+(completions[x.key].score||0),0)};
}
