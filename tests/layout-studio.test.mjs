import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const file=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const html=file("../layouts/index.html");
const js=file("../layouts/layouts.js");
const css=file("../layouts/layouts.css");
const notes=file("../layouts/OPEN_SOURCE_SOURCES.md");
const home=file("../member/index.html");

test("three visible open-source-derived layout choices and direct preview entry point",()=>{
 for(const option of ["commerce","merchant","studio"]){
  assert.match(html,new RegExp("data-theme=\""+option+"\""));
  assert.match(js,new RegExp("function "+option+"\\("));
 }
 assert.match(html,/id="preview-frame"/);
 assert.match(html,/id="layout-mount"/);
 assert.match(html,/noindex,nofollow/);
 assert.match(home,/href="layouts\/"/);
});

test("the directions have browse, seller and academy screen toggles plus mobile switching",()=>{
 for(const screen of ["discover","business","learn"])assert.match(html,new RegExp('data-screen="'+screen+'"'));
 assert.match(js,/function updateURL\(/);
 assert.match(js,/classList\.toggle\("is-phone"/);
 assert.match(css,/@container preview \(max-width:510px\)/);
 assert.match(css,/@media\(max-width:440px\)/);
});

test("filters, modal detail, selection and link sharing are interactive only inside this page",()=>{
 assert.match(js,/function updateSearch\(/);
 assert.match(js,/function showDetail\(/);
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(js,/localStorage\.setItem\("niteacademy_layout_direction"/);
 assert.doesNotMatch(js,/\bfrom\("nite_academy_/);
 assert.doesNotMatch(js,/supabase\.co\/auth\/v1/);
 assert.doesNotMatch(js,/service_role/);
});

test("demo data and real seller expectations are clearly distinguished",()=>{
 assert.match(html,/Concept preview only/);
 assert.match(js,/Category concept · Supply not yet approved/);
 assert.match(js,/0 units/);
 assert.match(js,/Autonomous Amazon integration is not active/);
 assert.match(js,/Amazon fees apply separately/);
 assert.match(html,/noindex,nofollow/);
});

test("source licensing and excluded Dawn license are disclosed",()=>{
 for(const source of ["bbulakh/tailwind-ecommerce","tabler/tabler","shadcn-ui/ui"])assert.ok(notes.includes(source));
 assert.match(notes,/Shopify Dawn/);
 assert.match(notes,/not exact forks/);
 assert.match(notes,/no production publish/);
});

test("existing main website and its manual launch gate remain intact",()=>{
 assert.match(home,/assets\/academy\.mjs/);
 const production=file("../assets/academy.mjs");
 assert.match(production,/ACADEMY_SIGNUP_READY=false/);
 assert.ok(existsSync(new URL("../fba/index.html",import.meta.url)));
 assert.ok(existsSync(new URL("../studio/index.html",import.meta.url)));
});

test("immersive full page preview keeps layout selection independent of production",()=>{
 assert.match(html,/id="fullscreen-link"/);
 assert.match(html,/id="full-exit"/);
 assert.match(js,/const fullPreviewMode=query\.get\("full"\)==="1"/);
 assert.match(css,/body\.full-preview/);
 assert.match(css,/body\.full-preview \.browser-chrome\{display:none\}/);
});
