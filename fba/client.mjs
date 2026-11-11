import {usdToCents,percentToBps,evaluateWholesaleFba,evaluateSupplierFundedConsignment,
  evaluateIntroductionFee,planFbaResearch} from "./engine.mjs";
import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
// Public publishable key already used by the NITE Academy homepage; no service-role credentials here.
const client=createClient("https://succvbtctjkzsowotcsy.supabase.co","sb_publishable_0TNBWdAUGNot0IxoyFDpEw_9bRDTOVu",
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const fmt=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
const labels={
  UNVERIFIED_KEEPA_HISTORY:"Keepa history is not independently verified",
  NO_SELLER_SPECIFIC_AMAZON_LISTING_RESTRICTIONS:"Seller-specific Amazon listing permission is missing",
  NO_AUTHENTICATED_SUPPLIER_QUOTE_OR_BRAND_RIGHTS:"No approved supplier invoice, quote or product rights",
  NO_VERIFIED_SP_API_FEE_ESTIMATE:"Amazon's actual fee estimates have not been obtained",
  STOCK_BELOW_MOQ:"Reported stock cannot cover the rounded minimum order",
  CAPITAL_CEILING_EXCEEDED:"The proposed inventory commitment exceeds your ceiling",
  ESTIMATED_LOSS_OR_BREAK_EVEN:"Estimated per-unit loss or break-even",
  LOW_ESTIMATED_MARGIN:"Estimated margin below 10% research floor",
  NO_SIGNED_SUPPLIER_AND_SELLER_AGREEMENTS:"Supplier and seller agreements are not signed",
  NO_VERIFIED_AMAZON_ELIGIBILITY:"Amazon seller and listing eligibility are not verified",
  NO_ALLOCATED_INVENTORY_OR_LIVE_FULFILLMENT:"No approved or allocated inventory and fulfillment",
  NO_CONFIRMED_SALE_OR_SETTLEMENT:"No verified Amazon sale or cash settlement",
  NO_SIGNED_INTRODUCTION_FEE_CONTRACT:"No agreed and signed referral fee terms",
  NO_VERIFIED_REFERRED_ORDER_OR_PAYMENT:"No attributed completed and paid referral order",
  NO_ATTRIBUTION_AND_RETURN_WINDOW_PROOF:"No documented referral attribution and refunds/return period"
};
let currentUser=null,lastResult=null,lastModel=null,refreshSerial=0;
const list=[
  "scenario-name","asin","current-price","median-price","unit-cost","freight","prep",
  "moq","case-pack","available","capital","gross-sale","seller-rate","academy-rate",
  "refunds","contract-costs","first-order","fee-rate","referral","fulfillment",
  "placement","storage","returns","other"
];
function selectedModel(){return document.querySelector('input[name="model"]:checked')?.value || "wholesale";}
function feeInputs(){
 return {referralCents:usdToCents($("referral").value),
  fulfillmentCents:usdToCents($("fulfillment").value),
  inboundPlacementCents:usdToCents($("placement").value),
  storageCents:usdToCents($("storage").value),
  returnReserveCents:usdToCents($("returns").value),
  otherCents:usdToCents($("other").value)};
}
function feedback(id,message,failed=false){
 $(id).textContent=message;
 $(id).classList.toggle("error",failed);
}
function setModel(){
 const model=selectedModel();
 document.querySelectorAll("[data-models]").forEach(el=>{
  el.hidden=!el.getAttribute("data-models").split(" ").includes(model);
 });
 lastResult=null;
 $("save").disabled=true;
 $("result-title").textContent="Your outcome will appear here.";
 $("result-status").textContent="UNVERIFIED";
 $("result-description").textContent="Enter hypothetical values or load a fictional example. Never treat a forecast as verified sales.";
 $("result-metrics").replaceChildren();
 $("result-reasons").replaceChildren();
 feedback("scenario-feedback","No external commerce requests have been made.");
}
for(const el of document.querySelectorAll('input[name="model"]')) el.addEventListener("change",setModel);
setModel();
function addMetric(label,value){
 const panel=document.createElement("div");panel.className="metric";
 const title=document.createElement("label");title.textContent=label;
 const result=document.createElement("strong");result.textContent=value;
 panel.append(title,result);$("result-metrics").append(panel);
}
function renderResult(result){
 $("result-title").textContent=selectedModel()==="introduction"?
  "Proposed introduction economics":selectedModel()==="consignment"?
  "Proposed consignment split":"Conservative wholesale estimate";
 $("result-status").textContent=result.reviewStatus;
 $("result-metrics").replaceChildren();
 if(result.model==="wholesale"){
  addMetric("Conservative sale price",fmt(result.conservativeSalePriceCents));
  addMetric("Estimated net / unit",fmt(result.estimatedNetCents));
  addMetric("Estimated profit margin",result.estimatedMarginPct.toFixed(1)+"%");
  addMetric("Landed-cost ROI",result.estimatedRoiPct.toFixed(1)+"%");
  addMetric("Full case-pack units",String(result.moqUnits));
  addMetric("Upfront inventory commitment",fmt(result.estimatedUpfrontCents));
  addMetric("Landed unit cost",fmt(result.landedCents));
  addMetric("Illustrative fees / unit",fmt(result.estimatedFeesCents));
 }else if(result.model==="consignment"){
  addMetric("Net distributable",fmt(result.netDistributableCents));
  addMetric("Seller share",fmt(result.sellerShareCents));
  addMetric("Supplier share",fmt(result.supplierShareCents));
  addMetric("NITERUN fee share",fmt(result.niterunFeeCents));
  addMetric("Illustrative supplier + NITERUN due",fmt(result.dueToNiterunCents));
  addMetric("Modeled inventory purchase",fmt(result.estimatedUpfrontCents));
 }else{
  addMetric("First qualifying net order",fmt(result.firstOrderNetCents));
  addMetric("Hypothetical introduction fee",fmt(result.hypotheticalFeeCents));
  addMetric("Actual earned commission",fmt(result.earnedCommissionCents));
 }
 $("result-description").textContent="HOLD: this is hypothetical math. No product or supplier was verified, no contract was executed, and this desk cannot order, list, bill or contact anyone.";
 $("result-reasons").replaceChildren();
 for(const reason of result.reasons){
  const li=document.createElement("li");li.textContent=labels[reason]||reason;
  $("result-reasons").append(li);
 }
}
$("scenario-form").addEventListener("submit",e=>{
 e.preventDefault();
 try{
  const model=selectedModel();
  let value;
  if(model==="wholesale"){
   value=evaluateWholesaleFba({asin:$("asin").value,
    currentPriceCents:usdToCents($("current-price").value),
    medianPriceCents:usdToCents($("median-price").value),
    supplierUnitCents:usdToCents($("unit-cost").value),
    freightCents:usdToCents($("freight").value),
    prepCents:usdToCents($("prep").value),
    moq:Number($("moq").value),casePack:Number($("case-pack").value),
    availableUnits:Number($("available").value),
    capitalLimitCents:usdToCents($("capital").value),...feeInputs()});
  }else if(model==="consignment"){
   value=evaluateSupplierFundedConsignment({
    asin:$("asin").value,grossSaleCents:usdToCents($("gross-sale").value),
    sellerBps:percentToBps($("seller-rate").value),
    niterunBps:percentToBps($("academy-rate").value),
    refundsCents:usdToCents($("refunds").value),
    otherCostsCents:usdToCents($("contract-costs").value),...feeInputs()});
  }else{
   value=evaluateIntroductionFee({
    firstOrderNetCents:usdToCents($("first-order").value),
    feeBps:percentToBps($("fee-rate").value)});
  }
  lastModel=model;lastResult=value;
  renderResult(value);
  $("save").disabled=!currentUser;
  feedback("scenario-feedback","Research-only result generated locally. No Amazon, Keepa, supplier or purchasing calls occurred.");
 }catch(error){
  lastResult=null;$("save").disabled=true;
  feedback("scenario-feedback",error instanceof Error?error.message:"Check your inputs.",true);
 }
});
$("example").addEventListener("click",()=>{
 const fields={"scenario-name":"FICTIONAL EXAMPLE — NOT AN ACTUAL DEAL","asin":"B000TEST12",
 "current-price":"40.00","median-price":"38.00","unit-cost":"12.00",
 "freight":"3.00","prep":"1.00","moq":"5","case-pack":"4",
 "available":"100","capital":"200.00","gross-sale":"40.00","seller-rate":"25",
 "academy-rate":"10","refunds":"0.00","contract-costs":"0.00",
 "first-order":"2000.00","fee-rate":"3.50","referral":"6.00",
 "fulfillment":"5.00","placement":"1.00","storage":"0.50",
 "returns":"1.00","other":"0.50"};
 for(const [id,value] of Object.entries(fields))$(id).value=value;
 lastResult=null;$("save").disabled=true;
 feedback("scenario-feedback","Fictional sample numbers loaded; no real ASIN, supplier, fee quote or product stock has been verified.");
});
$("planner-form").addEventListener("submit",e=>{
 e.preventDefault();
 $("planner-results").replaceChildren();
 try{
  const work=planFbaResearch($("asin-list").value);
  feedback("planner-feedback",work.asins.length+" ASINs; "+work.tasks.length+
   " research tasks planned. Provider calls: 0. Keepa tokens: 0.");
  for(const asin of work.asins){
   const card=document.createElement("div");card.className="task-card";
   const name=document.createElement("b");name.textContent=asin+" — NOT VERIFIED";
   const description=document.createElement("p");
   description.textContent=work.tasks.filter(t=>t.asin===asin).map(t=>t.task).join(" · ");
   card.append(name,description);$("planner-results").append(card);
  }
 }catch(error){feedback("planner-feedback",error.message||"Invalid ASIN list.",true);}
});
function snapshot(){
 const inputs={};
 for(const id of list)if($(id))inputs[id]=$(id).value.slice(0,150);
 return inputs;
}
function showSaved(rows){
 const root=$("saved-list");root.replaceChildren();
 if(!rows?.length){const note=document.createElement("div");note.className="notice";
 note.textContent="No personal research scenarios saved yet.";root.append(note);return;}
 for(const row of rows){
  const item=document.createElement("div");item.className="saved";
  const info=document.createElement("div");
  const title=document.createElement("strong");title.textContent=row.scenario_name;
  const sub=document.createElement("small");sub.textContent=row.model+" · "+new Date(row.created_at).toLocaleDateString();
  info.append(title,sub);
  const controls=document.createElement("div");controls.className="saved-actions";
  const load=document.createElement("button");load.type="button";load.textContent="Load";
  load.addEventListener("click",()=>{
   document.querySelector('input[name="model"][value="'+row.model+'"]').checked=true;
   setModel();
   for(const [id,val] of Object.entries(row.inputs||{})){
    if(list.includes(id) && typeof val==="string")$(id).value=val.slice(0,150);
   }
   feedback("saved-feedback","Research draft loaded. Recalculate; no live data is refreshed.");
   $("scenario-form").scrollIntoView({behavior:"smooth",block:"start"});
  });
  const remove=document.createElement("button");remove.type="button";remove.textContent="Delete";
  remove.addEventListener("click",async()=>{
   if(!currentUser || !window.confirm("Delete this personal research draft?"))return;
   remove.disabled=true;
   const {error}=await client.from("nite_academy_fba_research")
    .delete().eq("id",row.id).eq("user_id",currentUser.id);
   if(error){feedback("saved-feedback","Could not delete your draft. Try again later.",true);remove.disabled=false;}
   else await refreshSaved();
  });
  controls.append(load,remove);item.append(info,controls);root.append(item);
 }
}
async function refreshSaved(){
 if(!currentUser){$("saved-list").replaceChildren();return;}
 const serial=++refreshSerial;
 const {data,error}=await client.from("nite_academy_fba_research")
  .select("id,scenario_name,model,asin,inputs,created_at")
  .eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(25);
 if(serial!==refreshSerial||!currentUser)return;
 if(error){feedback("saved-feedback","Private research drafts could not be loaded. The account or research table may not be ready yet.",true);return;}
 showSaved(data||[]);
}
$("save").addEventListener("click",async()=>{
 if(!currentUser||!lastResult||lastModel!==selectedModel())return;
 const name=$("scenario-name").value.trim();
 if(!name||name.length>80){feedback("saved-feedback","Give this draft a name (up to 80 characters).",true);return;}
 const inputs=snapshot();
 if(JSON.stringify(inputs).length>4000){feedback("saved-feedback","Draft is too large to store safely.",true);return;}
 const button=$("save");button.disabled=true;
 const {error}=await client.from("nite_academy_fba_research").insert({
  user_id:currentUser.id,scenario_name:name,model:lastModel,
  asin:lastModel==="introduction"?null:lastResult.asin,inputs});
 if(error)feedback("saved-feedback","Draft not saved. Private research storage or your account may not be ready yet.",true);
 else{feedback("saved-feedback","Saved privately as UNVERIFIED_RESEARCH; no live order or fees were created.");await refreshSaved();}
 button.disabled=!currentUser||!lastResult;
});
async function updateSession(session){
 currentUser=session?.user||null;
 $("member-state").textContent=currentUser?
 "Signed in to NITE Academy. Research drafts are private to your account; only you can save or delete them here.":
 "Not signed in. You can use the research workbench without an account. Saving requires an existing Academy member session; new signups are temporarily paused.";
 $("save").disabled=!currentUser||!lastResult;
 if(currentUser)await refreshSaved();
 else{$("saved-list").replaceChildren();feedback("saved-feedback","");}
}
const initial=await client.auth.getSession();
await updateSession(initial.data?.session);
client.auth.onAuthStateChange((_event,session)=>{
 setTimeout(()=>void updateSession(session),0);
});
