# NiteAcademy hosted-model gateway (dormant by default)

Production Supabase Edge Function: academy-model-gateway
Project: succvbtctjkzsowotcsy
Health URL: https://succvbtctjkzsowotcsy.supabase.co/functions/v1/academy-model-gateway

## Verified on November 8, 2026

- GET returns HTTP 200 and correctly advertises a locked gateway.
- POST without an approved session/configuration returns HTTP 503 before any paid provider request.
- The quota table, public.academy_ai_quota_daily, has RLS enabled.
- Anonymous and authenticated database roles cannot SELECT that table or execute public.academy_ai_reserve.
- service_role alone can reserve a quota. Atomic two-request daily quota was verified in a rollback-only SQL transaction. Zero test usage remains.
- Supabase security linter only reported an INFO rls_enabled_no_policy notice for this new table; intentional deny-by-default because no browser role should read the quotas.
- Provider adapters for OpenAI Responses, Anthropic Messages and Gemini generateContent are present but have NOT been tested with provider-issued API keys or paid tokens.

## Safety controls

Paid generation is denied unless ALL apply:

1. Supabase secret NITEACADEMY_HOSTED_AI_ENABLED is exactly true.
2. A valid Supabase Auth user JWT is verified live against /auth/v1/user.
3. That user ID appears in NITEACADEMY_ALLOWED_USER_IDS, a comma-separated allowlist of approved UUIDs.
4. Per-user daily request cap NITEACADEMY_USER_DAILY_REQUEST_CAP is an integer 1 or 2.
5. Global daily request cap NITEACADEMY_GLOBAL_DAILY_REQUEST_CAP is an integer 1 through 20.
6. The selected provider has a dedicated NITEACADEMY_{OPENAI,ANTHROPIC,GEMINI}_API_KEY and NITEACADEMY_{PROVIDER}_MODEL set in Supabase managed secrets.
7. The prompt is a 12–3000 character instructional request from an approved origin; response max 256 tokens; no arbitrary URLs, browsing or tool calls are available.

The two daily limits are reserved atomically by the database before attempting a provider request. Provider failures still count against allowance (conservative). Quotas count requests, NOT exact vendor dollars. The gateway does NOT verify billing-account hard dollar caps, and it must NOT be activated until the owner also configures hard spending caps / appropriate billing alerts in each provider's own account.

Important: the gateway NEVER falls back to any existing business-wide OPENAI_API_KEY or similar NITERUN secrets. Use dedicated scoped accounts/keys to prevent charging another business workflow.

## Activation checklist (NOT YET AUTHORIZED OR PERFORMED)

- Create an appropriate provider API account, accept current terms and establish a small billing budget.
- Confirm model IDs against the provider's actual current API models and cost information. Do not infer model access from marketing product names.
- Add dedicated provider credentials, model IDs, approved learner UUIDs, and daily caps in Supabase's official Edge Function Secrets UI (never in GitHub, chat, a public web page or browser localStorage).
- Validate Supabase Auth sign-in, access policy, and private per-member quota behavior. The public Studio currently requires no user account and does not have an authenticated cloud AI UI.
- Test with a deliberately low-cost, approved provider call under budget, capture billing evidence, then activate the provider for authorized beta users only.
- Check error handling, privacy policy, data retention and user consent before adding public access.
- Continue monitoring actual spend and disable NITEACADEMY_HOSTED_AI_ENABLED immediately if limits are not respected.

## Current student-facing mode

The Studio continues to offer free curriculum, a rules-based coach, optional WebLLM inference on capable user hardware, and manual comparisons through independently opened model websites. The new read-only "Check live gateway" button GETs the endpoint without generating paid text or using a model key.

Run locally for a non-billing health check:

    node scripts/academy-gateway-smoke.mjs

Function source: supabase/functions/academy-model-gateway/index.ts
Database DDL reference (already applied): supabase/sql/academy_ai_daily_quota.sql
