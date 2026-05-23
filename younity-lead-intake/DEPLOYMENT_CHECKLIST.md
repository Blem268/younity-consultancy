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
- `CLICKUP_TEAM_ID`
- `CLICKUP_WEBHOOK_SECRET`

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
- Confirm `NEXT_PUBLIC_SITE_URL` is the exact HTTPS production URL before registering the ClickUp webhook.
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
- Confirm `CLICKUP_TEAM_ID` is set for webhook registration.
- Confirm `CLICKUP_WEBHOOK_SECRET` is set server-side for incoming webhook signature verification.
- Test `/internal/sync` after deployment.
- Test `/internal/errors` after deployment.
- Test `/internal` after deployment.
- Test `/internal/clients`, `/internal/requests`, and `/internal/documents` after deployment.
- Test `/internal/clients/[id]` and `/internal/requests/[id]` after deployment.

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
- Register the ClickUp webhook from `/internal/sync` or with the documented ClickUp API call.
- Confirm `/api/webhooks/clickup` receives signed ClickUp task update events and updates only linked requests.
- Confirm `/internal` summarizes workflow errors, client requests, document uploads, billing readiness, and active rate-limit records for an authorized admin.
- Confirm `/internal` links to client, request, document, sync, and workflow error management pages.
- Confirm the shared internal navigation highlights Dashboard, Clients, Requests, Documents, Sync Controls, and Workflow Errors on desktop and mobile widths.
- Confirm authorized admins can review `/internal/clients`, `/internal/requests`, and `/internal/documents`.
- Confirm internal client, request, document, and workflow error filters/search return expected results and useful empty states.
- Confirm workflow error sanitized context remains collapsed by default and does not display tokens, passwords, keys, authorization headers, cookies, credentials, or raw email addresses.
- Confirm authorized admins can open private documents only through `/api/internal/documents/[id]/open` and receive a short-lived signed URL.
- Confirm workflow errors can be reviewed at `/internal/errors` by an authorized admin.
- Confirm authorized admins can mark workflow errors resolved with an optional note.
- Confirm authorized admins can reopen resolved workflow errors.
- Confirm authorized admins see retry metadata and can retry only open errors marked retryable.
- Confirm client-facing billing/invoice status reflects ClickUp billing sync data.
- Confirm public lead-intake rate limiting returns a safe 429 response after repeated submissions.
- Confirm portal request, document upload, task update, and internal sync rate limits return safe 429 responses after repeated submissions.
- Confirm the public contact form honeypot field is present and normal submissions still work.
- Confirm the Phase 20 visual system matches the actual blue-themed Younity Consultancy website across the homepage, contact form, client portal, task workspace, document library, internal dashboard, admin lists, workflow errors, and sync controls.
- Confirm Phase 21 premium UI polish is visible across the official website, contact form, client portal, and internal admin area while retaining Younity blue branding, official logo usage, and unchanged backend workflows.
- Confirm status badges use consistent colors for submitted/new, in-progress/review, waiting/requested, approved/paid/completed, rejected/error/overdue, and neutral/closed states.
- Confirm forms, action buttons, cards, empty states, mobile list views, table scrolling, and focus states remain usable on mobile and keyboard navigation.
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
- Run `supabase/workflow_errors_retry.sql` manually in the Supabase SQL Editor.
- Confirm `public.workflow_errors` includes `retryable`, `retry_status`, `retry_attempts`, `last_retry_at`, `last_retry_by`, and `last_retry_message`.
- Run `supabase/clickup_webhook_events.sql` manually in the Supabase SQL Editor.
- Confirm `public.clickup_webhook_events` exists with RLS enabled and no public/client policies.
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
- Confirm `CLICKUP_TEAM_ID` points to the production Workspace/team used for API webhook registration.
- Confirm `CLICKUP_WEBHOOK_SECRET` is server-only and matches the ClickUp webhook signing secret.
- Confirm the registered webhook endpoint is `${NEXT_PUBLIC_SITE_URL}/api/webhooks/clickup`.
- If capturing the initial ClickUp signing secret, register from a secure server-side terminal or approved secret-management workflow and store the returned secret in `CLICKUP_WEBHOOK_SECRET`; do not paste the secret into client-visible tools or docs.
- Confirm manual status and billing sync remains available at `/internal/sync` as a fallback.
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
- Confirm admins sign in through `/internal/login` and client users still sign in through `/client/login`.
- Confirm logged-out visits to `/internal`, `/internal/clients`, and `/internal/errors` redirect to `/internal/login`.
- Confirm authenticated non-admin users see access denied for `/internal` and receive 403 responses from internal admin action routes.
- Confirm `/internal` is protected by `INTERNAL_ADMIN_EMAILS`.
- Confirm `/internal/clients`, `/internal/requests`, and `/internal/documents` are protected by `INTERNAL_ADMIN_EMAILS`.
- Confirm `/internal/clients/[id]` and `/internal/requests/[id]` are protected by `INTERNAL_ADMIN_EMAILS`.
- Confirm `/internal/sync` is protected by `INTERNAL_ADMIN_EMAILS`.
- Confirm `/internal/errors` remains protected by `INTERNAL_ADMIN_EMAILS`.
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
- Internal admin routes redirect unauthenticated users to `/internal/login`.
- Public navigation links to the client portal only and does not expose the internal admin login.
- Client dashboard, requests, request detail, new request, documents, and profile pages scope data through the logged-in user's client profile.
- Request detail pages verify the request belongs to the logged-in client.
- Document metadata is shown only for the owning client.
- `/internal` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/internal/clients`, `/internal/clients/[id]`, `/internal/requests`, `/internal/requests/[id]`, and `/internal/documents` require an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/internal/sync` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/internal/errors` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/api/internal/documents/[id]/open` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/api/internal/errors/[id]/resolve` and `/api/internal/errors/[id]/reopen` require an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/api/internal/errors/[id]/retry` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.
- `/api/internal/clickup-webhook/register` requires an authenticated user whose email is listed in `INTERNAL_ADMIN_EMAILS`.

## Security Review

- Confirm `docs/SECURITY_AUDIT.md` has been reviewed before production changes.
- Confirm only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` are browser-visible.
- Confirm server-only secrets are not referenced in client components.
- Confirm public lead-intake and authenticated write routes return safe errors only.
- Confirm public lead-intake has rate limiting and honeypot spam protection.
- Confirm Cloudflare Turnstile remains documented as a future option, not active.
- Confirm monitoring/error tracking is configured with secret redaction before broad production use.
- Confirm internal request pages display ClickUp task IDs only and do not expose ClickUp API tokens or private URLs.
- Confirm `/api/webhooks/clickup` verifies ClickUp `X-Signature` with `CLICKUP_WEBHOOK_SECRET` and returns safe JSON only.
- Confirm raw ClickUp webhook payloads are not displayed publicly or returned to browsers.
- Confirm `public.clickup_webhook_events` prevents duplicate webhook processing when ClickUp retries the same history item.
- Confirm billing remains ClickUp-based/manual and no Zoho Books integration or `ZOHO_BOOKS_*` environment variables are introduced.
- Confirm Phase 15 admin action routes require Supabase auth plus `INTERNAL_ADMIN_EMAILS`.
- Confirm request status and billing actions update only allowlisted `client_requests` fields and add client timeline entries only when intended.
- Confirm client profile admin edits cannot change `id`, `user_id`, `email`, or `created_at`.
- Confirm document review actions update only document status and never expose private file URLs.
- Confirm internal document open buttons use `/api/internal/documents/[id]/open` and do not expose public file URLs.
- Run `supabase/document_requests_upgrade.sql` in the Supabase SQL Editor before using structured document requests.
- Confirm additional document requests create `client_documents` rows with `status = Requested`, `file_name = Pending upload`, `file_path = pending`, requested metadata, and a client timeline update.
- Confirm clients see requested documents under Documents Needed and can upload only against their own requested-document IDs.
- Confirm pending placeholder documents do not show Open buttons and both client/admin open routes refuse `file_path = pending`.
- Confirm admin document review supports Requested, Submitted, Received, Under Review, Approved, Rejected, and Needs Replacement, with reviewer metadata saved for review states.
- Confirm workflow error logs are sanitized and never include secrets.
- Confirm workflow error resolution notes do not include secrets or raw provider payloads.
- Confirm retry actions are admin-triggered only and limited to Google Sheets logging, Resend notifications, Twilio notifications, and ClickUp comment/attachment failures.
- Confirm retries require safe stored `context.retryPayload` and do not store secrets in workflow error context.
- Confirm retry responses do not expose raw provider errors.
- Confirm Zoho CRM lead creation, ClickUp task creation, Supabase storage uploads, Supabase document metadata inserts, request creation, auth/authorization failures, and validation failures are not configured for automatic retry.
- Keep Sentry or another external error tracker as a future monitoring option.
- Confirm API keys and OAuth refresh tokens have an owner and rotation cadence.
- Confirm email-dependent notification phases remain paused until Younity email is reactivated and verified.

## Final Verification

- Run `npm run lint`.
- Run `npm run build`.
- Submit a test lead from the production URL.
- Submit a test client portal request.
- Upload a test document and confirm it remains private in Supabase Storage.
- Run internal status and billing sync from an authorized admin account.
- Confirm Supabase displays client-facing billing/invoice status synced from ClickUp.
