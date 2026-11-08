// Automatic GitHub Pages domain cutover gate.
// No mutation unless two independent DNS resolvers return exact expected records.
import {Resolver} from "node:dns/promises";
export const PAGE_IPS=["185.199.108.153","185.199.109.153","185.199.110.153","185.199.111.153"];
export const DOMAIN="niteacademy.com";
export const WWW="www.niteacademy.com";
export const WWW_CNAME="chaybuilds.github.io";
const norm=s=>String(s||"").toLowerCase().replace(/\.$/,"");
const same=(a,b)=>JSON.stringify([...new Set(a)].sort())===JSON.stringify([...new Set(b)].sort());
export function validateDns(addresses,cnames){
 const root=Array.isArray(addresses)&&same(addresses,PAGE_IPS);
 const www=Array.isArray(cnames)&&cnames.length===1&&norm(cnames[0])===WWW_CNAME;
 return {root,www,ready:root&&www};
}
export async function inspect(server,lookup){
 let addresses=[],cnames=[],error=null;
 try{
  if(lookup){({addresses,cnames}=await lookup(server));}
  else{
   const r=new Resolver();r.setServers([server]);
   [addresses,cnames]=await Promise.all([r.resolve4(DOMAIN),r.resolveCname(WWW)]);
  }
 }catch(e){error=String(e?.code||e?.message||"dns_failed").slice(0,120);}
 return {server,addresses,cnames,error,...validateDns(addresses,cnames)};
}
export async function readiness(lookup){
 const results=await Promise.all(["1.1.1.1","8.8.8.8"].map(ip=>inspect(ip,lookup)));
 return {ready:results.every(x=>x.ready),results};
}
async function api(method,path,data){
 const token=process.env.GITHUB_TOKEN;
 if(!token)throw Error("No GitHub Actions token");
 const r=await fetch("https://api.github.com"+path,{method,headers:{
  accept:"application/vnd.github+json",
  "content-type":"application/json",
  authorization:"Bearer "+token,
  "x-github-api-version":"2026-03-10",
  "user-agent":"NiteAcademy-DnsSafetyGate"
 },body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(18000)});
 const txt=await r.text();
 if(!r.ok)throw Error("GitHub Pages API HTTP "+r.status+" "+txt.slice(0,200));
 return txt?JSON.parse(txt):null;
}
export async function activate(state){
 if(!state.ready)return {changed:false,reason:"dns_not_ready"};
 const url="/repos/chaybuilds/niteacademy-site/pages";
 const page=await api("GET",url);
 if(page?.cname===DOMAIN)return {changed:false,reason:"already_configured"};
 if(page?.cname)throw Error("Another custom domain is configured. Refusing overwrite");
 if(page?.source?.branch!=="main"||page?.source?.path!=="/")
  throw Error("Source branch/path changed. Refusing domain cutover");
 await api("PUT",url,{cname:DOMAIN,source:{branch:"main",path:"/"}});
 return {changed:true,reason:"two_dns_resolvers_verified"};
}
if(import.meta.url.endsWith("/domain-readiness.mjs")&&process.argv[1]?.replace(/\\/g,"/").endsWith("domain-readiness.mjs")){
 const state=await readiness();
 console.log("DNS_CHECK "+JSON.stringify(state));
 if(process.argv.includes("--activate")){
  if(!state.ready)console.log("DNS_NOT_READY: original Pages domain remains live");
  else{
   try{console.log("CUTOVER "+JSON.stringify(await activate(state)));}
   catch(e){console.error("CUTOVER_FAILED "+String(e?.message||e));process.exitCode=1;}
  }
 }
}
