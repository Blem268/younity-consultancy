# Deployment Checklist

Use this checklist before deploying the Younity website and client portal to production.

## Environment Variables

Add all required environment variables to the hosting provider. Keep secret values out of source control.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Zoho CRM

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_ACCOUNTS_URL`
- `ZOHO_API_DOMAIN`

### ClickUp

- `CLICKUP_API_TOKEN`
- `CLICKUP_LIST_ID`

### Google Sheets

- `GOOGLE_SHEETS_WEB_APP_URL`

### Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `LEAD_NOTIFICATION_EMAIL`

### Twilio WhatsApp

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `WHATSAPP_INTERNAL_TO`

### Internal Sync

- `INTERNAL_SYNC_SECRET`
- `INTERNAL_ADMIN_EMAILS`

### Site

- `NEXT_PUBLIC_SITE_URL`

## Hosting Setup

- Add every variable above to the production hosting environment.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL, for example `https://www.example.com`.
- Confirm the build command is `npm run build`.
- Confirm the app starts with the hosting provider's standard Next.js start/runtime configuration.

## Vercel Deployment

### A. Vercel Setup Steps

- Create or import the Vercel project from GitHub.
- Set the framework preset to Next.js.
- Add all environment variables from `.env.example`.
- Set `NEXT_PUBLIC_SITE_URL` to the Vercel production URL.
- Redeploy after changing environment variables.

### B. Supabase Production Setup

- Add the production site URL in Supabase Auth settings.
- Add redirect URLs:
  - `https://yourdomain.com/client/login`
  - `https://yourdomain.com/client/dashboard`
  - `https://yourdomain.com/auth/callback` if used
- Confirm the `client-documents` bucket exists and is private.
- Confirm schema and RLS policies are applied.

### C. Zoho Production Setup

- Add the production OAuth callback URL if OAuth is used again:
  - `https://yourdomain.com/api/zoho/callback`
- Confirm `ZOHO_API_DOMAIN` matches the account data center.

### D. Resend

- Verify the production sending domain.
- Set `RESEND_FROM_EMAIL` to a sender on the verified Resend domain, for example `Younity Consultancy <hello@younityanu.com>`.
- Do not use `onboarding@resend.dev` in production. It is for Resend testing only.
- Confirm `LEAD_NOTIFICATION_EMAIL` is correct.

### E. Twilio

- Twilio Sandbox is testing-only.
- Production WhatsApp requires an approved sender and approved templates.
- Confirm `WHATSAPP_INTERNAL_TO` format.

### F. Internal Sync

- Confirm `INTERNAL_ADMIN_EMAILS` includes approved admin emails.
- Confirm `INTERNAL_SYNC_SECRET` is long and secure.
- Test `/internal/sync` after deployment.
- Test `/internal/errors` after deployment.

### G. Production Test Plan

- Submit public contact form.
- Confirm Zoho lead.
- Confirm ClickUp task.
- Confirm Google Sheet row.
- Confirm internal email.
- Confirm client confirmation email.
- Confirm WhatsApp internal alert.
- Login as client.
- Submit portal request.
- Upload portal document.
- Run internal status sync.
- Run internal billing sync.
- Confirm workflow errors can be reviewed at `/internal/errors` by an authorized admin.
- Confirm authorized admins can mark workflow errors resolved with an optional note.
- Confirm authorized admins can reopen resolved workflow errors.
- Confirm client-facing billing/invoice status reflects ClickUp billing sync data.
- Confirm public lead-intake rate limiting returns a safe 429 response after repeated submissions.
- Confirm portal request, document upload, task update, and internal sync rate limits return safe 429 responses after repeated submissions.
- Confirm the public contact form honeypot field is present and normal submissions still work.
- Run multi-client access tests for request, document, invoice, update, and task detail isolation.
- Confirm Zoho Books is not active and no `ZOHO_BOOKS_*` variables are configured.

## Supabase

- Add the production URL to Supabase Auth site URL and redirect URLs.
- Confirm the Supabase schema and RLS policies are already applied.
- Run `supabase/rate_limits.sql` manually in the Supabase SQL Editor.
- Confirm `public.rate_limits` exists with RLS enabled and no public/client policies.
- Confirm `public.increment_rate_limit` exists.
- Run `supabase/workflow_errors.sql` manually in the Supabase SQL Editor.
- Confirm `public.workflow_errors` exists with RLS enabled and no public/client policies.
- Run `supabase/workflow_errors_resolution.sql` manually in the Supabase SQL Editor.
- Confirm `public.workflow_errors` includes `resolved_by`, `resolution_note`, `reopened_at`, and `reopened_by`.
- Confirm the Supabase Storage bucket `client-documents` exists.
- Confirm `client-documents` is private.
- Confirm document uploads store private storage paths only and do not expose public file URLs or signed download links.

## Zoho CRM

- Confirm the Zoho refresh token is valid for the production Zoho account.
- Add the production callback URL to the Zoho API Console if the OAuth app requires it for future token refresh/setup work.
- Confirm `ZOHO_ACCOUNTS_URL` and `ZOHO_API_DOMAIN` match the correct Zoho data center.

## ClickUp

- Confirm `CLICKUP_API_TOKEN` belongs to an account or workspace member with access to the target list.
- Confirm `CLICKUP_LIST_ID` points to the production operations list.
- Confirm ClickUp custom fields used by billing sync still match the field names expected by the app.
- Confirm ClickUp remains the operations and billing preparation hub.
- Confirm any actual invoicing is handled manually or outside the portal for now.

## Google Sheets

- Confirm `GOOGLE_SHEETS_WEB_APP_URL` points to the production Apps Script web app.
- Confirm the Apps Script deployment accepts POST requests from the production app.

## Resend

- Verify the sending domain in Resend before sending to real client emails.
- Set `RESEND_FROM_EMAIL` to a sender address on the verified domain before sending to real client emails.
- Confirm `onboarding@resend.dev` is not used in production.
- Confirm `LEAD_NOTIFICATION_EMAIL` points to the correct internal inbox or distribution list.

## Twilio WhatsApp

- Twilio Sandbox is for testing only.
- Production WhatsApp requires an approved sender and approved templates where applicable.
- Confirm `TWILIO_WHATSAPP_FROM` and `WHATSAPP_INTERNAL_TO` use WhatsApp-formatted numbers, for example `whatsapp:+1268...`.

## Internal Sync

- Confirm `INTERNAL_SYNC_SECRET` is set to a strong random value.
- Confirm `/internal/sync` is protected by `INTERNAL_ADMIN_EMAILS`.
- Confirm `INTERNAL_ADMIN_EMAILS` contains only authorized internal admin email addresses, separated by commas.

## Rate Limiting And Spam Protection

- Confirm production rate limiting is backed by Supabase `public.rate_limits`.
- Confirm no additional third-party Redis provider is required.
- Confirm rate limit responses do not expose IP addresses, database keys, counters, tokens, or storage details.
- Confirm rate limiting fails open if Supabase rate-limit storage is temporarily unavailable.
- Confirm public lead intake is limited to 5 submissions per IP per 10 minutes.
- Confirm portal request creation is limited to 10 submissions per user per hour.
- Confirm document uploads are limited to 20 uploads per user per hour.
- Confirm task updates are limited to 20 submissions per user per hour.
- Confirm internal sync wrapper routes are limited to 10 runs per admin email per 10 minutes.
- Confirm the public contact honeypot returns a success-like response without creating integrations when filled.
- Keep Cloudflare Turnstile as a future option if spam increases.

## Protected Routes

- Client routes redirect unauthenticated users to `/client/login`.
- Client dashboard, requests, request detail, new request, documents, and profile pages scope data through the logged-in user's client profile.
- Request detail pages verify the request belongs to the logged-in client.
- Document metadata is shown only for the owning client.
- `/internal/sync` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/internal/errors` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/api/internal/errors/[id]/resolve` and `/api/internal/errors/[id]/reopen` require an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.

## Security Review

- Confirm `docs/SECURITY_AUDIT.md` has been reviewed before production changes.
- Confirm only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` are browser-visible.
- Confirm server-only secrets are not referenced in client components.
- Confirm public lead-intake and authenticated write routes return safe errors only.
- Confirm public lead-intake has rate limiting and honeypot spam protection.
- Confirm Cloudflare Turnstile remains documented as a future option, not active.
- Confirm monitoring/error tracking is configured with secret redaction before broad production use.
- Confirm workflow error logs are sanitized and never include secrets.
- Confirm workflow error resolution notes do not include secrets or raw provider payloads.
- Confirm retry actions are not automatic. Future retry controls should be limited to Google Sheets logging, Resend notifications, Twilio notifications, and ClickUp comment/attachment failures.
- Confirm Zoho CRM lead creation, ClickUp task creation, Supabase document metadata inserts, auth/authorization failures, and validation failures are not configured for automatic retry.
- Keep Sentry or another external error tracker as a future monitoring option.
- Confirm API keys and OAuth refresh tokens have an owner and rotation cadence.

## Final Verification

- Run `npm run lint`.
- Run `npm run build`.
- Submit a test lead from the production URL.
- Submit a test client portal request.
- Upload a test document and confirm it remains private in Supabase Storage.
- Run internal status and billing sync from an authorized admin account.
- Confirm Supabase displays client-facing billing/invoice status synced from ClickUp.
