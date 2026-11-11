import test from "node:test";
import assert from "node:assert/strict";
import {usdToCents,percentToBps,evaluateWholesaleFba,evaluateSupplierFundedConsignment,
  evaluateIntroductionFee,planFbaResearch} from "../fba/engine.mjs";
const basis={asin:"B000TEST12",currentPriceCents:4000,medianPriceCents:3800,supplierUnitCents:1200,
 freightCents:300,prepCents:100,referralCents:600,fulfillmentCents:500,inboundPlacementCents:100,
 storageCents:50,returnReserveCents:100,otherCents:50,moq:5,casePack:4,availableUnits:100,
 capitalLimitCents:20000};
test("USD and percent inputs use safe exact cents and bps",()=>{
 assert.equal(usdToCents("0.99"),99);
 assert.equal(usdToCents("24.9"),2490);
 assert.equal(percentToBps("3.50"),350);
 assert.throws(()=>usdToCents("2.999"),/Enter USD/);
 assert.throws(()=>percentToBps("101"),/above|exceed/);
});
test("wholesale FBA case-pack, conservative price and unit-profit reserves from NOVA",()=>{
 const v=evaluateWholesaleFba(basis);
 assert.equal(v.conservativeSalePriceCents,3800);
 assert.equal(v.estimatedFeesCents,1400);
 assert.equal(v.estimatedNetCents,800);
 assert.equal(v.moqUnits,8);
 assert.equal(v.estimatedUpfrontCents,12800);
 assert.equal(v.reviewStatus,"HOLD");
 assert.equal(v.purchaseAuthorized,false);
 assert.equal(v.liveEvidenceVerified,false);
});
test("missing supplier stock and exceeded capital are not approved",()=>{
 const v=evaluateWholesaleFba({...basis,availableUnits:1,capitalLimitCents:5000});
 assert.ok(v.reasons.includes("STOCK_BELOW_MOQ"));
 assert.ok(v.reasons.includes("CAPITAL_CEILING_EXCEEDED"));
});
test("loss scenarios and invalid ASIN are blocked",()=>{
 assert.ok(evaluateWholesaleFba({...basis,medianPriceCents:1000}).reasons.includes("ESTIMATED_LOSS_OR_BREAK_EVEN"));
 assert.throws(()=>evaluateWholesaleFba({...basis,asin:"NO"}),/ASIN/);
});
test("consignment math reuses canonical Academy ledger model",()=>{
 const fees={referralCents:600,fulfillmentCents:500,inboundPlacementCents:100,storageCents:0,
  returnReserveCents:0,otherCents:0};
 const v=evaluateSupplierFundedConsignment({asin:"B000TEST12",grossSaleCents:4000,
   ...fees,refundsCents:0,otherCostsCents:0,sellerBps:2500,niterunBps:1000});
 assert.equal(v.netDistributableCents,2800);
 assert.equal(v.sellerShareCents,700);
 assert.equal(v.niterunFeeCents,280);
 assert.equal(v.supplierShareCents,1820);
 assert.equal(v.estimatedUpfrontCents,0);
 assert.equal(v.reviewStatus,"HOLD");
});
test("consignment impossible shares fail closed",()=>{
 assert.throws(()=>evaluateSupplierFundedConsignment({asin:"B000TEST12",grossSaleCents:1000,
  referralCents:800,fulfillmentCents:300,inboundPlacementCents:0,storageCents:0,returnReserveCents:0,
  otherCents:0,refundsCents:0,otherCostsCents:0,sellerBps:2000,niterunBps:500}),/expenses exceed/);
});
test("referral fee is hypothetical and never earned without contract",()=>{
 const v=evaluateIntroductionFee({firstOrderNetCents:200000,feeBps:350});
 assert.equal(v.hypotheticalFeeCents,7000);
 assert.equal(v.earnedCommissionCents,0);
 assert.ok(v.reasons.includes("NO_SIGNED_INTRODUCTION_FEE_CONTRACT"));
});
test("offline research planner reserves no paid tokens or reads",()=>{
 const v=planFbaResearch("B000TEST12 B000TEST13");
 assert.equal(v.tasks.length,8);
 assert.equal(v.externalRequestsMade,0);
 assert.equal(v.keepaTokensUsed,0);
 assert.equal(v.purchaseAuthorized,false);
 assert.throws(()=>planFbaResearch("B000TEST12 B000TEST12"),/Duplicate/);
 assert.throws(()=>planFbaResearch(Array.from({length:26},(_,i)=>"B000000"+String(i).padStart(3,"0")).join(" ")),/1–25/);
});
