# NITE Academy — Consignment Seller Network (November 10, 2026)

**Live website:** https://niteacademy.com/ — confirmed HTTPS 200 and HTTP→HTTPS on November 10, 2026.  
**WWW:** https://www.niteacademy.com/ — verified HTTPS 301 to the apex domain.  
**Learning studio:** https://niteacademy.com/studio/ (original GitHub Pages URL redirects).

**Current public launch (November 10):** Amazon seller early-access waitlist at **https://niteacademy.com/**. No password, payment, or Amazon login needed. Existing member interface is preserved at **https://niteacademy.com/member/** with new account creation still gated pending full callback QA. Private Supabase waitlist intake is working and exposed only via a consent-checked, idempotent public RPC. Channel tracking supports `?source=tiktok`, `?source=youtube`, `?source=instagram`, and default website. See [waitlist operations](docs/WAITLIST_OPERATIONS.md).

The former **Make money. → free account → private seller dashboard** homepage is now preserved at `/member/` for continued development, not the primary public entry point.

## NITERUN chrome-aligned Amazon waitlist (November 10)

The public Academy homepage now reuses the owner-approved **NITERUN private beta** design language from Base44 app `NITERUN`, reference page `src/pages/NiteBetaWaitlist.jsx` and styles `src/styles/nite-beta-waitlist.css`: charcoal/graphite field, instrument-serif accents, a technical cyan access terminal, ambient orbit composition, and the original owned chrome visual. Source adaptations are retained in `assets/niterun-chrome-reference.css`, `assets/niterun-chrome-orb.css`, and `assets/waitlist.css`. The chrome artwork is served as a ~346 KB static JPEG rather than live WebGL to keep the signup experience fast on mobile and lower the CPU/GPU cost during the founder's TikTok Live.

**Backend unchanged:** `/rest/v1/rpc/join_nite_academy_waitlist` with consent-based email capture, private table and per-channel attribution. The guarded seller dashboard remains at `/member/`, and the active signup gate remains closed pending end-to-end email-confirmation callback QA. No supplier inventory, Amazon OAuth, earnings or automatic selling was activated.

## Open-source layout studio

Three interactive, responsive design candidates are available at **https://niteacademy.com/layouts/** (after deployment): Commerce, Merchant, and Studio. Each previews catalog browsing, a seller dashboard, and Academy learning views. The preview routes remain available for future design work, but public traffic now lands on the waitlist. The old authenticated member dashboard remains available at `/member/`. [Design decision guide](docs/NITE_ACADEMY_COMMERCE_DESIGN_VISION.md) · [Source and licensing notes](layouts/OPEN_SOURCE_SOURCES.md).


## Layout selected — Midnight Minimal v1

The single cohesive visual design is black/charcoal with quiet grayscale panels and one white primary CTA. The public landing page deliberately has one primary message **Make money**, a succinct supplier proposition and a free-account action. The personal dashboard carries the same design with two clear onboarding modes: **Start Free ($0/mo Amazon Individual)** and **Professional Seller ($39.99/mo Amazon Professional, paid to Amazon)**. No false claims of connected OAuth, supplier inventory or earnings appear. This is a source implementation, not a live Amazon automation guarantee.

## Domain and browser audit (November 10, 2026)

- Namecheap account `chayniterun`: domain niteacademy.com registered and active through November 8, 2027.
- Removed @ parking URL redirect; set four GitHub Pages A records 185.199.108/109/110/111.153 and www CNAME chaybuilds.github.io.
- Preserved existing TXT/SPF under Namecheap Mail Settings; made no DNS changes to other NITERUN domains.
- Added repo-root CNAME; GitHub Pages DNS check passed; HTTPS certificate subsequently served valid requests and Enforce HTTPS was activated.
- Verified HTTP 301 -> HTTPS 200; www HTTPS -> apex HTTPS; tested privacy and dashboard assets.
- Closed eight clearly stale/duplicate Chrome tabs; preserved active company development and operational work.
- Namecheap verification email link displayed "no longer valid," which may indicate prior verification; current registrar domain status was ACTIVE, but contact verification completion was not independently confirmed.
- Supabase Outreach Labs project access and incognito administrator session are now working. Academy's exact Auth redirect has been allowlisted, preserving VentureQ's original Site URL and redirect entries.
- Custom Supabase SMTP is now enabled with a verified Resend domain and a 30 emails/hour rate limit. A disposable test signup produced an actual confirmation email received at Gmail; the final confirmation-click/browser-dashboard verification and cleanup remain pending. No production paid operations, seller authorization or inventory contracts were activated.

## Implemented

- Free registration and sign-in using the existing NITERUN Supabase project.
- Member-owned onboarding profile, self-reported Amazon plan and Seller ID, product interests.
- Private seller dashboard with NIKO guided onboarding and truthful eligibility states.
- Consignment application write path, stored for review, without inventing inventory.
- Read-only member-specific allocation and ledger records; company-only verification, allocation, and settlement writes.
- Row-level security and least-privilege grants for all new Academy tables.
- Responsive dark UI, program information, preserved learning Studio and archived original homepage.
- GitHub Actions release quality checks.

## Not yet active or verified

- Signed manufacturer consignment contracts and approved product inventory.
- Amazon SP-API OAuth, automatic browser control, and live Amazon order synchronization.
- Automatic deductions from seller payouts or ACH payment mandates.
- Actual member earnings, paid supplier settlements, or income claims.
- Full production email confirmation and sign-in test on a real mailbox.
- End-to-end member email confirmation callback, private dashboard and route-selection testing; SMTP, sender verification, delivered confirmation email and canonical callback allowlist have passed their separate checks. See [release gate](docs/ACADEMY_AUTH_REDIRECT_RELEASE_GATE.md).

**Amazon plans:** Individual is $0/month with a $0.99/item fee plus applicable Amazon and FBA fees, but does not offer SP-API access. Professional is $39.99/month plus applicable fees and supports SP-API. Full automated seller connections require a reviewed public SP-API app and seller-specific OAuth authorization. Do not ask members for Seller Central passwords.

**Payment model:** Amazon sends proceeds to the seller's verified bank account. NITERUN must calculate and collect its contractual supplier/distribution share through separately authorized payments. The website does not take bank debit authorizations now.

## Remaining release gates

1. **DNS/HTTPS:** Completed November 10. All four GitHub Pages A records and the www CNAME were saved through the owner's local Chrome session; Cloudflare and Google returned the correct addresses; GitHub recognized the custom domain and HTTPS enforcement was activated. Details in [DOMAIN_ACTIVATION.md](DOMAIN_ACTIVATION.md).
2. **Member account release (separate from waitlist):** The exact Academy callback is allowlisted and custom SMTP is enabled with a verified Resend domain; test confirmation email delivery succeeded. The final verification-click → authenticated dashboard QA has not passed. Leave `ACADEMY_SIGNUP_READY=false` while the waitlist is public; finish this gate before allowing seller account registrations. See [auth release gate](docs/ACADEMY_AUTH_REDIRECT_RELEASE_GATE.md).
3. **Commercial compliance:** Legal review of consignment rights, seller agreements, payment mandates, privacy notice, and accurate marketing before real inventory allocations.
4. **Amazon integration:** Developer/app registration and seller OAuth approvals; no SP-API bypass for Individual plans.
5. **Commercial verification:** Demonstrate one signed, funded, legally eligible consignment, fulfilled order, actual Amazon settlement, and authorized NITERUN collection.

The former homepage is preserved at [archive/academy-original-20261110.html](archive/academy-original-20261110.html).

---

## Earlier November 8 Learning Studio release notes



**Public website:** https://chaybuilds.github.io/niteacademy-site/
**Interactive Academy Studio:** https://chaybuilds.github.io/niteacademy-site/studio/
**NitePay sandbox demonstration:** https://chaybuilds.github.io/niteacademy-site/nitepay/
**Free NITERUN Discord:** https://discord.gg/Dm6Hbq68Wt

NiteAcademy is the free practical-education experience of NITE Run Delivery LLC, with a separately scoped, optional business implementation proposal. Joining free courses and the community never requires buying an implementation service or mastermind subscription.

## November 8, 2026 — Studio release

This repository now includes a genuinely interactive learning workspace:

- Six original learning tracks and 18 exercises
- Personalized goal- and time-based learning routes
- A practice workbench with explicit rubrics and honest test feedback
- On-device progress tracking, XP and portable portfolio export
- Free rule-based structured coach
- An optional open-source browser-local AI model runtime (WebLLM) gated by device WebGPU capability and explicit model download consent
- An external multi-model comparison Arena with human-controlled copy/open/paste flow for ChatGPT, Claude, Gemini, Mistral and Qwen

The Studio does not claim external paid model APIs are connected. It does not generate income, charge members, confirm clients, publish fake reviews, issue accredited certifications or verify paid work. See studio/README.md for implementation, privacy, QA and release gates.

## Existing application workflow — preserved

The implementation inquiry form on the homepage still POSTs to the existing private NITERUN Supabase Edge Function academy-apply. Original anti-spam honeypot, field validation and consent requirements were retained. This is an application for review, not a contract, checkout, booking or verified sale.

Original site QA on November 8, 2026 included HTTP 200 and API status tests with a synthetic inquiry subsequently deleted. No verified Academy purchase or client profit has been established.

## Automation and testing

- The GitHub Actions academy-health.yml workflow continues to check the public landing site and operational endpoints.
- New studio-quality.yml workflow checks curriculum, application preservation and JavaScript syntax on changes.
- Local Puppeteer browser QA tests planning, rubric completion, persistence, model comparisons and desktop/mobile responsiveness. The Studio adds no runtime framework or mandatory paid inference dependency.

## Domain cutover

The owner purchased **niteacademy.com** from Namecheap; the domain is registered but **not yet pointed to GitHub Pages**. Namecheap's parking records remain. See DOMAIN_ACTIVATION.md for the exact DNS changes. Do not add a GitHub Pages CNAME again until Namecheap authoritative DNS has been changed and verified. The existing GitHub Pages URL must remain reachable during cutover.

## Operating principles

Learn → Practice → Evaluate → Document → Improve. Identify observed evidence, distinguish uncertain predictions and verified actions, and don't present simulated results as revenue. Respect user privacy, content rights, platform terms, customer consent and sound unit economics.


## Secure model gateway foundation (locked, no paid inference)

A dedicated NiteAcademy hosted-model gateway is now deployed on the
existing NITERUN Supabase project, with OpenAI, Anthropic, and Gemini
adapters. It is disabled by default and will not silently use existing
business-wide provider keys. Student authentication, dedicated provider
secrets, explicit approval and hard cost controls are required before
paid generation can be enabled. The live Studio has a free status check.
See supabase/ACADEMY_AI_GATEWAY.md.

## November 10, 2026 — Amazon FBA + supplier consignment research desk

The Academy now contains a standalone **research-only** [FBA intelligence workbench](https://niteacademy.com/fba/), linked from the homepage and seller dashboard.

- Three distinct models: evidence-gated wholesale FBA unit economics; illustrative supplier-funded consignment splits based on the existing Academy ledger; and independently negotiated first-order supplier introduction fees.
- A zero-call, zero-token planner for up to 25 US ASINs to investigate using future authorized Keepa and Amazon SP-API read-only connections.
- Member-owned private draft storage in `public.nite_academy_fba_research` with verified RLS; only signed-in account owners can save, load and delete their own inputs. The original signup pause remains in place.
- A separate staff-only archive `public.nite_academy_supplier_research`, seeded with **43 public research prospects** from CapCore/NOVA (34 unsent drafts, 4 further research, 5 channel-excluded), **zero verified suppliers, zero contacts released**.
- No new paid APIs, purchases, Amazon listings, outbound messages, supplier contracts or payment operations.

See [shared architecture and operational handoff](docs/FBA_CONSIGNMENT_NETWORK_INTEGRATION_2026-11-10.md) and repository [agent instructions](AGENTS.md). Baseline plus feature tests: `node --test tests/*.test.mjs`.
