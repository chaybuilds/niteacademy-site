# NiteAcademy Studio

Path: /studio/ on chaybuilds/niteacademy-site GitHub Pages.

This is an original interactive learning app, not a replacement for the existing business application form. The home page still submits implementation inquiries through its original Supabase academy-apply Edge Function. Studio doesn't charge anyone.

## Functional release

- Six original course tracks, three lessons each: 18 practice exercises.
- Goal, experience and weekly time generate a three-track priority plan.
- Each lesson includes a synthetic scenario, task, starter outline, and four transparent rubric checks.
- Rubric scores require 20 words and at least three of four specified concepts. This is practice feedback, not expert grading or professional certification.
- Completed practices, drafts, learner preferences and XP persist in browser localStorage; no cloud account is required.
- Download personal practice portfolio as Markdown and your progress as JSON.
- Always-available free structured practice coach (rules-based; explicitly not a generative model).
- Optional real open-source local model via WebLLM version 0.2.87, loaded only after a user opts in and a WebGPU capability check. Device/GPU availability and memory requirements vary; this feature has not been verified on every hardware platform and is not activated by default.
- AI Model Arena: manually copy a fictional exercise prompt to OpenAI ChatGPT, Anthropic Claude, Google Gemini, Mistral Vibe, or Qwen Chat. Paste their outputs back for transparent keyword-rubric coverage comparison. The page does not call or retrieve results from those provider APIs.
- Free Discord learning community links and optional separately scoped business implementation inquiry.

## Honest model integration status

Structured rule-based coach: tested, always available without an API key.
Browser-local WebLLM: optional, on-demand, subject to compatible WebGPU hardware, model download, and runtime success.
External model Arena: copy/open/paste/evaluate workflow tested; third-party logins and model outputs are never linked to Academy.
Paid OpenAI, Anthropic, Google, Mistral and hosted open-model API endpoints: NOT CONNECTED. A secure server gateway, provider-issued secrets, real student authentication, abuse protections, rate limits, hard spending limits and human-reviewed policies are required before activation.

Do not put provider keys in GitHub Pages, browser JavaScript, URL parameters or localStorage. ChatGPT subscriptions are not public website API credentials.

## Data and privacy

Studio stores practice records only in the learner's current browser. Clearing storage/private browsing can erase them. Model comparisons save metadata (provider label, lesson, automated rubric score, word count and timestamp), NOT raw model answer content. No external model is called until the user explicitly leaves the page or starts local inference. Local model weights may download from external model hosting CDNs when requested; learners should avoid entering private customer information in any external AI tool.

The original homepage Academy application form still POSTs to the connected Supabase academy-apply function; it is a review request, not an order, booking or earned-income promise.

## Local quality testing

Run from repository root:
  node --test tests/studio.test.mjs
  node --check studio/content.mjs
  node --check studio/app.mjs
  node --check studio/arena.mjs

Browser QA prerequisites: start a local HTTP server at port 8767, install or point to Puppeteer on the testing machine and set NITEACADEMY_CHROME to the installed Chrome executable if needed. Then:
  node tests/browser-qa.cjs

The browser tests cover learning plans, rubric evaluation, persisted progress, manual model comparison, mobile viewport fit, preserved application form, and uncaught JavaScript errors. Test-generated screenshots are ignored from version control.

## Domain and go-live

NiteAcademy.com has been purchased and is active in Namecheap, but DNS is still parked. Do not re-enable GitHub Pages custom-domain redirects until the apex A records and www CNAME are verified; see DOMAIN_ACTIVATION.md.

The existing working public address is https://chaybuilds.github.io/niteacademy-site/ with Studio at /studio/ and NitePay demo at /nitepay/.

## Next stages

1. Review lesson quality with real practitioners and measure observed learning outcomes.
2. Offer optional authenticated cross-device progress and properly scoped tenant authorization.
3. Add a bounded, authenticated multi-provider AI gateway only when keys, permissions and monthly budget caps are ready.
4. Connect only genuinely verified, written buyer-funded opportunities to any earnings network.
5. Do not issue accredited certifications or advertise success stories without evidence.
