# NITE Academy — open-source layout foundations

This layout studio exposes three working, responsive prototype views at `/layouts/?theme=commerce`, `/layouts/?theme=merchant` and `/layouts/?theme=studio`. Each includes a storefront / category exploration screen, seller dashboard, and Academy learning screen. The implementation uses original, self-contained semantic HTML/CSS/JavaScript adapted to the interaction and composition patterns of the following permissively licensed open-source projects.

## Sources and rights

| Direction | Upstream layout reference | License | What we adapt |
| --- | --- | --- | --- |
| Commerce | [bbulakh/tailwind-ecommerce](https://github.com/bbulakh/tailwind-ecommerce) | MIT | Product discovery grid, browse/filter/search affordances, collection/product detail model |
| Merchant | [tabler/tabler](https://github.com/tabler/tabler) | MIT | Sidebar navigation, administrative hierarchy, status and metric cards, tables |
| Studio | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) and [public shadcn/ui blocks](https://ui.shadcn.com/blocks) | MIT | Composable app shell, dashboard layout, cards and assistant sections |

These are **adaptations of open-source layout patterns**, not exact forks or production installations of the upstream frameworks. No external code libraries, images, fonts, or scripts from the references are shipped in the previews; all preview markup, icons and styles are newly authored for NITE Academy. The code is editable directly in `layouts/index.html`, `layouts/layouts.css`, `layouts/layouts.js`. Upstream license and attribution apply if components are later copied verbatim; vendor the upstream license beside any copied files.

**Do not copy Shopify Dawn into this independent static website.** `Shopify/dawn` is source-available under a restriction that permits only themes integrating or interoperating with Shopify software or services. This platform is not configured as a Shopify store. The word “Shopify-style” in UI notes describes the familiar commerce experience, not a claim of partnership.

## Design and implementation

- The user-facing chooser stores a direction in this browser's `localStorage` only; it makes no production publish, backend write, Amazon connection or payment.
- Preview filters, cards, modal details, mobile viewport and navigation work locally with **concept-only** category records. They contain no real supplier names, approved inventory, product quantities or promised earnings.
- Each direction deliberately reuses the same information architecture: Explore, My business, Academy; product/supplier rights and verification are separate from aesthetic choices.
- No auth secrets or Supabase service role key appear in preview files. The real seller signup and ledger remain on the existing production homepage/dashboard, untouched.
- After the owner selects a direction, extract the selected components into the actual authenticated dashboard and public marketing site; reuse existing Supabase RLS, Amazon integration gates and settlement reporting rather than copying fake preview content into production.
- Preview URL is `https://niteacademy.com/layouts/` after GitHub Pages deploy. It is marked `noindex,nofollow` while we choose a direction.
- Preserve `ACADEMY_SIGNUP_READY=false` until the separate email confirmation and dashboard QA passes; this design work does not authorize opening registration.

## Suggested product hierarchy after choosing a theme

1. **Discover:** product category tiles and supplier-authorized consignment catalog, only listings with verified availability and legal rights.
2. **Store setup:** connect/verify own seller account; Starter guided workflow or eligible Professional authorized API, not shared passwords.
3. **My business:** allocations, shipments, verified orders, seller net proceeds, statements, receivables, remittances.
4. **Academy:** role-based lessons and optional live guidance at each step.
5. **NIKO:** workflow support with approvals, audit logs and transparency on what is automated versus manual.

## Primary decision

The recommended combined direction is **Commerce storefront + Merchant internal dashboard**; use Studio's black-and-white NITERUN identity as an optional visual layer if preferred. The public product should feel like a store, while the private app should feel like an operational merchant console.

No e-commerce inventory or payment checkout is activated by these demo layouts.
