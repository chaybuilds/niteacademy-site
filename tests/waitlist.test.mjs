import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const file=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const home=file("../index.html");
const js=file("../assets/waitlist.js");
const css=file("../assets/network-waitlist.css");
const policy=file("../privacy/index.html");
const member=file("../member/index.html");

test("public homepage is one clear NITE Academy network waitlist",()=>{
 assert.match(home,/<title>NITE Academy — Join the Network<\/title>/);
 assert.match(home,/Join the.*network\./s);
 assert.match(home,/consignment network for independent sellers/);
 assert.match(home,/id="waitlist-form"/);
 assert.match(home,/type="email"/);
 assert.match(home,/id="waitlist-consent"/);
 assert.match(home,/Join the network/);
 assert.match(home,/id="waitlist-feedback"/);
 assert.match(home,/id="waitlist-success"/);
 assert.match(home,/You'll be notified when the network is open\./);
 assert.match(home,/Free to join|Join for free/i);
 assert.doesNotMatch(home, /10,000\+|\$[0-9]{2,}|\+\d+%/);
});

test("consent-based anonymous intake preserves existing API security boundary",()=>{
 assert.match(js,/\/rest\/v1\/rpc\/join_nite_academy_waitlist/);
 assert.match(js,/p_consent:true/);
 assert.match(js,/p_company:companyInput.value/);
 assert.match(js,/allowedSources=new Set/);
 assert.match(js,/feedback\.textContent/);
 assert.match(js,/Join the network/);
 assert.doesNotMatch(js,/service_role|supabaseAdmin|signInWithPassword|signUp\(/);
 assert.doesNotMatch(js,/from\("nite_academy_waitlist"\)/);
 assert.doesNotMatch(home,/type="password"/);
});

test("mobile-first original glassmorphism design is light, responsive and accessible",()=>{
 assert.match(css, /backdrop-filter:blur/);
 assert.match(css, /@media\(max-width:480px\)/);
 assert.match(css, /@media\(max-width:359px\)/);
 assert.match(css, /\[hidden\]\{display:none!important\}/);
 assert.match(css,/niterun-chrome-orb\.jpg/);
 assert.match(home,/assets\/network-waitlist\.css/);
 assert.match(home,/assets\/niterun-chrome-orb\.jpg/);
 assert.match(home,/href="\/privacy\/"/);
 assert.match(home,/aria-live="polite"/);
 assert.match(home,/No guaranteed inventory or earnings/);
 assert.match(home,/independent of Amazon, Walmart/);
 assert.doesNotMatch(home,/<canvas/);
});

test("private seller platform remains separately accessible and closed to new accounts",()=>{
 assert.ok(existsSync(new URL("../member/index.html",import.meta.url)));
 assert.match(member,/<base href="\/"/);
 assert.match(member,/id="dashboard-view" hidden/);
 assert.match(member,/assets\/academy\.mjs/);
 assert.match(home,/href="\/member\/"/);
 assert.match(file("../assets/academy.mjs"),/ACADEMY_SIGNUP_READY=false/);
});

test("privacy explains waitlist source tracking, consent and withdrawal",()=>{
 assert.match(policy,/Waitlist and early-access updates/);
 assert.match(policy,/TikTok, YouTube, Instagram/);
 assert.match(policy,/withdraw consent/);
});
