# Environment Variables

Do not commit real values. `NEXT_PUBLIC_` variables can be visible in the browser. Service role keys, API tokens, OAuth secrets, refresh tokens, and sync secrets must remain server-only.

## Supabase

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. | Supabase browser client, server client, middleware, admin client. | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for public/session-aware client access. | Supabase browser client, server client, middleware. | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server-side privileged operations. | Supabase admin client, API routes that write private storage or cross-table metadata. | Server-only |

## Zoho CRM

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `ZOHO_CLIENT_ID` | Zoho OAuth client ID. | Zoho CRM integration token refresh. | Server-only |
| `ZOHO_CLIENT_SECRET` | Zoho OAuth client secret. | Zoho CRM integration token refresh. | Server-only |
| `ZOHO_REFRESH_TOKEN` | Refresh token used to obtain Zoho CRM access tokens. | Zoho CRM integration token refresh. | Server-only |
| `ZOHO_ACCOUNTS_URL` | Zoho accounts/token endpoint base URL for the account data center. | Zoho CRM integration token refresh. | Server-only |
| `ZOHO_API_DOMAIN` | Zoho CRM API domain for the account data center. | Zoho CRM lead create/update calls. | Server-only |

## Zoho Books

Zoho Books is the invoicing and billing system. It shares the same Zoho account as Zoho CRM and uses the same OAuth infrastructure. If CRM and Books are on the same Zoho organisation, `ZOHO_CLIENT_ID` and `ZOHO_ACCOUNTS_URL` may be reused; separate credentials are listed here in case the accounts differ.

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `ZOHO_BOOKS_CLIENT_ID` | Zoho Books OAuth client ID. | Zoho Books integration token refresh. | Server-only |
| `ZOHO_BOOKS_CLIENT_SECRET` | Zoho Books OAuth client secret. | Zoho Books integration token refresh. | Server-only |
| `ZOHO_BOOKS_REFRESH_TOKEN` | Refresh token for Zoho Books API access. | Zoho Books integration token refresh. | Server-only |
| `ZOHO_BOOKS_ORGANISATION_ID` | Zoho Books organisation ID — required in all API request headers. | All Zoho Books API calls. | Server-only |
| `ZOHO_BOOKS_API_DOMAIN` | Zoho Books API domain for the account data center (e.g. `https://www.zohoapis.com`). | Zoho Books API calls. | Server-only |

Invoice status syncs from Zoho Books into `client_requests` in Supabase for client-facing display in the portal. Never expose Zoho Books credentials in client components or `NEXT_PUBLIC_` variables.

## Resend

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Resend API key for email delivery. | Email integration. | Server-only |
| `RESEND_FROM_EMAIL` | Verified Resend sender address, for example `Younity Consultancy <hello@younityanu.com>`. Must use a verified Resend domain in production. | Email integration. | Server-only |
| `LEAD_NOTIFICATION_EMAIL` | Internal recipient for lead, request, and document notifications. | Email integration. | Server-only |

`onboarding@resend.dev` is for Resend testing only and must not be used in production. Verify the sending domain in Resend before sending client emails to real recipients. Resend is currently paused pending domain verification — do not make blocking workflows depend on it until verified.

## Twilio WhatsApp

Twilio is used for two-way WhatsApp messaging: outbound notifications to clients (request updates, document requests, invoice ready) and inbound messages from clients back to the Younity team. A Twilio Business WhatsApp number is required — the sandbox is not suitable for production client messaging.

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier. | WhatsApp integration. | Server-only |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. | WhatsApp integration. | Server-only |
| `TWILIO_WHATSAPP_FROM` | Twilio Business WhatsApp sender number. | WhatsApp integration. | Server-only |
| `WHATSAPP_INTERNAL_TO` | Internal Younity WhatsApp number — receives inbound client replies forwarded by the webhook. | WhatsApp integration. | Server-only |

## Internal Sync

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `INTERNAL_SYNC_SECRET` | Secret shared by internal sync runner endpoints and sync APIs. | Internal sync routes. | Server-only |
| `INTERNAL_ADMIN_EMAILS` | Comma-separated allowlist for `/internal` protected routes. | Internal admin pages and runner routes. | Server-only |

## Rate Limiting

Production rate limiting is backed by the Supabase table `public.rate_limits` and the `public.increment_rate_limit` SQL function. Run `supabase/rate_limits.sql` manually in the Supabase SQL Editor before relying on production rate limiting.

No additional rate-limiting environment variables are required. The rate limit utility uses the existing server-only `SUPABASE_SERVICE_ROLE_KEY` through the Supabase admin client. If Supabase rate-limit storage is temporarily unavailable, rate limiting fails open with a sanitized server log so core workflows do not hard-crash.

## Site/Vercel

| Variable | Purpose | Used By | Visibility |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production site URL used for server-side internal sync runner fetches. | Internal sync runner routes. | Public |
