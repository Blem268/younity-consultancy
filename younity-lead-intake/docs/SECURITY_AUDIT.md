# Security Audit

Phase 10 security review completed for the Younity Consultancy Next.js application. Phase 11 added lightweight rate limiting and a public lead-intake honeypot. Phase 11B moved production rate limiting storage to Supabase. Phase 12A added sanitized workflow error logging backed by Supabase. Phase 12B added admin resolution and reopen controls for workflow errors. Phase 12C added controlled admin retries for safe retryable workflow errors. Phase 18 added ClickUp webhook automation with signature verification and Supabase-backed idempotency.

## Summary

The review covered client portal access control, client API routes, internal sync controls, private document storage, file upload handling, server-only environment variables, third-party integrations, and logging behavior.

The active architecture remains:

- Supabase for auth, portal data, private storage, and short-lived signed document URLs.
- Supabase for production rate limiting and sanitized internal workflow error logs.
- ClickUp as the operations and billing preparation hub, with signed webhooks for status and billing sync plus manual sync fallback.
- Zoho CRM for lead and client relationship records.
- Resend for email notifications.
- Twilio for WhatsApp alerts.
- Google Sheets for backup lead logging.
- Vercel for hosting.

Zoho Books integration is not active and was not reintroduced.

## Architecture Reviewed

- Public homepage and contact form.
- Public lead intake API.
- Supabase client portal pages.
- Client request, document, profile, and task-update APIs.
- Internal sync page, sync API routes, and admin-only ClickUp webhook registration route.
- Public ClickUp webhook receiver at `/api/webhooks/clickup`.
- Supabase server/admin clients.
- ClickUp, Zoho CRM, Resend, Twilio, and Google Sheets integrations.
- Workflow error logging and the `/internal/errors` admin operations page.

## Client Route Protections

Reviewed:

- `app/client/dashboard/page.tsx`
- `app/client/requests/page.tsx`
- `app/client/requests/[id]/page.tsx`
- `app/client/requests/new/page.tsx`
- `app/client/documents/page.tsx`
- `app/client/profile/page.tsx`
- `app/client/requests/[id]/tasks/[taskItemId]/page.tsx`

Findings:

- Protected pages use the Supabase server client and `supabase.auth.getUser()`.
- Logged-out users are redirected to `/client/login`.
- Client profiles are resolved through `clients.user_id = user.id`.
- Request, document, invoice, update, and task queries are scoped to the resolved client profile.
- Request detail and task pages validate Supabase request UUIDs before querying.
- Clients cannot access another client’s request detail or task workspace by changing URL IDs.

## Client API Protections

Reviewed:

- `app/api/client/documents/[id]/open/route.ts`
- `app/api/client/documents/upload/route.ts`
- `app/api/client/requests/create/route.ts`
- `app/api/client/profile/update/route.ts`
- `app/api/client/requests/[id]/tasks/route.ts`
- `app/api/client/requests/[id]/tasks/[taskItemId]/submit/route.ts`

Findings:

- Client APIs require Supabase auth before accessing portal data.
- Client profile lookup is required before reads/writes.
- Ownership is enforced with `client_id = clientProfile.id`.
- Clients cannot set internal-only request fields directly. New request creation sets controlled defaults for status, billing, invoice status, and ClickUp metadata.
- Profile updates are limited to client contact fields and preserve auth ownership checks.

Fixes applied:

- Added UUID validation to the private document open route before Supabase UUID queries.
- Added UUID validation for linked request IDs during document uploads.
- Added safe JSON parsing to client request/profile routes.
- Replaced raw provider warning messages in client API responses with safe operational messages.
- Added authenticated rate limiting for portal request creation, document uploads, and task updates.

## Internal Admin Protections

Reviewed:

- `app/internal/sync/page.tsx`
- `app/api/internal/sync-clickup-status/route.ts`
- `app/api/internal/sync-clickup-billing/route.ts`
- `app/api/internal/run-status-sync/route.ts`
- `app/api/internal/run-billing-sync/route.ts`

Findings:

- `/internal/sync` requires Supabase auth and an email in `INTERNAL_ADMIN_EMAILS`.
- Browser-triggered wrapper routes require Supabase auth and admin email allowlist.
- Direct sync endpoints require `INTERNAL_SYNC_SECRET`.
- Browser wrapper routes do not expose `INTERNAL_SYNC_SECRET`.
- `/api/internal/clickup-webhook/register` requires Supabase auth and `INTERNAL_ADMIN_EMAILS`.
- Webhook registration uses server-only `CLICKUP_API_TOKEN` and `CLICKUP_TEAM_ID` and does not expose the ClickUp API token.

Fixes applied:

- Internal sync route catch blocks now return generic failure messages instead of raw exception text.
- Added admin-email-based rate limiting to browser-triggered internal sync wrapper routes.

## Supabase RLS And Service Role Usage

Reviewed:

- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`
- All imports of `@/lib/supabase/admin`

Findings:

- The service role key is only read in `lib/supabase/admin.ts`.
- Admin client imports are limited to server route/internal sync files.
- Client components do not import the admin client.
- Admin-client writes are paired with prior auth and ownership checks in client-facing routes.
- RLS policies in `supabase/schema.sql` scope client reads to the authenticated user’s client profile.

## Private Document Storage Protections

Findings:

- The deployment checklist requires the `client-documents` bucket to remain private.
- Upload routes store private storage paths and set `file_url` to `null`.
- The document library opens files through `/api/client/documents/[id]/open`.
- Signed URLs are created only after auth, client profile lookup, document UUID validation, and ownership checks.
- Signed URL expiry is 60 seconds.
- File paths are not displayed in the client UI.

## File Upload Security

Reviewed:

- `app/api/client/documents/upload/route.ts`
- `app/api/client/requests/[id]/tasks/[taskItemId]/submit/route.ts`

Findings:

- Maximum file size is enforced at 10 MB.
- Allowed file extensions are enforced.
- Allowed MIME types are checked for known file extensions.
- File names are sanitized before storage-path construction.
- Uploads linked to requests require ownership checks.
- ClickUp attachment failures do not block Supabase document storage.
- Private file URLs are not exposed.

Fixes applied:

- Added MIME type validation for allowed file extensions while allowing empty or `application/octet-stream` uploads to avoid rejecting valid browser/platform uploads with generic MIME values.
- Added per-user upload/update rate limits before storage or ClickUp attachment work begins.

## Rate Limiting And Spam Protection

Phase 11 added practical abuse protection for public and sensitive write routes.

Active limits:

- Public lead intake: 5 submissions per IP per 10 minutes.
- Portal request creation: 10 submissions per authenticated user per hour.
- Portal document upload: 20 uploads per authenticated user per hour.
- Task/subtask updates: 20 submissions per authenticated user per hour.
- Internal sync wrapper routes: 10 sync runs per admin email per 10 minutes.

Implementation notes:

- Production rate limiting is backed by Supabase table `public.rate_limits` and SQL function `public.increment_rate_limit`.
- Manual setup is required: run `supabase/rate_limits.sql` in the Supabase SQL Editor.
- No additional third-party Redis provider is required.
- Rate limiting fails open if Supabase rate-limit storage is temporarily unavailable.
- Rate limit responses are user-safe and do not expose IP addresses, database keys, counters, tokens, or storage details.
- The public contact form includes a hidden `companyWebsite` honeypot. If filled, the lead-intake route returns a normal success-like response without running integrations.
- Cloudflare Turnstile is not active. It remains a future recommendation if public lead spam increases.

## Environment Variable And Secrets Review

Reviewed server-only variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `CLICKUP_API_TOKEN`
- `CLICKUP_TEAM_ID`
- `CLICKUP_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `TWILIO_AUTH_TOKEN`
- `INTERNAL_SYNC_SECRET`
- `GOOGLE_SHEETS_WEB_APP_URL`

Findings:

- Server-only secrets are not used in client components.
- Server-only secrets are not exposed as `NEXT_PUBLIC_` variables.
- Secrets are not sent in browser API responses.
- Browser-visible variables remain limited to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`.
- Rate limiting uses the existing server-only Supabase service role key through the admin client.
- Incoming ClickUp webhooks require a valid `X-Signature` HMAC created with `CLICKUP_WEBHOOK_SECRET`; requests fail closed when the signature or secret is unavailable.
- `CLICKUP_WEBHOOK_SECRET` is server-only and is not returned by webhook or admin registration responses.

## ClickUp Webhook Security

Phase 18 added `/api/webhooks/clickup` for ClickUp task update events.

Implementation notes:

- The route reads the raw request body and verifies the ClickUp `X-Signature` header using HMAC SHA-256 and `CLICKUP_WEBHOOK_SECRET`.
- The route returns only safe JSON messages and never returns raw webhook payloads.
- Task events are linked to Supabase by `client_requests.clickup_task_id`.
- Request status and billing timeline rows are inserted only when values actually change, preventing duplicate client updates for repeated webhook deliveries.
- Idempotency is backed by `public.clickup_webhook_events`; run `supabase/clickup_webhook_events.sql` manually in the Supabase SQL Editor.
- `public.clickup_webhook_events` has RLS enabled and no public/client policies; writes are server/admin only.
- If ClickUp omits `webhook_id` or `history_items.id`, the webhook still processes but logs a sanitized info-level workflow error noting that no idempotency key was available.
- Manual sync buttons remain available at `/internal/sync` if webhook delivery, signature setup, or Supabase idempotency setup needs investigation.
- Clients and non-admin users cannot register ClickUp webhooks or trigger internal sync routes.

## Logging Review

Findings:

- No request body logs were found.
- No environment variable, token, cookie, or session logs were found.
- Some server-side logs retain sanitized Supabase error metadata for operations debugging.
- Third-party provider errors are logged server-side, but raw provider messages are no longer returned to browser clients for the audited flows.
- Critical workflow failures are stored in `public.workflow_errors` with sanitized context for internal admin review.

Fixes applied:

- Public lead-intake responses no longer return internal integration IDs, ClickUp URLs, or raw integration warning text.
- Client request/document/task routes no longer return raw provider error messages in warning arrays.
- Added `logWorkflowError()` helper that redacts token, secret, authorization, cookie, password, refresh, bearer, and session-shaped context keys.
- Added `/internal/errors` for admin-only review of latest sanitized workflow errors.
- Added admin-only resolve, reopen, and controlled retry actions for workflow errors.

## Workflow Error Logging

Phase 12A added a Supabase-backed workflow error log. Phase 12B added admin resolution controls. Phase 12C added controlled retry metadata and an admin-only retry route.

Implementation notes:

- Manual setup is required: run `supabase/workflow_errors.sql` in the Supabase SQL Editor.
- Resolution setup is required: run `supabase/workflow_errors_resolution.sql` in the Supabase SQL Editor.
- Retry setup is required: run `supabase/workflow_errors_retry.sql` in the Supabase SQL Editor.
- `public.workflow_errors` has RLS enabled and no public/client policies.
- The app writes workflow logs only through server-side service-role/admin client code.
- `logWorkflowError()` never throws to callers; if logging fails, the original workflow continues with existing behavior.
- Logged context is intentionally small and sanitized.
- `/internal/errors` requires Supabase auth and `INTERNAL_ADMIN_EMAILS`.
- `/internal/errors` supports unresolved/resolved/all, source, and severity filters.
- Admins can mark workflow errors resolved, store optional resolution notes, and reopen resolved errors.
- Resolution metadata is stored in `public.workflow_errors` as `resolved_by`, `resolution_note`, `reopened_at`, and `reopened_by`.
- Admins can retry only open errors marked `retryable = true`.
- Retry metadata is stored as `retryable`, `retry_status`, `retry_attempts`, `last_retry_at`, `last_retry_by`, and `last_retry_message`.
- Retry actions require Supabase auth and `INTERNAL_ADMIN_EMAILS`; clients and non-admin users cannot call the retry route.
- Supported retry categories are Google Sheets logging, Resend email notifications, Twilio WhatsApp notifications, ClickUp comments, and ClickUp attachments.
- A retry requires explicit safe stored context in `context.retryPayload`; the route returns a safe blocked message when the original log has only partial context.
- Workflow error context must not store secrets, tokens, authorization headers, cookies, or raw provider credentials.
- Retry responses do not expose raw provider errors.
- Context is hidden by default and shown only in a collapsible preformatted block.
- Zoho CRM lead creation, ClickUp task creation, Supabase storage uploads, Supabase document metadata inserts, request creation, auth/authorization failures, and validation failures remain manual and are not configured for automatic retry.
- Sentry or another external error tracker remains a future recommendation for broader monitoring, alerting, and release correlation.

## Internal Admin Dashboard

Phase 13 added a central internal dashboard at `/internal`.

Implementation notes:

- `/internal` requires Supabase auth and `INTERNAL_ADMIN_EMAILS`.
- Logged-out users are redirected to `/client/login`; authenticated non-admin users see a safe access-denied message.
- Dashboard summaries cover open workflow errors, recent client requests, recent document uploads, active client requests, requests ready for billing, and active Supabase rate-limit records.
- Recent sections show unresolved workflow errors, recent client requests, and recent document uploads without exposing workflow context or private document URLs.
- Dashboard data is loaded server-side with the Supabase admin client after the admin check.
- Service-role access remains server-only and is not used in client components.
- `/internal/sync` and `/internal/errors` remain available and linked from the dashboard.

## Internal Management Pages

Phase 14 added read-only internal management pages for client operations review. Phase 15 added controlled admin actions to those management pages.

Implementation notes:

- `/internal/clients`, `/internal/clients/[id]`, `/internal/requests`, `/internal/requests/[id]`, and `/internal/documents` require Supabase auth and `INTERNAL_ADMIN_EMAILS`.
- Logged-out users are redirected to `/client/login`; authenticated non-admin users see a safe access-denied message.
- Management pages use server-side Supabase admin queries after the admin check and do not expose the service role key to browser code.
- `/api/internal/documents/[id]/open` requires Supabase auth and `INTERNAL_ADMIN_EMAILS`, validates document UUIDs, and redirects to a short-lived Supabase Storage signed URL.
- The internal document list and related document sections do not render public file URLs or long-lived private storage paths.
- Admin mutation routes require Supabase auth and `INTERNAL_ADMIN_EMAILS` before changing portal records.
- Admin mutation routes validate UUID route params, validate allowed enum values, and update only allowlisted fields.
- Request status, manual billing/invoice status, client-visible update notes, selected client profile fields, document review status, and additional document requests are handled server-side through `/api/internal/*` routes.
- Relevant admin actions add `client_updates` timeline entries when the update should be visible to the client.
- Admin action failures are logged through sanitized workflow error logging sources such as `internal_request_status_update`, `internal_request_billing_update`, `internal_client_update`, `internal_document_status_update`, and `internal_document_request`.
- ClickUp remains the operations and billing preparation hub. Request pages display ClickUp task IDs only, not private ClickUp URLs.
- Billing remains ClickUp-based/manual; Zoho Books is not active and was not reintroduced.

## Issues Found

- Document open route did not validate document UUID before querying Supabase.
- Document upload route did not validate linked request UUID before querying Supabase.
- Client-facing routes returned raw third-party error messages in warning arrays.
- Public lead intake returned internal integration identifiers and ClickUp URL data.
- Internal sync routes returned raw exception text on top-level sync failures.
- File upload routes had extension validation but no MIME validation.
- Public and sensitive write routes did not have request rate limiting.
- Public lead-intake form did not have a honeypot field.
- Production workflow failures were only visible in server logs and were not queryable from an internal admin page.

## Fixes Applied

- Added missing UUID validation.
- Added MIME validation for document uploads and task-item uploads.
- Sanitized client-facing warning messages.
- Sanitized public lead-intake response payload.
- Sanitized internal sync top-level error responses.
- Added rate limiting to public lead intake, portal request creation, document uploads, task updates, and internal sync wrapper routes.
- Added a hidden public contact form honeypot.
- Added Supabase-backed workflow error logging and an admin-only `/internal/errors` page.
- Added admin-only workflow error resolve/reopen controls with optional resolution notes.
- Added admin-only workflow error retry controls for safe retryable failures.
- Added admin-only `/internal` dashboard for workflow health, client portal activity, billing readiness, rate-limit records, and quick links to existing internal tools.
- Added admin-only client, request, and document management pages plus a short-lived admin document signed URL route.
- Added admin-only controlled actions for request status, manual billing/invoice status, client update notes, selected client profile fields, document review status, and additional document requests.
- Added signed ClickUp webhook receiver, idempotency table SQL, shared single-request sync logic, and admin-only webhook registration action.
- Kept ClickUp billing sync and Supabase billing display active.
- Confirmed Zoho Books integration is not active.

## Remaining Risks And Recommendations

- Run `supabase/rate_limits.sql` in production so rate limiting works consistently across serverless instances.
- Run `supabase/clickup_webhook_events.sql` in production before enabling ClickUp webhooks.
- Confirm `NEXT_PUBLIC_SITE_URL` exactly matches the production URL before registering ClickUp webhooks.
- Add Cloudflare Turnstile to the public contact form if spam persists beyond the honeypot and rate limits.
- Add production monitoring and error tracking with secret redaction.
- Consider Sentry for alerting, release tracking, and cross-service error correlation.
- Rotate API keys and OAuth refresh tokens periodically.
- Perform multi-client access testing before each major portal release.
- Consider centralized safe logging helpers to standardize server-side error metadata.
- Consider stricter MIME/content inspection for high-risk file uploads if the document workflow expands.
- Keep the `client-documents` bucket private and verify this setting after Supabase project changes.

## Manual Test Checklist

- Logged-out user is redirected from every `/client/*` page to `/client/login`.
- Client A cannot access Client B request detail by changing the request UUID.
- Client A cannot open Client B document by changing the document UUID.
- Malformed UUIDs return safe 400 responses.
- Client document uploads reject unsupported extensions and oversized files.
- Task-item uploads reject unsupported extensions and oversized files.
- Document open links generate short-lived signed URLs only after ownership checks.
- Non-admin authenticated user cannot access `/internal/sync`.
- Logged-out user cannot access `/internal/sync`.
- Direct sync endpoints reject requests without `x-internal-sync-secret`.
- Public lead intake returns safe messages when integrations partially fail.
- Public lead intake returns HTTP 429 after more than 5 submissions from the same IP in 10 minutes.
- Portal request creation returns HTTP 429 after more than 10 submissions by the same user in 1 hour.
- Portal document uploads return HTTP 429 after more than 20 uploads by the same user in 1 hour.
- Task updates return HTTP 429 after more than 20 submissions by the same user in 1 hour.
- Internal sync wrapper routes return HTTP 429 after more than 10 runs by the same admin in 10 minutes.
- Filling the hidden contact honeypot returns a success-like response and creates no integrations.
- Browser responses never include server-only secrets, raw provider responses, ClickUp private URLs, or raw exception details.
- Workflow failures create sanitized rows in `public.workflow_errors`.
- Logged-out users cannot access `/internal`.
- Non-admin users cannot access `/internal` dashboard data.
- `/internal` does not show raw workflow context or private document URLs.
- Logged-out users cannot access `/internal/clients`, `/internal/requests`, or `/internal/documents`.
- Non-admin users cannot access internal client, request, or document management pages.
- Non-admin users cannot call `/api/internal/documents/[id]/open`.
- Non-admin users cannot call request status, billing, update-note, document-request, client update, or document status admin action routes.
- Admin request status updates only accept the configured request status list and update `client_requests.status`.
- Admin billing updates only accept the configured invoice status list and update manual billing fields plus the generic invoice ID field.
- Admin client profile updates cannot change `id`, `user_id`, `email`, or `created_at`.
- Admin document status updates only accept the configured document review status list and do not expose private file URLs.
- Additional document requests create client timeline updates and do not create placeholder document rows while `client_documents.file_path` is required.
- Internal document open links generate short-lived signed URLs only after admin checks.
- Non-admin users cannot access `/internal/errors`.
- Non-admin users cannot call workflow error resolve or reopen API routes.
- Admin users can mark a workflow error resolved with a note and reopen it if needed.
