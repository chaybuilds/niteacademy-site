import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const file=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const home=file("../index.html");
const js=file("../assets/waitlist.js");
const css=file("../assets/waitlist.css");
const policy=file("../privacy/index.html");
const member=file("../member/index.html");

test("public homepage is a clear Amazon seller early-access waitlist",()=>{
 assert.match(home,/Your Amazon/);
 assert.match(home,/id="waitlist-form"/);
 assert.match(home,/type="email"/);
 assert.match(home,/id="waitlist-consent"/);
 assert.match(home,/Join the waitlist/);
 assert.match(home,/id="waitlist-feedback"/);
 assert.match(home,/id="waitlist-success"/);
 assert.match(home,/Amazon selling and FBA fees apply/);
 assert.match(home,/not affiliated with or endorsed by Amazon/);
});

test("anonymous waitlist API is consent-based, idempotent and free of auth passwords",()=>{
 assert.match(js,/\/rest\/v1\/rpc\/join_nite_academy_waitlist/);
 assert.match(js,/p_consent:true/);
 assert.match(js,/p_company:companyInput.value/);
 assert.match(js,/allowedSources=new Set/);
 assert.match(js,/feedback\.textContent/);
 assert.doesNotMatch(js,/service_role|supabaseAdmin|signInWithPassword|signUp\(/);
 assert.doesNotMatch(js,/from\("nite_academy_waitlist"\)/);
 assert.doesNotMatch(home,/type="password"/);
});

test("responsive root uses original styling and no fake revenue evidence",()=>{
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.match(css, /\.form-controls/);
 assert.doesNotMatch(home, /10,000\+|\$[0-9]{2,}|\+\d+%/);
 assert.match(home,/No Amazon login needed/);
});

test("the existing private seller application remains separately accessible",()=>{
 assert.ok(existsSync(new URL("../member/index.html",import.meta.url)));
 assert.match(member,/<base href="\/"/);
 assert.match(member,/id="dashboard-view" hidden/);
 assert.match(member,/assets\/academy\.mjs/);
 assert.match(home,/href="\/member\/"/);
 assert.match(file("../assets/academy.mjs"),/ACADEMY_SIGNUP_READY=false/);
});

test("privacy text explains source tracking, consent, and opt-out",()=>{
 assert.match(policy,/Waitlist and early-access updates/);
 assert.match(policy,/TikTok, YouTube, Instagram/);
 assert.match(policy,/withdraw consent/);
});
