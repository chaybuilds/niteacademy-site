// NITE Academy FBA/consignment intelligence. Pure ESM; no network calls or commerce writes.
// This is a browser/Node port of the evidence-first research design in NOVA PR #19.
import { calculateConsignmentStatement } from "../scripts/consignment-ledger.mjs";
export const US_MARKETPLACE_ID = "ATVPDKIKX0DER";
const ASIN = /^[A-Z0-9]{10}$/;
function safeInt(v, name, min=0) {
  if(!Number.isSafeInteger(v) || v<min || v>1000000000) throw new RangeError(name+" must be a safe integer in range");
  return v;
}
export function usdToCents(value) {
  const text=String(value).trim();
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(text)) throw new RangeError("Enter USD as a nonnegative amount with at most two decimals");
  const parts=text.split(".");
  return safeInt(Number(parts[0])*100+Number((parts[1]||"").padEnd(2,"0")),"USD");
}
export function percentToBps(value) {
  const text=String(value).trim();
  if(!/^\d{1,3}(\.\d{1,2})?$/.test(text)) throw new RangeError("Rate must be 0 to 100 percent");
  const parts=text.split(".");
  const bps=Number(parts[0])*100+Number((parts[1]||"").padEnd(2,"0"));
  if(bps>10000) throw new RangeError("Rate cannot exceed 100 percent");
  return bps;
}
function validateAsin(asin) {
  const value=String(asin||"").toUpperCase().trim();
  if(!ASIN.test(value)) throw new RangeError("Enter a ten-character US Amazon ASIN");
  return value;
}
function reserveFees(v) {
  return safeInt(v.referralCents,"referral fee")+safeInt(v.fulfillmentCents,"fulfillment fee")+
    safeInt(v.inboundPlacementCents,"inbound placement")+safeInt(v.storageCents,"storage")+
    safeInt(v.returnReserveCents,"returns reserve")+safeInt(v.otherCents,"other costs");
}
export function evaluateWholesaleFba(input) {
  const asin=validateAsin(input.asin);
  const price=safeInt(input.currentPriceCents,"current price",1);
  const median=safeInt(input.medianPriceCents,"90-day median",1);
  const sale=Math.min(price,median);
  const cost=safeInt(input.supplierUnitCents,"supplier quote",1);
  const freight=safeInt(input.freightCents,"freight");
  const prep=safeInt(input.prepCents,"prep");
  const landed=cost+freight+prep;
  const fees=reserveFees(input);
  const net=sale-landed-fees;
  const moq=safeInt(input.moq,"minimum order",1);
  const casePack=safeInt(input.casePack,"case pack",1);
  const available=safeInt(input.availableUnits,"available inventory");
  const maxCash=safeInt(input.capitalLimitCents,"research capital ceiling");
  const units=Math.ceil(moq/casePack)*casePack;
  const commitment=units*landed;
  if(![fees,landed,units,commitment,net].every(Number.isSafeInteger)) throw new RangeError("Input amounts exceed safe calculation limits");
  const reasons=["UNVERIFIED_KEEPA_HISTORY","NO_SELLER_SPECIFIC_AMAZON_LISTING_RESTRICTIONS",
    "NO_AUTHENTICATED_SUPPLIER_QUOTE_OR_BRAND_RIGHTS","NO_VERIFIED_SP_API_FEE_ESTIMATE"];
  if(available<units) reasons.push("STOCK_BELOW_MOQ");
  if(commitment>maxCash) reasons.push("CAPITAL_CEILING_EXCEEDED");
  if(net<=0) reasons.push("ESTIMATED_LOSS_OR_BREAK_EVEN");
  if(net/sale<0.10) reasons.push("LOW_ESTIMATED_MARGIN");
  return {model:"wholesale",asin,conservativeSalePriceCents:sale,landedCents:landed,
    estimatedFeesCents:fees,estimatedNetCents:net,estimatedMarginPct:100*net/sale,
    estimatedRoiPct:100*net/landed,moqUnits:units,estimatedUpfrontCents:commitment,
    reviewStatus:"HOLD",reasons,purchaseAuthorized:false,listingAuthorized:false,liveEvidenceVerified:false};
}
export function evaluateSupplierFundedConsignment(input) {
  const asin=validateAsin(input.asin);
  const gross=safeInt(input.grossSaleCents,"illustrative gross sale",1);
  const fees=reserveFees(input);
  const settlement=calculateConsignmentStatement({
    grossCents:gross,amazonFeesCents:fees,refundsCents:safeInt(input.refundsCents,"refunds"),
    otherCostsCents:safeInt(input.otherCostsCents,"other costs"),
    sellerBps:safeInt(input.sellerBps,"seller rate"),niterunBps:safeInt(input.niterunBps,"NITERUN rate")
  });
  return {model:"consignment",asin,...settlement,estimatedUpfrontCents:0,reviewStatus:"HOLD",
    reasons:["NO_SIGNED_SUPPLIER_AND_SELLER_AGREEMENTS","NO_VERIFIED_AMAZON_ELIGIBILITY",
      "NO_ALLOCATED_INVENTORY_OR_LIVE_FULFILLMENT","NO_CONFIRMED_SALE_OR_SETTLEMENT"],
    purchaseAuthorized:false,listingAuthorized:false,liveEvidenceVerified:false};
}
export function evaluateIntroductionFee(input) {
  const order=safeInt(input.firstOrderNetCents,"eligible paid order value",1);
  const feeBps=safeInt(input.feeBps,"proposed referral rate");
  if(feeBps>10000) throw new RangeError("Proposed rate above 100 percent");
  const hypotheticalFee=Number(BigInt(order)*BigInt(feeBps)/10000n);
  return {model:"introduction",hypotheticalFeeCents:hypotheticalFee,firstOrderNetCents:order,
    reviewStatus:"HOLD",reasons:["NO_SIGNED_INTRODUCTION_FEE_CONTRACT",
      "NO_VERIFIED_REFERRED_ORDER_OR_PAYMENT","NO_ATTRIBUTION_AND_RETURN_WINDOW_PROOF"],
    earnedCommissionCents:0,purchaseAuthorized:false,liveEvidenceVerified:false};
}
export function planFbaResearch(asinText) {
  const values=String(asinText||"").toUpperCase().split(/[\s,;]+/).filter(Boolean);
  if(values.length<1||values.length>25) throw new RangeError("Enter 1–25 distinct US Amazon ASINs");
  const seen=new Set();
  for(const value of values) {
    validateAsin(value);
    if(seen.has(value)) throw new RangeError("Duplicate ASIN: "+value);
    seen.add(value);
  }
  return {marketplaceId:US_MARKETPLACE_ID,mode:"OFFLINE_RESEARCH_PLANNER",status:"UNVERIFIED",
    asins:values,tasks:values.flatMap(asin=>[
      {asin,task:"Keepa history and price trend",source:"KEEPA",state:"NOT_CONNECTED"},
      {asin,task:"Seller-specific listing restrictions",source:"AMAZON_SP_API",state:"NOT_CONNECTED"},
      {asin,task:"Amazon fee estimate",source:"AMAZON_SP_API",state:"NOT_CONNECTED"},
      {asin,task:"Supplier quote, invoice, stock, rights and MOQs",source:"HUMAN",state:"UNVERIFIED"}]),
    externalRequestsMade:0,keepaTokensUsed:0,purchaseAuthorized:false,adSpendAuthorized:false};
}
