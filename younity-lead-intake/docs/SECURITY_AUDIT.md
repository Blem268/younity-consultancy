# Security Audit

Phase 10 security review completed for the Younity Consultancy Next.js application. Phase 11 added lightweight rate limiting and a public lead-intake honeypot. Phase 11B moved production rate limiting storage to Supabase.

## Summary

The review covered client portal access control, client API routes, internal sync controls, private document storage, file upload handling, server-only environment variables, third-party integrations, and logging behavior.

The active architecture remains:

- Supabase for auth, portal data, private storage, and short-lived signed document URLs.
- ClickUp as the operations and billing preparation hub.
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
- Internal sync page and sync API routes.
- Supabase server/admin clients.
- ClickUp, Zoho CRM, Resend, Twilio, and Google Sheets integrations.

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

## Logging Review

Findings:

- No request body logs were found.
- No environment variable, token, cookie, or session logs were found.
- Some server-side logs retain sanitized Supabase error metadata for operations debugging.
- Third-party provider errors are logged server-side, but raw provider messages are no longer returned to browser clients for the audited flows.

Fixes applied:

- Public lead-intake responses no longer return internal integration IDs, ClickUp URLs, or raw integration warning text.
- Client request/document/task routes no longer return raw provider error messages in warning arrays.

## Issues Found

- Document open route did not validate document UUID before querying Supabase.
- Document upload route did not validate linked request UUID before querying Supabase.
- Client-facing routes returned raw third-party error messages in warning arrays.
- Public lead intake returned internal integration identifiers and ClickUp URL data.
- Internal sync routes returned raw exception text on top-level sync failures.
- File upload routes had extension validation but no MIME validation.
- Public and sensitive write routes did not have request rate limiting.
- Public lead-intake form did not have a honeypot field.

## Fixes Applied

- Added missing UUID validation.
- Added MIME validation for document uploads and task-item uploads.
- Sanitized client-facing warning messages.
- Sanitized public lead-intake response payload.
- Sanitized internal sync top-level error responses.
- Added rate limiting to public lead intake, portal request creation, document uploads, task updates, and internal sync wrapper routes.
- Added a hidden public contact form honeypot.
- Kept ClickUp billing sync and Supabase billing display active.
- Confirmed Zoho Books integration is not active.

## Remaining Risks And Recommendations

- Run `supabase/rate_limits.sql` in production so rate limiting works consistently across serverless instances.
- Add Cloudflare Turnstile to the public contact form if spam persists beyond the honeypot and rate limits.
- Add production monitoring and error tracking with secret redaction.
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
