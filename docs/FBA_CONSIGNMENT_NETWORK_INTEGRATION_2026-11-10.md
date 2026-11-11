# NITE Academy × NOVA FBA / Consignment Integration — 2026-11-10

**Owner platform:** https://niteacademy.com/ → GitHub Pages, repository `chaybuilds/niteacademy-site`.
**Feature:** `/fba/` — publicly usable, *research-only* Amazon FBA wholesale, supplier-funded consignment, and referral fee modeling.
**Production database:** existing Supabase project `succvbtctjkzsowotcsy` (Outreach Labs; also runs NITERUN Academy).
**Prepared by:** AJ / Chasen coordinated build; this document is a shared engineering handoff, **not a change to either person's ChatGPT account memory**.

## Sources intentionally combined
1. **NOVA commerce and Jarvis research:** `chaygray89/niterun-commerce` draft PR #19, `src/amazon-fba-opportunity.ts` and `src/amazon-fba-research-worklist.ts`, source-linked Keepa research and Amazon official SP-API adapter study. Original modules remain unmerged; no live API or billing. This feature ports useful deterministic logic to browser ESM and keeps all work flagged HOLD without provider evidence. https://github.com/chaygray89/niterun-commerce/pull/19
2. **Academy consignment:** existing `scripts/consignment-ledger.mjs` for seller/supplier/NITERUN allocation reconciliation; existing site member profiles, agreement verification, private allocations and review-only settlement upload preserved. Feature calls the **same canonical arithmetic**.
3. **Supplier network:** `chaygray89/niterun-commerce` draft PR #20 research snapshot 43 public supplier/seller leads, 34 held-unsent email inquiries, 4 further research and 5 channel-excluded. Supplier research is stored in a **staff-only** database table. Nothing is a real approved supplier until independent agreements, rights and operational verification. https://github.com/chaygray89/niterun-commerce/pull/20
4. **Chasen’s Mac Academy Discord:** independently maintained `~/NiteRun/nite-campus-discord/deal-network/` commands /learning-plan, /academy, and lessons. Do not overwrite or claim a new Discord bot is deployed. Night Academy Studio remains reachable.

## Functional integration
- `fba/index.html` plus `fba/fba.css` and `fba/client.mjs`: dark mobile-ready research workbench, 3 business model calculations, transparent readiness card, offline 25-ASIN task planner, member-scoped research drafts. All amounts labeled hypothetical.
- `fba/engine.mjs` imports `scripts/consignment-ledger.mjs`. Wholesale: conservative min(current, 90-day median) price, supplier unit/freight/prep, all Amazon fee reserves, full case pack rounding, MOQ/capital/margin/loss holds. Consignment: supplier-funded upfront *assumption* and revenue split before actual contract. Introduction: negotiated hypothetical first-order fee, always earned $0.
- `index.html` now links to research from main landing, account dashboard workflow and footer. No changes to login/session core, payment paths or released inventory.
- `supabase/sql/nite_academy_fba_research_v1.sql`: **deployed and inspected in connected Supabase**. Member drafts with owner-only SELECT/INSERT/DELETE RLS, no UPDATE. Anonymous SELECT denied. `verification_status` is database-constrained to UNVERIFIED_RESEARCH.
- `supabase/sql/nite_academy_supplier_research_v1.sql`: **deployed and inspected**. Staff service-role only, anonymous and authenticated denied; **43 research-only records imported**, all signed/approved flags false, no public API access. Original confirmed approved supplier/lot tables remain 0 rows.
- No supplier, sales partner, product, listing, payment or inventory transfer was approved by this change.

## Account / cost boundaries
- Amazon Individual ($0/month plus per-item and FBA costs) is not an Amazon SP-API authorization. A Professional account's $39.99/month price and API eligibility need merchant onboarding and allowed roles; all subscriptions require owner selection. Keepa hosted MCP requires plan entitlement and may consume tokens.
- This feature **does not connect Amazon, Keepa, TikTok, PayPal, Stripe, or launch any ad / email / browser automation**. Input values are manual illustrations. An ASIN typed here is not listing permission.
- Never ask for Amazon seller passwords, 2FA codes, bank credentials or supplier secret API tokens in the public site. Future seller integrations use approved OAuth and vaults.
- Production new registration stays **paused** with `ACADEMY_SIGNUP_READY=false` until the shared Supabase Auth SMTP and redirect flow are genuinely verified; this change does not flip it.
- Public pages do not import `nite_academy_supplier_research` (staff-only). Staff service role must be kept server-side; no service keys in HTML or GitHub.

## Real integration sequencing for Jarvis
1. Keep FBA decisions as **HOLD** until signed supplier rights, seller-specific Amazon listing restrictions, actual cost/fulfillment data and quotes. A price signal alone is not an eligible buy.
2. Replace manual historical price and fee fields with **read-only** official Keepa MCP and Amazon Selling Partner API calls only after legitimate authorization, per-provider cost limits and rate limits. Begin with 5 ASINs; cache and show freshness.
3. Add authorized staff-only supplier research and a signed contract import workflow. Research leads never automatically become approved consignment suppliers.
4. Link only **legally authorized** suppliers and verified seller accounts to actual product lots, with the existing Academy consignment control tower enforcing agreement/hash/quantity/seller verification.
5. Record audited inbound FBA shipments and settlement reconciliations. No automated purchases, payout deductions, messages, or listings until explicit separate approval.
6. Let Chasen's local Jarvis/ChatGPT consume this doc and GitHub PR through authorized reading; these notes don't alter his ChatGPT memory. Shared GitHub is the durable source of truth, not copies of private chat transcripts.

## Verified baseline and post-change checks
- Fresh isolated Mac clone from upstream `chaybuilds/niteacademy-site` main commit `bbc3aec`, branch `feat/fba-consignment-intelligence-20261110`. Original Mac worktree with untracked notes untouched.
- Prior baseline: `node --test tests/*.test.mjs`: 28/28 passed.
- New pure engine tests: 8/8 passed with zero external calls.
- Supabase after migration: `nite_academy_fba_research` RLS on, anonymous SELECT false, authenticated SELECT/INSERT/DELETE true, UPDATE false, owner policies for each. Actual scenario records 0.
- Supplier snapshot: 43 records = 34 held + 4 research + 5 excluded, zero approval flags; table RLS on and no public/authenticated SELECT grants. No real suppliers allocated.

## Release truth
GitHub branch/PR and live deployment are independent events. A local Mac working copy is **not** a deployed live website until branch merged to the correct GitHub Pages source and live HTTP/JS checks pass. Retain seller signup and all partner approval gates.
