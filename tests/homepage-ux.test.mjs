import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const server='1568427976687878275';
const invite='Dm6Hbq68Wt';

test('free mobile learning remains accessible by native disclosure menu and direct Studio action',()=>{
 assert.match(home,/<details class="mobile-nav">/);
 assert.match(home,/<summary>Menu<\/summary>/);
 assert.match(home,/<nav aria-label="Mobile navigation">/);
 assert.match(home,/<a class="mobile-studio-link" href="studio\/">Free Studio<\/a>/);
 assert.match(home,/@media\(max-width:345px\)/);
 assert.match(home,/<a href="studio\/">Free Studio<\/a>/);
});
test('keyboard users can skip to focusable main content',()=>{
 assert.match(home,/<a class="skip-link" href="#top">Skip to main content<\/a>/);
 assert.match(home,/<main id="top" tabindex="-1">/);
 assert.match(home,/\.skip-link:focus/);
});
test('newcomers receive a valid Discord join link before direct private channel links',()=>{
 assert.match(home,/Join the free Discord first/);
 assert.match(home,new RegExp('discord\\.gg/'+invite));
 assert.match(home,new RegExp('discord\\.com/channels/'+server));
 assert.ok(!home.includes('Dm6Hbq68Vq'),'stale invalid invite must not return');
});
test('consent and no-guarantee language remain mandatory at application intake',()=>{
 assert.match(home,/id="consent" name="consent" type="checkbox" required/);
 assert.match(home,/I understand no customers, income, or paid opportunity is guaranteed/);
 assert.match(home,/This is an inquiry, not a payment/i);
});
test('application failure offers safe clickable email without leaking server diagnostic details',()=>{
 assert.match(home,/document\.createElement\('a'\)/);
 assert.match(home,/contact\.href='mailto:chayson@niterun.com/);
 assert.match(home,/status\.append\(contact/);
 assert.ok(!home.includes("String(error.message||'')"));
});
