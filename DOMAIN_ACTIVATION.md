# NiteAcademy.com — DNS cutover

**Status: domain registered; GitHub Pages custom-domain redirect NOT active until DNS cutover.**

The user owns **niteacademy.com** (N-I-T-E), registered at Namecheap and active through November 8, 2027. The existing site is published from `chaybuilds/niteacademy-site`, GitHub Pages source `main /`, at `https://chaybuilds.github.io/niteacademy-site/`.

The existing Namecheap DNS zone uses BasicDNS (`dns1.registrar-servers.com` / `dns2.registrar-servers.com`). Its original parking records are:

- CNAME `www` -> `parkingpage.namecheap.com.`
- URL Redirect `@` -> `http://www.niteacademy.com/`

## Required Namecheap changes

In **Domain List → niteacademy.com → Manage → Advanced DNS → HOST RECORDS**, remove or replace **only** the two parking records above, then create:

| Type | Host | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | Automatic or 30 min |
| A | `@` | `185.199.109.153` | Automatic or 30 min |
| A | `@` | `185.199.110.153` | Automatic or 30 min |
| A | `@` | `185.199.111.153` | Automatic or 30 min |
| CNAME | `www` | `chaybuilds.github.io` | Automatic or 30 min |

Do **not** change nameservers. Preserve any separate MX, TXT, SPF, DKIM, CAA or email records and mail settings. Do not use wildcard DNS records.

Confirm that the changes were saved by reloading Advanced DNS and checking the actual HOST RECORDS entries. Check authoritative DNS:

```sh
dig @dns1.registrar-servers.com niteacademy.com A +short
dig @dns1.registrar-servers.com www.niteacademy.com CNAME +short
```

The first query must return GitHub's four addresses; the second must return `chaybuilds.github.io.`.

## GitHub Pages activation only after authoritative DNS is correct

Add the repo-root `CNAME` file containing exactly:

```text
niteacademy.com
```

In GitHub repository **Settings → Pages**, confirm Custom domain `niteacademy.com`; verify DNS and then enable **Enforce HTTPS** when available. GitHub Pages should redirect `www.niteacademy.com` to the apex. Do not assume TLS is live until an HTTPS request returns the correct site with a valid certificate.

After cutover, check the homepage and NitePay subpath:

```sh
curl -IL https://niteacademy.com/
curl -IL https://www.niteacademy.com/
curl -IL https://niteacademy.com/nitepay/
```

Also test Chrome/Safari on mobile, links, assets, and forms. This GitHub Pages site is a **static public website**; domain connection does not automatically activate NitePay payment processing, transactional email, or a server backend. Those remain separate integration projects.

## Previous safety rollback

On November 8, 2026, the CNAME file was briefly added before the Namecheap DNS cutover, causing the old GitHub Pages URL to redirect to the still-parked new domain. The file was removed to restore the existing site. The old URL was verified returning HTTP 200 afterwards. **Do not re-add CNAME before DNS is correct.**

References: GitHub Pages custom-domain documentation and Namecheap GitHub Pages DNS setup. No API keys or private account data are recorded here.
