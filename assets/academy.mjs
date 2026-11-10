
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
const client = createClient("https://succvbtctjkzsowotcsy.supabase.co", "sb_publishable_0TNBWdAUGNot0IxoyFDpEw_9bRDTOVu", {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $ = id=>document.getElementById(id);
const panels=["landing-view","auth-view","dashboard-view"];
let authMode="signup", currentUser=null, profile=null, review=null, request=null, allocations=[], ledger=[];
let loading=false;
const money = v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);
function view(id){panels.forEach(x=>$(x).hidden=x!==id);$("topbar-guest").hidden=id==="dashboard-view";$("topbar-seller").hidden=id!=="dashboard-view";window.scrollTo(0,0);}
function showFeedback(text,type,id){const node=$(id);node.textContent=text;node.className="feedback "+(type||"");}
function switchAuth(mode){authMode=mode;$("auth-form").reset();$("signup-fields").hidden=mode!=="signup";$("auth-title").textContent=mode==="signup"?"Create your free account.":"Welcome back.";$("auth-button").textContent=mode==="signup"?"Create account":"Sign in";$("auth-switch").textContent=mode==="signup"?"I already have an account":"Create a free account";showFeedback("","","auth-feedback");view("auth-view");}
$("start-button").addEventListener("click",()=>switchAuth("signup"));
$("start-footer").addEventListener("click",()=>switchAuth("signup"));
$("signin-button").addEventListener("click",()=>switchAuth("login"));
$("auth-switch").addEventListener("click",()=>switchAuth(authMode==="signup"?"login":"signup"));
$("auth-back").addEventListener("click",()=>view("landing-view"));
$("signout").addEventListener("click",async()=>{await client.auth.signOut();currentUser=null;profile=null;view("landing-view");});
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
  const [r,m,a,l]=await Promise.all([
   client.from("nite_academy_reviews").select("*").eq("user_id",user.id).maybeSingle(),
   client.from("nite_academy_match_requests").select("*").eq("user_id",user.id).maybeSingle(),
   client.from("nite_academy_allocations").select("product_title,product_sku,quantity,state,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
   client.from("nite_academy_ledger").select("external_reference,seller_share,niterun_share,settlement_status").eq("user_id",user.id).limit(100)
  ]);
  for(const result of [r,m,a,l])if(result.error)throw result.error;
  review=r.data;request=m.data;allocations=a.data||[];ledger=l.data||[];
  renderDashboard();view("dashboard-view");
 }catch(err){view("auth-view");showFeedback("Your account exists, but we couldn't load the member workspace. Please retry or contact support.","error","auth-feedback");}
 finally{loading=false;}
}
function renderDashboard(){
 const name=profile.display_name.trim().split(/\s+/)[0]||"there";
 $("welcome-title").textContent="Let's get you started, "+name+".";
 $("dash-subtitle").textContent="You own your seller account. NITE Academy helps you get ready for approved consignment opportunities.";
 $("account-email").textContent=currentUser.email||"";
 $("dash-display-name").value=profile.display_name||"";
 $("dash-experience").value=profile.experience||"new";
 $("dash-plan").value=profile.amazon_plan||"none";
 $("dash-merchant-id").value=profile.amazon_merchant_id||"";
 $("dash-interests").value=profile.interests||"";
 const verified=review?.seller_verified===true;
 $("account-flag").textContent=verified?"Seller verified":profile.amazon_merchant_id?"Seller details submitted":"Seller setup needed";
 $("account-flag").setAttribute("title","NITERUN verification is separate from your self-reported account information");
 $("inventory-count").textContent=String(allocations.reduce((s,x)=>s+Number(x.quantity||0),0));
 $("assignment-count").textContent=String(allocations.length);
 $("seller-income").textContent=money(ledger.filter(x=>x.settlement_status==="paid").reduce((s,x)=>s+Number(x.seller_share||0),0));
 $("niterun-income").textContent=money(ledger.filter(x=>x.settlement_status==="verified"||x.settlement_status==="paid").reduce((s,x)=>s+Number(x.niterun_share||0),0));
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
 $("niko-instruction").textContent=niko;
 $("research-status").textContent=request?"Consignment request: "+request.status.replaceAll("_"," "):"No consignment request submitted";
 $("match-request").hidden=Boolean(request);
 $("match-received").hidden=!request;
 if(request)$("match-received-text").textContent="Request received. Current status: "+request.status.replaceAll("_"," ")+". We will not claim inventory is ready until it is actually approved.";
 const list=$("allocated-list");
 list.replaceChildren();
 if(!allocations.length){const box=document.createElement("div");box.className="empty";box.textContent="No consignment inventory has been assigned. NITE Academy will not show fictional products or sales.";list.append(box);}
 else for(const item of allocations){const row=document.createElement("div");row.className="item";const a=document.createElement("span");a.textContent=item.product_title+" · "+item.product_sku;const b=document.createElement("span");b.textContent=String(item.quantity)+" units · "+item.state;row.append(a,b);list.append(row);}
 $("ledger-note").textContent=ledger.length?"Only company-recorded settlement entries are shown. Amazon deposits go to the account owner; contracted payments to NITERUN occur separately.":"No verified settlements yet. Amazon pays your registered seller bank account; consignment shares are reconciled under a separate agreement.";
 $("application-state").textContent=request?"Requested":"Not requested";
}
$("seller-details-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!currentUser)return;
 const submit=$("save-details");submit.disabled=true;showFeedback("Saving…","","details-feedback");
 try{
  const values={user_id:currentUser.id,display_name:$("dash-display-name").value.trim(),experience:$("dash-experience").value,amazon_plan:$("dash-plan").value,amazon_merchant_id:$("dash-merchant-id").value.trim()||null,interests:$("dash-interests").value.trim()||null,consent_to_contact:profile.consent_to_contact,consent_at:profile.consent_at,updated_at:new Date().toISOString()};
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
client.auth.onAuthStateChange((event,session)=>{
 if(event==="SIGNED_OUT"){currentUser=null;view("landing-view");}
 if(event==="SIGNED_IN"&&session?.user)setTimeout(()=>loadMember(session.user),0);
});
const initial=await client.auth.getSession();
if(initial.data?.session?.user)await loadMember(initial.data.session.user);
else view("landing-view");
