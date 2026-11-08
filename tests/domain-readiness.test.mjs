import test from "node:test";
import assert from "node:assert/strict";
import {PAGE_IPS,validateDns,readiness,activate} from "../scripts/domain-readiness.mjs";
test("only exact GitHub apex and www CNAME authorize the cutover",()=>{
 assert.equal(validateDns(PAGE_IPS,["chaybuilds.github.io."]).ready,true);
 assert.equal(validateDns(PAGE_IPS,["chaybuilds.github.io"]).ready,true);
 assert.equal(validateDns([...PAGE_IPS,"192.64.119.90"],["chaybuilds.github.io"]).ready,false);
 assert.equal(validateDns(["192.64.119.90"],["chaybuilds.github.io"]).ready,false);
 assert.equal(validateDns(PAGE_IPS,["parkingpage.namecheap.com"]).ready,false);
 assert.equal(validateDns(PAGE_IPS,[]).ready,false);
 assert.equal(validateDns([],["chaybuilds.github.io"]).ready,false);
});
test("requires both distinct DNS resolvers before readiness",async()=>{
 const one=await readiness(async server=>({
  addresses:server==="1.1.1.1"?PAGE_IPS:["192.64.119.90"],
  cnames:["chaybuilds.github.io"]
 }));
 assert.equal(one.ready,false);
 assert.equal(one.results.filter(r=>r.ready).length,1);
});
test("refuses to contact GitHub without authoritative readiness",async()=>{
 const result=await activate({ready:false});
 assert.deepEqual(result,{changed:false,reason:"dns_not_ready"});
});
