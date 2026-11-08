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

test("verified DNS activates only by adding the exact CNAME file on the main branch",async()=>{
 const calls=[];
 const request=async(method,path,data,options)=>{
  calls.push({method,path,data,options});
  if(method==="GET"&&path.endsWith("/pages"))return {cname:null,source:{branch:"main",path:"/"}};
  if(method==="GET"&&path.includes("/contents/CNAME")){
   assert.equal(options?.optional404,true);
   return null;
  }
  if(method==="PUT"&&path.endsWith("/contents/CNAME"))return {content:{name:"CNAME"}};
  throw Error("Unexpected provider call");
 };
 const result=await activate({ready:true},request);
 assert.deepEqual(result,{changed:true,reason:"dns_ready_cname_committed"});
 assert.equal(calls.length,3);
 assert.equal(calls[2].data.branch,"main");
 assert.equal(Buffer.from(calls[2].data.content,"base64").toString("utf8"),"niteacademy.com");
 assert.ok(calls.every(c=>!c.path.endsWith("/pages")||c.method==="GET"),"never mutate Pages settings API");
});
test("a conflicting Pages custom domain is never overwritten",async()=>{
 const methods=[];
 const request=async(method,path)=>{
  methods.push(method+" "+path);
  return {cname:"another.example.com",source:{branch:"main",path:"/"}};
 };
 await assert.rejects(()=>activate({ready:true},request),/Another custom domain/);
 assert.equal(methods.length,1);
});
test("a conflicting CNAME file is never overwritten",async()=>{
 const calls=[];
 const request=async(method,path)=>{
  calls.push(method+" "+path);
  if(path.endsWith("/pages"))return {cname:null,source:{branch:"main",path:"/"}};
  if(path.includes("/contents/CNAME"))return {type:"file",encoding:"base64",content:Buffer.from("other.example.com").toString("base64")};
  throw Error("Unexpected mutation");
 };
 await assert.rejects(()=>activate({ready:true},request),/Existing CNAME belongs/);
 assert.equal(calls.length,2);
});
test("an already-correct CNAME is idempotent and never writes a second commit",async()=>{
 const calls=[];
 const request=async(method,path)=>{
  calls.push(method+" "+path);
  if(path.endsWith("/pages"))return {cname:null,source:{branch:"main",path:"/"}};
  if(method==="GET"&&path.includes("/contents/CNAME"))return {type:"file",encoding:"base64",content:Buffer.from("niteacademy.com\n").toString("base64")};
  throw Error("Unexpected mutation");
 };
 assert.deepEqual(await activate({ready:true},request),{changed:false,reason:"correct_cname_already_present"});
 assert.equal(calls.length,2);
});
test("does not touch GitHub if branch or publishing directory changed",async()=>{
 const request=async()=>({cname:null,source:{branch:"other-branch",path:"/docs"}});
 await assert.rejects(()=>activate({ready:true},request),/Source branch\/path changed/);
});
