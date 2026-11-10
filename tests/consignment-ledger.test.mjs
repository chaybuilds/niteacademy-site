import test from "node:test";
import assert from "node:assert/strict";
import {calculateConsignmentStatement,reconcileCollection,validateLotCapacity} from "../scripts/consignment-ledger.mjs";
test("40-dollar Amazon sale reconciles to 28 dollars after assumed fees and 21 dollars owed",()=>{
 const s=calculateConsignmentStatement({grossCents:4000,amazonFeesCents:1200,sellerBps:2500,niterunBps:1000});
 assert.deepEqual([s.netDistributableCents,s.sellerShareCents,s.niterunFeeCents,s.supplierShareCents,s.dueToNiterunCents],[2800,700,280,1820,2100]);
 assert.equal(s.sellerShareCents+s.supplierShareCents+s.niterunFeeCents,s.netDistributableCents);
});
test("refunds and new costs reduce distributable profit",()=>{
 const s=calculateConsignmentStatement({grossCents:6000,amazonFeesCents:1100,refundsCents:800,otherCostsCents:100,sellerBps:2000,niterunBps:1000});
 assert.equal(s.netDistributableCents,4000);
 assert.equal(s.dueToNiterunCents,3200);
});
test("refunds greater than gross fail instead of fabricating positive profit",()=>{
 assert.throws(()=>calculateConsignmentStatement({grossCents:100,refundsCents:200,sellerBps:2000,niterunBps:1000}),/expenses exceed/);
});
test("fee share cannot exceed 100 percent",()=>{
 assert.throws(()=>calculateConsignmentStatement({grossCents:100,sellerBps:9500,niterunBps:1000}),/negative/);
});
test("partial payments, full settlement, and reversal are idempotent and exact",()=>{
 const v=reconcileCollection(2100,[{providerEventId:"stripe-1",kind:"received",amountCents:2100},{providerEventId:"stripe-2",kind:"reversed",amountCents:400}]);
 assert.deepEqual(v,{dueCents:2100,collectedCents:1700,outstandingCents:400,fullyCollected:false});
});
test("duplicate event, overpayment and reversal without receipt are refused",()=>{
 assert.throws(()=>reconcileCollection(100,[{providerEventId:"x",kind:"received",amountCents:50},{providerEventId:"x",kind:"received",amountCents:50}]),/duplicate/);
 assert.throws(()=>reconcileCollection(100,[{providerEventId:"x",kind:"received",amountCents:101}]),/exceed/);
 assert.throws(()=>reconcileCollection(100,[{providerEventId:"x",kind:"reversed",amountCents:1}]),/exceed/);
});
test("cancelled allocations return capacity and over-allocation is prohibited",()=>{
 assert.deepEqual(validateLotCapacity(20,[{quantity:7,state:"shipped"},{quantity:4,state:"cancelled"},{quantity:5,state:"proposed"}]),{authorizedUnits:20,allocatedUnits:12,remainingUnits:8});
 assert.throws(()=>validateLotCapacity(20,[{quantity:12,state:"shipped"},{quantity:10,state:"proposed"}]),/over-allocation/);
});
