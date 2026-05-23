# Troubleshooting Guide

Use this guide for common Younity Consultancy client portal issues. Do not expose secrets, edit `.env.local`, or reintroduce Zoho Books while troubleshooting.

## Client cannot log in

Check:

- Supabase Auth user exists.
- Client is using the correct email and password.
- Client profile is linked to the Auth user.
- `clients.user_id` contains the correct Supabase Auth User ID.

Fix:

- Reset the password manually in Supabase if needed.
- Link or correct `clients.user_id`.
- Ask the client to try `/client/login` again.

## Client sees "profile not set up"

Cause:

- Auth user exists, but `clients.user_id` is not linked to the client profile.

Fix:

- Find the client profile.
- Copy the correct Supabase Auth User ID.
- Link it to `clients.user_id`.
- Ask the client to refresh or log in again.

## Client cannot see request

Check:

- `request.client_id` matches the correct `client.id`.
- Logged-in user is linked to the correct client profile.
- The client is using the correct login account.

Fix:

- Correct the request/client relationship only after confirming ownership.
- Do not expose another client's request URL or details.

## Document upload fails

Check:

- File type is accepted.
- File size is within the allowed limit.
- Supabase Storage bucket `client-documents` exists and is active.
- Workflow errors in `/internal/errors`.

Fix:

- Ask the client to retry with an accepted file type and smaller file if needed.
- Review unresolved workflow errors.
- Confirm private storage access is working before asking the client to retry sensitive uploads.

## ClickUp task not created

Check:

- ClickUp API token is valid.
- ClickUp list ID is correct.
- Workflow errors in `/internal/errors`.

Fix:

- Create the ClickUp task manually if needed.
- Link or note the manual task in the operational record.
- Resolve the workflow error with a note after handling.

## ClickUp status not syncing

Check:

- ClickUp webhook registration is active.
- `CLICKUP_WEBHOOK_SECRET` is configured correctly.
- `clickup_webhook_events` table is receiving events.
- Manual sync page at `/internal/sync`.

Fix:

- Run manual sync from `/internal/sync`.
- Re-register the webhook from the internal sync controls if needed.
- Review workflow errors for failed sync attempts.

## Internal admin login blocked

Check:

- Supabase Auth user exists.
- Admin email is included in `INTERNAL_ADMIN_EMAILS`.
- Admin email spelling matches exactly.

Fix:

- Correct the Supabase Auth user or admin email configuration.
- Ask the admin to log in again at `/internal/login`.

## Rate limit triggered

Cause:

- A request exceeded the configured rate-limit window.

Fix:

- Wait for the rate-limit window to reset.
- Check the `rate_limits` table if needed.
- If a legitimate user is blocked repeatedly, review whether the same browser/device is retrying too quickly.

## Email sending fails

Cause:

- `RESEND_FROM_EMAIL` may be missing, or Younity email services are paused.

Fix:

- Treat this as expected until Younity email is reactivated.
- Use manual communication or WhatsApp/internal channels as needed.
- Do not add new email-dependent workflows until production email sending is approved.

## Workflow error appears

Check:

- Open `/internal/errors`.
- Review the unresolved error.
- Read the context carefully.

Fix:

- Retry only if the error is marked safe/retryable and the action will not create duplicates.
- Handle the operational issue manually if needed.
- Mark resolved with a note after handling.
- Reopen if the issue returns.

