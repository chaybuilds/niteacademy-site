# Night Academy — public acquisition

**Live:** https://chaybuilds.github.io/niteacademy-site/  
**Discord:** https://discord.gg/Dm6Hbq68Wt  
**Official Discord Academy area:** https://discord.com/channels/1568427976687878275/1569004814556332087

Night Academy is a proposed free-education and fixed-scope business-infrastructure implementation division of NITE Run Delivery LLC. Education is free; implementation is optional. No guaranteed customers, revenue, or paid work.

## Deployed integration
- Fast static landing page on GitHub Pages. Application POST goes to the existing NITERUN Supabase Edge Function named academy-apply.
- Applicant records are private. Row-level security is enabled; no public table select/insert grants.
- Requests are not sales, contracts, or cash receipts. No checkout is enabled.
- Source attribution uses the URL utm_source parameter.
- Simple anti-spam honeypot, validation and per-email 24-hour deduplication are present, but managed bot protection is still required before heavy promotion.

## Verified QA on November 8, 2026
- Site HTTP 200; API GET 200, invalid POST 422, synthetic test POST 201.
- Duplicate test submission suppressed; synthetic row then deleted.
- Six official Discord channels, four intro guides, three original lessons, one technical QA receipt and linking messages published.
- Mac-hosted bot and local AI are not guaranteed to operate 24/7.

## Persistent checks
GitHub Actions workflow academy-health.yml checks website, Discord invite, endpoint status and validation daily, opening a deduplicated incident on failure. This is monitoring, not self-modifying AGI. Improvements require verified evidence and human review.

## Remaining release gates
- Independently review client scope, terms, privacy and FTC business-opportunity applicability before selling.
- Add stronger bot protection, authenticated staff lead-review UI and verified founder/AJ access.
- Verify native Discord onboarding with a non-admin test member.
- A paying customer, client profits, workforce payouts and guaranteed buyer leads are **not** yet verified.
