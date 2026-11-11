# NITE Academy — email confirmation release gate (November 10, 2026)

## Latest attempt — November 10, 2026: branded Resend domain provisioned, verification pending

The owner's signed-in Resend browser session uses the **niterun** team at `chayson@niterun.com`. That team contains `notify.niterun.com` (Not Started) and did **not** contain the verified `labmail.niterun.com` found through the separately connected Resend app. The team switcher showed no other available team, so do not assume these are the same Resend workspace or take credentials from one into the other.

With the authorized Mac Chrome + Namecheap session, created **`auth.niteacademy.com`** in the Resend browser workspace. Added exactly these sending-related DNS records to the existing Namecheap-managed **niteacademy.com** zone:

- TXT `resend._domainkey.auth` — the exact 218-character DKIM public key provided by Resend
- CNAME `rsend.auth` → `rsend.forge.rmta.net`
- CNAME `send.auth` → `send.forge.rmta.net`

The Namecheap UI confirmed all three records were saved; public DNS resolved the correct TXT and both CNAMEs. GitHub Pages' four apex A records and the www CNAME were preserved. No root SPF/email-forwarding record was changed. The optional Resend root DMARC and inbound MX records were not added (outbound mail only).

Resend verification was started via **I've already added the records**. Last read: domain status **Pending**; `send.auth` CNAME Verified, DKIM TXT Pending, `rsend.auth` CNAME Pending. Allow for DNS propagation and recheck; do not claim email is deliverable until Resend marks the domain Verified.

A **new send-only API key** was prepared in Resend's browser UI, but the creation click was blocked by a tool safety check. No browser-team credential was created or copied. The previously created, unused key in the separate Resend connector account is labeled UNUSED; leave it alone unless the user explicitly authorizes revocation. No secret has been put in the Academy frontend or source repository. Supabase custom SMTP is still **disabled** and `ACADEMY_SIGNUP_READY=false`.

**Remaining steps once Resend verifies:** Create a send-only key restricted to `auth.niteacademy.com` in the logged-in Resend workspace; transfer it through the owner's authorized browser directly into Supabase → Authentication → Emails → SMTP Settings without printing it into chat or code; host `smtp.resend.com`, port `465`, username `resend`, from `no-reply@auth.niteacademy.com`. Confirm the shared project's email sender name is acceptable to every app using Outreach Labs. Save, verify SMTP enabled and email rate limits, perform one controlled signup/confirmation/dashboard test, delete its disposable user, then change the Academy flag to true if successful. If credential creation remains blocked by automation safeguards, the owner must complete that secure browser UI action.

**Production state:** Website and redirect work; registrations paused; no completed SMTP enablement or successful end-to-end signup claim.

## Update — November 10, 2026: correct redirect configured, SMTP quota remains

Using the owner's authorized **incognito Chrome** window, the Supabase **Outreach Labs** Authentication → URL Configuration page was opened and edited. Supabase confirmed **"Successfully added 1 URL"**. The persisted allowlist is now:
- `https://ventureq-nebius.vercel.app/**` (preserved)
- `https://niteacademy.com/` (added exactly)

The project's default `Site URL` remains `https://ventureq-nebius.vercel.app` to avoid disrupting other apps; the Academy frontend explicitly specifies its own `emailRedirectTo: "https://niteacademy.com/"`.

**Additional finding:** Supabase Authentication → Rate Limits shows `RATE_LIMIT_EMAIL_SENT = 2` emails/hour, and Authentication → Emails → SMTP Settings confirms **custom SMTP is disabled**. A new disposable QA signup initiated from an Academy incognito tab was rejected with **`email rate limit exceeded`**. The test did not create a database user or send an email, and no password was shared; registration remains deliberately gated.

Read-only exploration found an already-verified Resend sender domain `labmail.niterun.com`, but connecting custom SMTP would change Auth email delivery for **every application on the shared Outreach Labs project**, so no SMTP provider, credentials, email template, sender identity, billing, or rate-limit setting was changed without reviewing that project-wide impact. The Supabase dashboard also shows an **outstanding invoices** service-disruption banner, which requires account-owner attention.

To complete release:
1. Configure a suitable verified custom SMTP service for the shared Auth project, or isolate Academy Auth in a dedicated project without affecting existing apps. Review sender domains, costs, domain ownership, and other applications first.
2. Use a controlled disposable signup to verify the confirmation email's final `redirect_to=https://niteacademy.com/` and dashboard/ledger access. The limit resets on Supabase's schedule; do not bypass abuse controls.
3. Only after passing full QA, set `ACADEMY_SIGNUP_READY=true` and deploy.

## Original discovery
A controlled account signup on `https://niteacademy.com/` reached Supabase Auth and a confirmation email was delivered. However, the confirmation link generated by the project's Auth configuration used a fallback redirect to `https://ventureq-nebius.vercel.app`, which is **not** the Academy site. The link was **not clicked**, so no test session or confirmation token was delivered to that destination. The single unconfirmed QA account was deleted after the check; the database returned zero remaining QA accounts.

## Temporary safety mitigation
The Academy website now sets `ACADEMY_SIGNUP_READY=false` in `assets/academy.mjs` and openly displays that new registration is paused. Password sign-in for existing members is not blocked. The intended `emailRedirectTo` now points to `https://niteacademy.com/`, but the server still must allowlist that exact URL. Do not bypass this gate by collecting passwords or resending confirmation links pointing elsewhere.

## Required project setting
Project: **Outreach Labs**, ref `succvbtctjkzsowotcsy`.

A project owner/admin must open:
`https://supabase.com/dashboard/project/succvbtctjkzsowotcsy/auth/url-configuration`

- Set **Site URL** to `https://niteacademy.com/` after reviewing other apps that share this Supabase project. **Changing Site URL can affect their login flows**, so identify other production clients before applying the change. If other apps require the current Site URL, instead preserve their configuration and add an exact Academy redirect URL to the **Redirect URLs allowlist**; the Academy client explicitly supplies it.
- Add exact redirect allowlist entry `https://niteacademy.com/`. Optionally retain `https://chaybuilds.github.io/niteacademy-site/` for older emails, only if needed.
- Avoid wildcard allowlisting third-party domains. Do not remove any redirect entries needed by existing applications.
- Save changes with the correct project account. The Mac Chrome's currently accessible login was redirected to organizations with **You do not have access to this project**; the Supabase connector can access the database but has no Auth URL configuration write operation.

## Release QA
1. Verify Auth redirect allowlist and canonical email callback by creating a disposable new account from Academy; never share a test password or verification token in public logs.
2. Confirm the emailed link points to the expected Supabase verify URL **and** has `redirect_to=https://niteacademy.com/`, not unrelated domains.
3. Click the controlled verification email, observe the final Academy origin, check the authenticated private dashboard is visible and its seller code is assigned.
4. Test logout → login and Starter/Professional route selection. Verify the database allows only the member to access its profile and prohibits forging seller verification or ledger data.
5. Delete the disposable account through an approved administrative operation; confirm zero leaked QA profiles and no test payment entries.
6. Only after a pass: change `ACADEMY_SIGNUP_READY=false` to `true`, commit, run GitHub CI, and verify deployed signup UX on desktop/mobile.

Domain DNS and HTTPS are already live. Amazon OAuth, inventory contracts and Stripe collection remain separate commercial gates.
