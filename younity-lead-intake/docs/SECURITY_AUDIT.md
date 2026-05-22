# Security Audit

Phase 10 security review completed for the Younity Consultancy Next.js application.

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
- File names are sanitized before storage-path construction.
- Uploads linked to requests require ownership checks.
- ClickUp attachment failures do not block Supabase document storage.
- Private file URLs are not exposed.

Fixes applied:

- Added MIME type validation for allowed file extensions while allowing empty or `application/octet-stream` uploads to avoid rejecting valid browser/platform uploads with generic MIME values.

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

## Fixes Applied

- Added missing UUID validation.
- Added MIME validation for document uploads and task-item uploads.
- Sanitized client-facing warning messages.
- Sanitized public lead-intake response payload.
- Sanitized internal sync top-level error responses.
- Kept ClickUp billing sync and Supabase billing display active.
- Confirmed Zoho Books integration is not active.

## Remaining Risks And Recommendations

- Add rate limiting to public lead intake and authenticated write APIs.
- Add spam protection such as CAPTCHA or Turnstile to the public contact form if spam appears.
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
- Browser responses never include server-only secrets, raw provider responses, ClickUp private URLs, or raw exception details.
