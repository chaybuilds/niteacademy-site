# NITE Academy waitlist — launch operations

**Production:** https://niteacademy.com/
**Admin database:** Supabase project `succvbtctjkzsowotcsy` (Outreach Labs)
**Public intake:** `public.join_nite_academy_waitlist(p_email,p_source,p_consent,p_company)`
**Stored records:** `public.nite_academy_waitlist`
**Runbook status:** live, initial November 10, 2026

## What is live

- The homepage shows a one-field, mobile-first Amazon seller program waitlist with an affirmative consent checkbox.
- Users may visit `?source=tiktok`, `?source=youtube`, `?source=instagram`, or plain `niteacademy.com` to attribute where a signup came from.
- A normalized email can join only once. Repeating the same email returns a generic success and does not disclose whether it is already stored.
- The waitlist is **not** member registration or Amazon Seller Central authorization. No one is asked for passwords, ID, money or bank details.
- Supabase table has RLS enabled. Anon and authenticated roles have no table SELECT/INSERT/UPDATE/DELETE privileges. The only public action is a validated, consent-required, idempotent insert function. Honeypot-filled submissions are ignored.
- This is prelaunch; do not claim paid orders, partner inventory, seller approval, automatic FBA account connection or earnings.

## Admin metrics (execute only from an authorized Supabase SQL editor)

```sql
select count(*)::int as total_waitlist from public.nite_academy_waitlist
where status='waiting';

select source, count(*)::int as signups
from public.nite_academy_waitlist
where status='waiting'
group by source order by signups desc;

select date_trunc('day',joined_at)::date as joined_date, count(*)::int as signups
from public.nite_academy_waitlist
group by 1 order by 1 desc limit 30;
```

Before sending follow-up emails, check `status='waiting'`, `consent_at` and provider suppression lists; honor requests not to contact. Do not export waitlist email addresses into public logs or analytics dashboards. Recipients should receive program-related updates only and an easy unsubscribe route.

## Privacy and support

Collect only email, the user-declared outreach channel and consent time for the waitlist. No passwords, Amazon account identifiers or sensitive personal data. Privacy details and opt-out instructions are linked from the form and at `/privacy/`. User requests to withdraw consent can be processed by an authorized operator:

```sql
update public.nite_academy_waitlist
set status='unsubscribed'
where email=lower(btrim('user@example.com'));
```

Retain an unsubscribe suppression record or securely delete data after honoring requests based on the applicable retention policy. Final retention terms and marketing-email procedures require review before broad outreach.

## Remaining backend work

1. Add anti-abuse rate limiting or a challenge at the API edge before high-volume traffic; the present honeypot, validation and email uniqueness do not prevent distributed spam.
2. Build an authorized invitation workflow with suppression, rate limits, delivery logging and consent-safe unsubscribe.
3. Complete email confirmation and private-dashboard QA before opening account registration. The existing app lives at `/member/` and keeps `ACADEMY_SIGNUP_READY=false`.
4. When approved, implement Amazon SP-API OAuth and sandbox testing for eligible Professional sellers, without collecting Amazon credentials.
5. Verify supplier consignment rights, fulfillment, fee disclosures, reconciliation and settlements before offering real inventory.

## Release verification

- Public REST RPC returned HTTP 200 and `true` for a single test address.
- Repeating that address returned the same generic success.
- A request with the honeypot field filled returned success but did **not** store an email.
- Anonymous attempt to SELECT from the underlying waitlist table returned HTTP 401.
- Admin validation found the test record and the test email was removed before public release.
- The legacy member UI and all existing app tests remain preserved. The publicly shared link is the new root waitlist.
