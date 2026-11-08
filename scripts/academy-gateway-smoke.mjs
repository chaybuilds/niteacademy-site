import assert from "node:assert/strict";
const url="https://succvbtctjkzsowotcsy.supabase.co/functions/v1/academy-model-gateway";
const health=await fetch(url,{signal:AbortSignal.timeout(15000)});
assert.equal(health.status,200);
const state=await health.json();
assert.equal(state.product,"NiteAcademy hosted model gateway");
assert.equal(state.enabled,false,"Hosted AI must not be enabled before approved provider keys and quotas");
assert.equal(state.max_output_tokens,256);
const denied=await fetch(url,{
 method:"POST",
 headers:{"content-type":"application/json"},
 body:JSON.stringify({provider:"openai",prompt:"What is a good workflow for a fictional business?"}),
 signal:AbortSignal.timeout(15000)
});
assert.equal(denied.status,503,"Unauthenticated public model generation must be locked");
console.log("PASS secure hosted gateway responds HTTP 200 for health");
console.log("PASS hosted generation is zero-spend locked and rejects unsigned POST with HTTP 503");
