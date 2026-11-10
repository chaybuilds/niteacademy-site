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
 assert.match(client,/settlement_status==="paid"/);
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