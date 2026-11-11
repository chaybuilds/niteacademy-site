# NITE Academy — Commerce-first design decision guide

**Status, November 10, 2026:** Three interactive, independent preview layouts implemented under `/layouts/`. The original homepage, Academy login, RLS-backed seller profile, allocations, reporting, settlements, Studio and FBA research desk remain unchanged.

## What NITE Academy should become

**Public discovery should feel like a premium storefront. Private operations should feel like Shopify Admin.**

In a legitimate merchant network, the person doing the selling needs a simple buying-like product discovery journey without pretending items are already for sale. NITE Academy instead offers a path to own and operate a seller account, learn practical skills, apply for authorized consignment supply, fulfill verified orders, and reconcile actual financial events.

The platform should feel like one system:

**Discover → Learn → Verify Seller → Apply to Source → Allocate → Ship/Sell → Reconcile → Settle → Learn.**

The public-facing home and category catalog should use commerce patterns: featured categories, filters, search, detail pages, product fit and requirements, trust and transparent eligibility. Inventory “in stock,” product cost, pricing or estimated earnings only appear when proven by supplier authorization and live records. The Academy membership itself is free; Individual or Professional Amazon plan fees belong to Amazon.

The member dashboard should use merchant operations patterns: clear left navigation, “today’s action,” draft/approved listings, inventory states, shipment status, verified orders, real settlement statements, payment obligations and payout reconciliation. NIKO is a clearly delineated assistant with guided and authorized automation states, approvals and logs—not a simulation of live Amazon access.

The Academy learning experience should attach to the workflow: short, contextual lessons at the moments members need them, rather than a separate generic course catalog.

## Three preview directions

| Concept | Strongest feature | Weakness to address | Best use |
| --- | --- | --- | --- |
| Commerce | Familiar shopping catalog, prominent product discovery, high first-visit clarity | Needs more detailed merchant tooling behind login | Public website and opportunity catalog |
| Merchant | Efficient operations, strong inventory, review and settlement workflow | Too functional as a new-member marketing homepage | Authenticated seller and operator dashboards |
| Studio | Strong NITERUN identity and narrative, distinctive dark NIKO experience | Dark storefront may feel less like conventional shopping | Premium branded layer across select screens |

**Recommended combination:** Commerce public catalog + Merchant private operations, with restrained Studio typography/black-white accents. This is a recommendation to evaluate, not a deployed change of the production homepage.

## What the next implementation phase must preserve

- Current domain `https://niteacademy.com/`, Supabase identity and existing protected RLS tables.
- Signup flag `ACADEMY_SIGNUP_READY=false` until email confirmation + real dashboard pass and test user cleanup.
- Current FBA research, real seller plan choice and merchant ID forms.
- Signed supplier agreements, Amazon permissions, product/SKU authorization and payable settlement controls as release gates.
- No real catalog listings, inventory, demand, payouts or financial figures inferred from mock category cards.

## Testable UX hypothesis

| Hypothesis | Primary measure | Verification |
| --- | --- | --- |
| Commerce-first home is understandable | % visitors reaching seller plan education | Compare actual click path in a consent-aware analytics sample |
| Merchant dashboard improves onboarding | % verified users completing seller information | Signed-in first-action-to-completion time and step abandonment |
| Academy lessons at relevant steps reduce errors | % seller reports accepted on first review | Review acceptance by lesson exposure, controlling for experience |
| NIKO actually helps | Time to verified next-step completion and human corrections | Logged intervention, verified outcome, not self-reported “AI success” |

No baseline conversion or acceptance rates are established yet; do not present example targets as results.

## Visual selection and open source

Use the layout selector `https://niteacademy.com/layouts/` after deployment and compare three routes:
- `?theme=commerce`
- `?theme=merchant`
- `?theme=studio`

Each includes storefront, seller dashboard and Academy views, mobile switch and working filters or details. Selecting a direction saves only local browser preference; it **does not publish** the selected design as the homepage. Open-source foundation attribution is recorded in [`layouts/OPEN_SOURCE_SOURCES.md`](../layouts/OPEN_SOURCE_SOURCES.md).

One styling decision should be made after reviewing the options. Then replace the existing static homepage and authenticated dashboard incrementally, with versioned backups and end-to-end tests for every live business interaction.
