// Pure, deterministic consignment arithmetic for the NITERUN control tower.
// Monetary inputs and outputs are integer cents. No API calls or side effects.
function cents(value,name){
 if(!Number.isSafeInteger(value)||value<0)throw new RangeError(name+" must be a nonnegative, safe integer number of cents");
 return value;
}
function bps(value,name){
 if(!Number.isInteger(value)||value<0||value>10000)throw new RangeError(name+" must be 0–10,000 basis points");
 return value;
}
export function calculateConsignmentStatement({grossCents,amazonFeesCents=0,refundsCents=0,otherCostsCents=0,sellerBps,niterunBps}){
 const gross=cents(grossCents,"grossCents"),fees=cents(amazonFeesCents,"amazonFeesCents");
 const refunds=cents(refundsCents,"refundsCents"),costs=cents(otherCostsCents,"otherCostsCents");
 const sellerRate=bps(sellerBps,"sellerBps"),nrRate=bps(niterunBps,"niterunBps");
 if(sellerRate+nrRate>10000)throw new RangeError("supplier share cannot be negative");
 const net=gross-fees-refunds-costs;
 if(net<0)throw new RangeError("expenses exceed gross sales; carry deficits to a separately reviewed adjustment");
 const sellerShare=Number(BigInt(net)*BigInt(sellerRate)/10000n);
 const niterunShare=Number(BigInt(net)*BigInt(nrRate)/10000n);
 const supplierShare=net-sellerShare-niterunShare; // residual cents follow agreed priority
 const dueToNiterun=supplierShare+niterunShare;
 return {grossSalesCents:gross,amazonFeesCents:fees,refundsCents:refunds,otherCostsCents:costs,
  netDistributableCents:net,sellerShareCents:sellerShare,niterunFeeCents:niterunShare,
  supplierShareCents:supplierShare,dueToNiterunCents:dueToNiterun};
}
export function reconcileCollection(dueCents,events=[]){
 const due=cents(dueCents,"dueCents");let collected=0;
 const ids=new Set();
 for(const event of events){
  const id=String(event.providerEventId||"");
  if(!id||ids.has(id))throw new Error("missing or duplicate provider event ID");
  ids.add(id);
  const amount=cents(event.amountCents,"amountCents");
  if(!amount)throw new RangeError("payment event amount cannot be zero");
  if(event.kind==="received")collected+=amount;
  else if(event.kind==="reversed")collected-=amount;
  else throw new Error("unsupported payment event type");
  if(collected<0||collected>due)throw new RangeError("payment events exceed valid contractual balance");
 }
 return {dueCents:due,collectedCents:collected,outstandingCents:due-collected,fullyCollected:collected===due};
}
export function validateLotCapacity(authorizedUnits,allocations=[]){
 if(!Number.isSafeInteger(authorizedUnits)||authorizedUnits<=0)throw new RangeError("positive authorized units required");
 let allocated=0;
 for(const a of allocations){
  if(!Number.isSafeInteger(a.quantity)||a.quantity<=0)throw new RangeError("allocation units must be positive");
  if(a.state!=="cancelled")allocated+=a.quantity;
 }
 if(allocated>authorizedUnits)throw new RangeError("over-allocation of consigned inventory");
 return {authorizedUnits,allocatedUnits:allocated,remainingUnits:authorizedUnits-allocated};
}
