
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
const client = createClient("https://succvbtctjkzsowotcsy.supabase.co", "sb_publishable_0TNBWdAUGNot0IxoyFDpEw_9bRDTOVu", {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $ = id=>document.getElementById(id);
const panels=["landing-view","auth-view","dashboard-view"];
let authMode="signup", currentUser=null, profile=null, review=null, request=null, allocations=[], ledger=[], statements=[], reports=[];
let loading=false;
const money = v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);
function view(id){panels.forEach(x=>$(x).hidden=x!==id);$("signin-button").hidden=id==="dashboard-view";$("topbar-guest").hidden=id==="dashboard-view";$("topbar-seller").hidden=id!=="dashboard-view";window.scrollTo(0,0);}
function showFeedback(text,type,id){const node=$(id);node.textContent=text;node.className="feedback "+(type||"");}
function switchAuth(mode){authMode=mode;$("auth-form").reset();$("signup-fields").hidden=mode!=="signup";$("signup-consent").hidden=mode!=="signup";$("auth-title").textContent=mode==="signup"?"Create your free account.":"Welcome back.";$("auth-button").textContent=mode==="signup"?"Create account":"Sign in";$("auth-switch").textContent=mode==="signup"?"I already have an account":"Create a free account";showFeedback("","","auth-feedback");view("auth-view");}
$("start-button").addEventListener("click",()=>switchAuth("signup"));
$("signin-button").addEventListener("click",()=>switchAuth("login"));
$("auth-switch").addEventListener("click",()=>switchAuth(authMode==="signup"?"login":"signup"));
$("auth-back").addEventListener("click",()=>view("landing-view"));
$("signout").addEventListener("click",async()=>{await client.auth.signOut();currentUser=null;profile=null;view("landing-view");});

for(const [id,academyPath] of [["choose-starter","starter"],["choose-elite","elite"]]){
 $(id).addEventListener("click",async()=>{
  if(!currentUser||!profile)return;
  const button=$(id);button.disabled=true;showFeedback("Saving your route…","","path-feedback");
  try{
   const {data,error}=await client.from("nite_academy_profiles")
    .update({academy_path:academyPath,updated_at:new Date().toISOString()})
    .eq("user_id",currentUser.id).select("academy_path,updated_at").single();
   if(error)throw error;
   profile={...profile,academy_path:data.academy_path,updated_at:data.updated_at};
   renderDashboard();
   showFeedback(academyPath==="starter"?"Free Starter chosen. Your next step is to create your own Amazon Individual seller account.":"Professional route chosen. You can use the Professional seller plan, but NITERUN's OAuth connection is not yet active.","ok","path-feedback");
  }catch(error){showFeedback("Could not save your route. Please try again.","error","path-feedback");}
  finally{button.disabled=false;}
 });
}

function getAuthDraft(){return {display_name:$("full-name").value.trim(),experience:$("experience").value,consent_to_contact:$("contact-consent").checked,consent_at:$("contact-consent").checked?new Date().toISOString():null};}
$("auth-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const email=$("auth-email").value.trim().toLowerCase();
 const password=$("auth-password").value;
 const submit=$("auth-button");submit.disabled=true;showFeedback("Submitting…","","auth-feedback");
 try{
  if(authMode==="signup"){
   const draft=getAuthDraft();
   if(!draft.display_name||!draft.consent_to_contact){showFeedback("Please enter your name and confirm the notice.","error","auth-feedback");return;}
   sessionStorage.setItem("niteacademy_pending_profile",JSON.stringify(draft));
   const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:draft.display_name},emailRedirectTo:"https://chaybuilds.github.io/niteacademy-site/"}});
   if(error)throw error;
   if(data.session){showFeedback("Account created. Loading your dashboard…","ok","auth-feedback");await loadMember(data.session.user);}
   else{showFeedback("Check your email to confirm your account, then come back and sign in. If the confirmation link redirects away, return to this page afterward.","ok","auth-feedback");}
  }else{
   const {data,error}=await client.auth.signInWithPassword({email,password});
   if(error)throw error;
   if(data?.user)await loadMember(data.user);
  }
 }catch(err){showFeedback(err?.message||"We couldn't complete this step. Please try again.","error","auth-feedback");}
 finally{submit.disabled=false;}
});
async function ensureProfile(user){
 let {data,error}=await client.from("nite_academy_profiles").select("*").eq("user_id",user.id).maybeSingle();
 if(error)throw error;
 if(!data){
  let draft={};
  try{draft=JSON.parse(sessionStorage.getItem("niteacademy_pending_profile")||"{}");}catch{}
  const initial={user_id:user.id,display_name:(draft.display_name||user.user_metadata?.display_name||user.email?.split("@")[0]||"Member").slice(0,120),experience:draft.experience==="existing"?"existing":"new",amazon_plan:"none",consent_to_contact:draft.consent_to_contact===true,consent_at:draft.consent_to_contact===true?(draft.consent_at||new Date().toISOString()):null};
  const result=await client.from("nite_academy_profiles").upsert(initial,{onConflict:"user_id"}).select("*").single();
  if(result.error)throw result.error;
  data=result.data;
  sessionStorage.removeItem("niteacademy_pending_profile");
 }
 return data;
}
async function loadMember(user){
 if(loading)return;
 loading=true;
 try{
  currentUser=user;
  profile=await ensureProfile(user);
  const [r,m,a,l,s,rs]=await Promise.all([
   client.from("nite_academy_reviews").select("*").eq("user_id",user.id).maybeSingle(),
   client.from("nite_academy_match_requests").select("*").eq("user_id",user.id).maybeSingle(),
   client.from("nite_academy_allocations").select("product_title,product_sku,quantity,state,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
   client.from("nite_academy_ledger").select("external_reference,seller_share,niterun_share,settlement_status").eq("user_id",user.id).limit(100),
   client.from("nite_consignment_member_balances").select("statement_code,period_start,period_end,status,gross_sales_cents,amazon_fees_cents,refunds_cents,other_costs_cents,net_distributable_cents,seller_share_cents,supplier_share_cents,niterun_fee_cents,owed_to_niterun_cents,collected_cents,outstanding_cents,issued_at,due_at,stripe_hosted_invoice_url").eq("user_id",user.id).order("issued_at",{ascending:false,nullsFirst:false}).limit(30),
   client.from("nite_consignment_reports").select("report_code,amazon_settlement_id,period_start,period_end,review_status,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
  ]);
  for(const result of [r,m,a,l,s,rs])if(result.error)throw result.error;
  review=r.data;request=m.data;allocations=a.data||[];ledger=l.data||[];statements=s.data||[];reports=rs.data||[];
  renderDashboard();view("dashboard-view");
 }catch(err){view("auth-view");showFeedback("Your account exists, but we couldn't load the member workspace. Please retry or contact support.","error","auth-feedback");}
 finally{loading=false;}
}
function renderReports(){
 $("report-panel").hidden=!allocations.some(a=>["shipped","live","settled"].includes(a.state));
 const target=$("report-list");target.replaceChildren();
 if(!reports.length){const e=document.createElement("div");e.className="empty";e.textContent="No Amazon payout files submitted yet.";target.append(e);return;}
 for(const r of reports){
  const row=document.createElement("div");row.className="item";
  const label=document.createElement("span");label.textContent=r.report_code+" · "+r.amazon_settlement_id;
  const state=document.createElement("span");state.textContent=r.review_status.replaceAll("_"," ");row.append(label,state);target.append(row);
 }
}
function downloadConsignmentStatement(st){
 const cell=value=>'"'+String(value??"").replaceAll('"','""')+'"';
 const rows=[
  ["NITERUN CONSIGNMENT SETTLEMENT STATEMENT","Not a receipt or confirmation of payment"],
  ["Statement",st.statement_code],["Seller",currentUser?.email||""],
  ["Period start",st.period_start],["Period end",st.period_end],
  ["State",st.status],["Issued",st.issued_at||""],["Due",st.due_at||""],
  ["Amazon consigned-product gross",money(Number(st.gross_sales_cents)/100)],
  ["Amazon fees",money(Number(st.amazon_fees_cents)/100)],
  ["Refunds",money(Number(st.refunds_cents)/100)],
  ["Other approved costs",money(Number(st.other_costs_cents)/100)],
  ["Net distributable",money(Number(st.net_distributable_cents)/100)],
  ["Seller retains",money(Number(st.seller_share_cents)/100)],
  ["Supplier share",money(Number(st.supplier_share_cents)/100)],
  ["NITERUN fee",money(Number(st.niterun_fee_cents)/100)],
  ["Total owed to NITERUN",money(Number(st.owed_to_niterun_cents)/100)],
  ["Collection recorded",money(Number(st.collected_cents)/100)],
  ["Outstanding",money(Number(st.outstanding_cents)/100)],
  ["Information","Amazon deposits to the seller. Payment to NITERUN is separate and requires an authorized invoice/transfer."]
 ];
 const csv="\uFEFF"+rows.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);const link=document.createElement("a");
 link.href=url;link.download=st.statement_code+"-niteacademy.csv";document.body.appendChild(link);
 link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function renderStatements(){
 const target=$("statement-list");
 target.replaceChildren();
 if(!statements.length){
  const empty=document.createElement("div");empty.className="empty";empty.textContent="No statements issued. NITERUN will only show real, reviewed consignment settlements.";target.append(empty);return;
 }
 for(const st of statements){
  const card=document.createElement("div");card.className="statement-row";
  const head=document.createElement("div");head.className="statement-head";
  const name=document.createElement("strong");name.textContent=st.statement_code;
  const status=document.createElement("span");status.className="label-soft";status.textContent=st.status.replaceAll("_"," ");
  head.append(name,status);card.append(head);
  const period=document.createElement("p");period.textContent=st.period_start+" to "+st.period_end+" · Seller retains "+money(Number(st.seller_share_cents)/100);card.append(period);
  for(const [label,value] of [["Original manufacturer",Number(st.supplier_share_cents)],["NITERUN fee",Number(st.niterun_fee_cents)],["Amount owed",Number(st.owed_to_niterun_cents)],["Collected by NITERUN",Number(st.collected_cents)],["Still outstanding",Number(st.outstanding_cents)]]){
   const row=document.createElement("div");row.className="statement-line";
   const left=document.createElement("span");left.textContent=label;
   const right=document.createElement("strong");right.textContent=money(value/100);
   row.append(left,right);card.append(row);
  }
  if(st.due_at){const due=document.createElement("p");due.textContent="Payment due: "+new Date(st.due_at).toLocaleDateString();card.append(due);}
  if(st.status==="invoiced" && st.stripe_hosted_invoice_url && /^https:\/\/invoice\.stripe\.com\//.test(st.stripe_hosted_invoice_url)){
   const pay=document.createElement("a");pay.className="ghost";pay.style.cssText="display:inline-block;text-decoration:none;margin-top:12px";pay.href=st.stripe_hosted_invoice_url;pay.rel="noopener noreferrer";pay.target="_blank";pay.textContent="Open secure payment invoice ↗";card.append(pay);
  } else if(Number(st.outstanding_cents)>0){
   const note=document.createElement("p");note.textContent="Payment instructions appear only after NITERUN issues a reviewed invoice.";card.append(note);
  }
  const download=document.createElement("button");download.type="button";download.className="ghost";download.style.marginTop="12px";download.textContent="Download statement (.csv)";download.addEventListener("click",()=>downloadConsignmentStatement(st));card.append(download);
  target.append(card);
 }
}
function renderDashboard(){
 const name=profile.display_name.trim().split(/\s+/)[0]||"there";
 $("welcome-title").textContent="Let's get you started, "+name+".";
 $("dash-subtitle").textContent="You own your seller account. NITE Academy helps you get ready for approved consignment opportunities.";
 $("account-email").textContent=currentUser.email||"";
 $("member-internal-code").textContent=profile.seller_code||"SLR-PENDING";
 $("dash-display-name").value=profile.display_name||"";
 $("dash-experience").value=profile.experience||"new";
 $("dash-plan").value=profile.amazon_plan||"none";
 $("dash-merchant-id").value=profile.amazon_merchant_id||"";
 $("dash-interests").value=profile.interests||"";
 const verified=review?.seller_verified===true;
 $("account-flag").textContent=verified?"Seller verified":profile.amazon_merchant_id?"Seller details submitted":"Seller setup needed";
 $("account-flag").setAttribute("title","NITERUN verification is separate from your self-reported account information");

 const selected=profile.academy_path||"undecided";
 $("choose-starter").setAttribute("aria-pressed",String(selected==="starter"));
 $("choose-elite").setAttribute("aria-pressed",String(selected==="elite"));
 $("choose-starter").classList.toggle("active",selected==="starter");
 $("choose-elite").classList.toggle("active",selected==="elite");
 $("path-next").textContent=selected==="starter"
  ?"Free Starter selected. Create an Individual Amazon seller account, save your Seller ID, and request a consignment review. Amazon still charges $0.99 per sale and applicable selling/FBA fees."
  :selected==="elite"
  ?"Professional route selected. Use your own $39.99/month Amazon Professional account, save your Seller ID, and get ready for seller verification. NITERUN's Amazon API integration is pending approval."
  :"Choose a route above. Academy membership is free in both cases. No seller account is connected yet.";
 $("amazon-connect-status").textContent=profile.amazon_plan==="professional"
  ?"Professional account self-reported; secure Amazon OAuth is not yet available. Saving a Seller ID does not authorize NIKO."
  :profile.amazon_plan==="individual"
  ?"Individual account self-reported; NIKO provides guided, seller-operated steps and private settlement-report intake. It does not control Seller Central."
  :"No Amazon account is connected. Create your own Amazon account using the official link below and never share its password.";

 $("inventory-count").textContent=String(allocations.reduce((s,x)=>s+Number(x.quantity||0),0));
 $("assignment-count").textContent=String(allocations.length);
 $("seller-income").textContent=money(statements.filter(st=>["verified","invoiced","disputed"].includes(st.status)).reduce((total,st)=>total+Number(st.seller_share_cents||0),0)/100);
 $("niterun-income").textContent=money(statements.reduce((total,st)=>total+Math.max(0,Number(st.collected_cents||0)),0)/100);
 $("setup-bubble").className="bubble "+(profile.amazon_plan!=="none"?"done":"");
 $("setup-bubble").textContent=profile.amazon_plan!=="none"?"✓":"1";
 $("plan-bubble").className="bubble "+(profile.amazon_merchant_id?"done":"");
 $("plan-bubble").textContent=profile.amazon_merchant_id?"✓":"2";
 $("review-bubble").className="bubble "+(verified?"done":"");
 $("review-bubble").textContent=verified?"✓":"3";
 $("allocation-bubble").className="bubble "+(allocations.length?"done":"");
 $("allocation-bubble").textContent=allocations.length?"✓":"4";
 $("plan-message").textContent=profile.amazon_plan==="none"?"Create an Amazon seller account. The Individual plan has no monthly subscription.":profile.amazon_plan==="individual"?"Individual plan selected — FBA is available, but Amazon's API connection is not.":"Professional plan selected — NITERUN's Amazon OAuth integration is not yet live.";
 $("seller-message").textContent=profile.amazon_merchant_id?"Seller ID saved (self-reported). NITERUN has not verified the account.":"Add your Amazon Seller ID when your account is ready. Do not share passwords.";
 $("review-message").textContent=verified?"NITERUN has marked your seller status verified.":request?"Your request is "+request.status.replaceAll("_"," ")+". Inventory is not guaranteed.":"Request a consignment match after saving your seller details.";
 $("allocation-message").textContent=allocations.length?"You have "+allocations.length+" recorded allocation(s).":"No approved product allocations have been recorded.";
 const niko= !profile.amazon_merchant_id?"First, get your Amazon account ready and add your Seller ID below. I can guide setup without accessing your Amazon password.":!request?"Your seller information is saved. Review the product categories you want to sell, then request a consignment match. NITERUN must verify eligibility and supplier rights before assigning stock.":!verified?"Your request is saved. NITERUN still needs to verify your account and secure eligible, funded inventory. Automated Amazon account access is not active.":"Your seller review is approved. Check inventory allocations and the agreement before any shipment is authorized.";
 $("niko-instruction").textContent=(selected==="elite"?"Professional route: advanced Amazon automation will require an approved NITERUN app and your OAuth authorization. ":selected==="starter"?"Free Starter: NIKO can guide and prepare work outside Amazon, but Seller Central actions are yours. ":"Choose your starting route above. ")+niko;
 $("research-status").textContent=request?"Consignment request: "+request.status.replaceAll("_"," "):"No consignment request submitted";
 $("match-request").hidden=Boolean(request);
 $("match-received").hidden=!request;
 if(request)$("match-received-text").textContent="Request received. Current status: "+request.status.replaceAll("_"," ")+". We will not claim inventory is ready until it is actually approved.";
 const list=$("allocated-list");
 list.replaceChildren();
 if(!allocations.length){const box=document.createElement("div");box.className="empty";box.textContent="No consignment inventory has been assigned. NITE Academy will not show fictional products or sales.";list.append(box);}
 else for(const item of allocations){const row=document.createElement("div");row.className="item";const a=document.createElement("span");a.textContent=item.product_title+" · "+item.product_sku;const b=document.createElement("span");b.textContent=String(item.quantity)+" units · "+item.state;row.append(a,b);list.append(row);}
 renderStatements();
 renderReports();
 $("ledger-note").textContent=statements.length?"Amounts are based on verified NITERUN settlement records, with processor-reconciled collections recorded separately. Amazon deposits go to the account owner.":"No verified settlements yet. Amazon pays your registered seller bank account; consignment shares are reconciled under a separate agreement.";
 $("application-state").textContent=request?"Requested":"Not requested";
}
$("seller-details-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!currentUser)return;
 const submit=$("save-details");submit.disabled=true;showFeedback("Saving…","","details-feedback");
 try{
  const values={user_id:currentUser.id,display_name:$("dash-display-name").value.trim(),experience:$("dash-experience").value,amazon_plan:$("dash-plan").value,academy_path:$("dash-plan").value==="professional"?"elite":$("dash-plan").value==="individual"?"starter":(profile.academy_path||"undecided"),amazon_merchant_id:$("dash-merchant-id").value.trim()||null,interests:$("dash-interests").value.trim()||null,consent_to_contact:profile.consent_to_contact,consent_at:profile.consent_at,updated_at:new Date().toISOString()};
  if(!values.display_name)throw Error("Enter your name.");
  if(values.amazon_merchant_id&&values.amazon_plan==="none")throw Error("Choose your seller plan before saving a Seller ID.");
  const {data,error}=await client.from("nite_academy_profiles").upsert(values,{onConflict:"user_id"}).select("*").single();
  if(error)throw error;
  profile=data;
  renderDashboard();
  showFeedback("Saved. Amazon account information is self-reported until independently verified.","ok","details-feedback");
 }catch(err){showFeedback(err.message||"Unable to save.","error","details-feedback");}
 finally{submit.disabled=false;}
});
$("match-request").addEventListener("click",async()=>{
 if(!currentUser)return;
 if(profile.amazon_plan==="none"||!profile.amazon_merchant_id){showFeedback("Save your Amazon plan and Seller ID before requesting a product match.","error","match-feedback");return;}
 const btn=$("match-request");btn.disabled=true;showFeedback("Submitting…","","match-feedback");
 try{
  const {data,error}=await client.from("nite_academy_match_requests").insert({user_id:currentUser.id,categories:profile.interests||"",notes:"Member requests consideration for authorized, fully funded consignment inventory."}).select("*").single();
  if(error)throw error;
  request=data;renderDashboard();showFeedback("Your application is recorded for review. No inventory or earnings are promised.","ok","match-feedback");
 }catch(err){showFeedback("Could not submit your request. Refresh the page and check whether it was already received.","error","match-feedback");}
 finally{btn.disabled=false;}
});

$("report-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const btn=$("submit-report");btn.disabled=true;showFeedback("Uploading securely…","","report-feedback");
 try{
  if(!currentUser || !allocations.some(a=>["shipped","live","settled"].includes(a.state)))throw Error("Your account has no active consigned inventory to report.");
  const id=$("report-settlement-id").value.trim();
  const start=$("report-period-start").value,end=$("report-period-end").value;
  const amount=Number($("report-amount").value);
  const file=$("report-file").files?.[0];
  if(!/^[A-Za-z0-9 _./-]{2,120}$/.test(id))throw Error("Enter the Amazon settlement reference shown in Seller Central.");
  if(!start||!end||start>end||end>new Date().toISOString().slice(0,10))throw Error("Enter a valid completed settlement period.");
  if(!Number.isFinite(amount)||amount<0||amount>100000000)throw Error("Enter the actual Amazon account deposit amount in dollars.");
  const cents=Math.round(amount*100);
  if(!file||file.size<1||file.size>5*1024*1024)throw Error("Choose an Amazon report smaller than 5 MB.");
  const ext=file.name.split(".").pop().toLowerCase();
  const mime={csv:"text/csv",tsv:"text/plain",txt:"text/plain",xml:"application/xml"}[ext];
  if(!mime)throw Error("Upload an Amazon CSV, TSV, TXT, or XML settlement report.");
  const bytes=await file.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(b=>b.toString(16).padStart(2,"0")).join("");
  const storageKey=currentUser.id+"/"+crypto.randomUUID()+"."+ext;
  const uploaded=await client.storage.from("nite-academy-settlements").upload(storageKey,file,{contentType:mime,upsert:false});
  if(uploaded.error)throw new Error("Private report upload failed. No settlement was recorded.");
  const {data,error}=await client.from("nite_consignment_reports").insert({
   user_id:currentUser.id,amazon_settlement_id:id,
   period_start:start,period_end:end,account_disbursement_cents:cents,
   evidence_storage_key:storageKey,evidence_sha256:hash,source_type:"seller_report"
  }).select("report_code,amazon_settlement_id,period_start,period_end,review_status,created_at").single();
  if(error)throw new Error("The file was received, but the submission could not be recorded. Contact support with the settlement ID; do not upload it again.");
  reports=[data,...reports];
  renderReports();$("report-form").reset();
  showFeedback("Report received as "+data.report_code+". Awaiting NITERUN review; no payment is due until an approved settlement statement is issued.","ok","report-feedback");
 }catch(err){showFeedback(err.message||"Could not submit the report.","error","report-feedback");}
 finally{btn.disabled=false;}
});
client.auth.onAuthStateChange((event,session)=>{
 if(event==="SIGNED_OUT"){currentUser=null;view("landing-view");}
 if(event==="SIGNED_IN"&&session?.user)setTimeout(()=>loadMember(session.user),0);
});
const initial=await client.auth.getSession();
if(initial.data?.session?.user)await loadMember(initial.data.session.user);
else view("landing-view");
