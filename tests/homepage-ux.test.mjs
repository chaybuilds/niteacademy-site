import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const home=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const client=readFileSync(new URL("../assets/academy.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/academy.css",import.meta.url),"utf8");
test("minimal mobile-first homepage and direct account onboarding",()=>{
 assert.match(home,/<h1>Make money\.<\/h1>/);
 assert.match(home,/id="start-button"/);
 assert.match(home,/id="auth-form"/);
 assert.match(home,/id="dashboard-view" hidden/);
 assert.match(home,/type="module" src="assets\/academy.mjs"/);
 assert.match(css,/@media\(max-width:510px\)/);
});
test("clear no-inventory-purchase distinction and no earnings guarantee",()=>{
 assert.match(home,/without purchasing that inventory upfront/);
 assert.match(home,/No guaranteed products, earnings, or seller approval/);
 assert.match(home,/Amazon selling fees and FBA costs still apply/);
 assert.match(home,/no.*guarantee/i);
});
test("real Supabase authenticated private dashboard",()=>{
 assert.match(client,/client\.auth\.signUp/);
 assert.match(client,/client\.auth\.signInWithPassword/);
 assert.match(client,/client\.auth\.getSession/);
 assert.match(client,/\.eq\("user_id",user\.id\)/);
 assert.match(client,/from\("nite_academy_ledger"\)/);
 assert.match(client,/from\("nite_consignment_member_balances"\)/);
 assert.match(client,/outstanding_cents/);
 assert.match(client,/function downloadConsignmentStatement/);
 assert.match(client,/from\("nite_consignment_reports"\)/);
 assert.match(home,/Seller ID \(optional until ready\)/);
});
test("account owner retains Amazon control and integrations are not falsely advertised",()=>{
 assert.match(home,/Amazon pays your own registered bank account/);
 assert.match(home,/Live Amazon API access.*not been activated/);
 assert.match(home,/We never ask for your Amazon password/);
 assert.match(home,/No consignment inventory/);
 assert.doesNotMatch(client,/https:\/\/sellercentral\.amazon\.com\/.*password/);
});
test("existing Studio learning experience remains reachable",()=>{
 assert.match(home,/href="studio\/"/);
 assert.match(home,/NITE Run Delivery LLC/);
});

test("Starter and Professional routes are free Academy membership with honest external Amazon prices",()=>{
 assert.match(home,/id="choose-starter"/);
 assert.match(home,/id="choose-elite"/);
 assert.match(home,/Amazon Individual/);
 assert.match(home,/Amazon Professional/);
 assert.match(home,/\$0\.99 per sale/);
 assert.match(home,/\$39\.99/);
 assert.match(home,/Academy membership fee/);
 assert.match(home,/NITERUN's integration is authorized/);
 assert.match(client,/\.update\(\{academy_path:academyPath/);
 assert.match(client,/classList\.toggle\("active"/);
 assert.match(css,/\.route-options/);
 assert.match(css,/@media\(max-width:670px\)/);
});
test("path selection is not treated as Amazon OAuth authorization or seller verification",()=>{
 assert.match(client,/profile\.academy_path/);
 assert.match(client,/No Amazon account is connected/);
 assert.match(client,/secure Amazon OAuth is not yet available/);
 assert.match(home,/Saving an Amazon Seller ID does not connect or verify your account/);
 assert.doesNotMatch(client,/client\.auth\.signInWithPassword\(\{email.*amazon/i);
});
