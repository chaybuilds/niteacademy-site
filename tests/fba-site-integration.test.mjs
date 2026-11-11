import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const home=read("../member/index.html");
const page=read("../fba/index.html");
const css=read("../fba/fba.css");
const client=read("../fba/client.mjs");
const engine=read("../fba/engine.mjs");
const memberSql=read("../supabase/sql/nite_academy_fba_research_v1.sql");
const supplierSql=read("../supabase/sql/nite_academy_supplier_research_v1.sql");
test("Academy keeps original signup, login, Studio, consignment and the new desk",()=>{
 assert.match(home,/<h1>Make money\.<\/h1>/);
 assert.match(home,/href="fba\/"/);
 assert.match(home,/href="studio\/"/);
 assert.match(home,/id="dashboard-view" hidden/);
 assert.match(home,/id="match-request"/);
 assert.match(home,/assets\/academy\.mjs/);
});
test("public research desk offers three distinct models and does not fake live integrations",()=>{
 for(const mode of ["wholesale","consignment","introduction"])
  assert.match(page,new RegExp('value="'+mode+'"'));
 for(const id of ["scenario-form","planner-form","member-state","saved-list"])
  assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/No orders, messages, shipments or spend are initiated here/);
 assert.match(page,/No guaranteed/); // if this fails, public copy must clarify profits are not guaranteed
 assert.match(css,/@media\(max-width:700px\)/);
});
test("client uses only member-scoped RLS records and no privileged server key",()=>{
 assert.match(client,/client\.auth\.getSession\(\)/);
 assert.match(client,/from\("nite_academy_fba_research"\)/);
 assert.match(client,/\.eq\("user_id",currentUser\.id\)/);
 assert.match(client,/window\.confirm/);
 assert.doesNotMatch(client,/service_role|sb_secret_|sk_test_|sk_live_/);
 assert.match(client,/textContent/);
});
test("unverified FBA worklist and all business models stay closed to purchase",()=>{
 assert.match(engine,/purchaseAuthorized:false/);
 assert.match(engine,/reviewStatus:"HOLD"/);
 assert.match(engine,/keepaTokensUsed:0/);
 assert.doesNotMatch(engine,/fetch\(|XMLHttpRequest|localStorage|placeOrder|sendEmail/);
});
test("separate member scenario policy and staff-only supplier archive",()=>{
 assert.match(memberSql,/enable row level security/);
 assert.match(memberSql,/auth\.uid\(\)/);
 assert.match(memberSql,/grant select, insert, delete/);
 assert.doesNotMatch(memberSql,/grant .* update .*authenticated/);
 assert.match(memberSql,/UNVERIFIED_RESEARCH/);
 assert.match(supplierSql,/revoke all .* public,anon,authenticated/);
 assert.match(supplierSql,/to service_role/);
 assert.doesNotMatch(supplierSql,/create policy .* to authenticated/);
});
test("signup pause and no Amazon account access remain unmodified",()=>{
 const app=read("../assets/academy.mjs");
 assert.match(app,/const ACADEMY_SIGNUP_READY=false/);
 assert.match(home,/Live Amazon API access.*not been activated/);
 assert.match(page,/No automatic buying, listings, messaging/);
});
