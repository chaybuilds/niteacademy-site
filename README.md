# NITE Academy — Consignment Seller Network (November 10, 2026)

**Live website:** https://niteacademy.com/ — confirmed HTTPS 200 and HTTP→HTTPS on November 10, 2026.  
**WWW:** https://www.niteacademy.com/ — verified HTTPS 301 to the apex domain.  
**Learning studio:** https://niteacademy.com/studio/ (original GitHub Pages URL redirects).

The new homepage is intentionally minimal: **Make money. → free account → private seller dashboard.**

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
- Supabase project's database is connected through the app and reported ACTIVE_HEALTHY. Chrome's current Supabase session does not have access to that particular project, so production Auth redirect allowlist cannot be edited via that browser login yet.
- Real account signup/confirmation still needs an approved controlled test and cleanup; no production paid operations, seller authorization or inventory contracts were activated.

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
- End-to-end member email confirmation testing and review of canonical auth callback URL allowlist.

**Amazon plans:** Individual is $0/month with a $0.99/item fee plus applicable Amazon and FBA fees, but does not offer SP-API access. Professional is $39.99/month plus applicable fees and supports SP-API. Full automated seller connections require a reviewed public SP-API app and seller-specific OAuth authorization. Do not ask members for Seller Central passwords.

**Payment model:** Amazon sends proceeds to the seller's verified bank account. NITERUN must calculate and collect its contractual supplier/distribution share through separately authorized payments. The website does not take bank debit authorizations now.

## Remaining release gates

1. **DNS/HTTPS:** Completed November 10. All four GitHub Pages A records and the www CNAME were saved through the owner's local Chrome session; Cloudflare and Google returned the correct addresses; GitHub recognized the custom domain and HTTPS enforcement was activated. Details in [DOMAIN_ACTIVATION.md](DOMAIN_ACTIVATION.md).
2. **Supabase Auth redirect URLs:** In Supabase Dashboard → Authentication → URL Configuration, retain the existing preview callback https://chaybuilds.github.io/niteacademy-site/ and add https://niteacademy.com/ before changing the signup email redirect to the canonical domain. Confirm real signup → email confirmation → sign-in on iPhone.
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
