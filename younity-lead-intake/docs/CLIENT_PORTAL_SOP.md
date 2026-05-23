# Client Portal Standard Operating Procedure

This SOP explains how Younity Consultancy staff should operate the client portal without needing to understand the codebase. Supabase is used for auth, client portal data, private document storage, rate limiting, and workflow errors. ClickUp is the operations hub. Zoho CRM stores lead/client relationship records. Twilio sends internal WhatsApp alerts. Google Sheets provides backup logging. Email-dependent client notifications remain paused until Younity email services are reactivated.

## SOP 1: Onboard a new client manually

1. Go to `/internal/login`.
2. Log in as an admin.
3. Go to `/internal/onboarding`.
4. Create the client profile.
5. Create the Supabase Auth user manually in Supabase.
6. Copy the Auth User ID from Supabase.
7. Link the Auth User ID to the client profile.
8. Give the client their login details manually.
9. Ask the client to log in at `/client/login`.
10. Confirm the client dashboard loads.

Notes:

- The client profile must be linked through `clients.user_id`.
- Automated invite emails are paused.
- Do not use Zoho Books during onboarding.

## SOP 2: Handle a new client request

1. Client submits a request from `/client/requests/new`.
2. A ClickUp task is created.
3. Admin reviews the request in `/internal/requests`.
4. Admin updates the status as needed.
5. Client sees the updated status in the portal.
6. ClickUp remains the operations source of truth.

Notes:

- Use the portal for client-visible request status and notes.
- Use ClickUp for team operations, follow-up work, billing preparation, and task ownership.
- If task creation fails, review workflow errors and create the ClickUp task manually if needed.

## SOP 3: Request documents from a client

1. Go to `/internal/requests/[id]`.
2. Use the Request Document form.
3. Choose the document type.
4. Add a plain-language message.
5. Client sees the item under Documents Needed.
6. Client uploads the file.
7. Admin reviews the document in `/internal/documents`.

Notes:

- Keep document requests specific and client-friendly.
- Do not ask clients to email sensitive documents when portal upload is available.
- Uploaded files are stored privately and opened through signed links.

## SOP 4: Review documents

1. Go to `/internal/documents`.
2. Open the document securely.
3. Review the file.
4. Mark the status as Approved, Rejected, Needs Replacement, or another appropriate status.
5. Add a note if needed.
6. Client sees the status update.

Notes:

- Use Needs Replacement when the client should upload a better or corrected file.
- Use clear notes that explain what is missing or what needs to change.
- Do not share signed document links outside the intended review context.

## SOP 5: Update request status

1. Go to `/internal/requests/[id]`.
2. Choose the status.
3. Add a client-visible note if needed.
4. Save.
5. Client sees the update on the request page.

Notes:

- Client-visible notes should be plain language and avoid internal shorthand.
- Keep operational detail and team handoffs in ClickUp.

## SOP 6: Use ClickUp with the portal

ClickUp is the operations hub for Younity Consultancy.

- The portal creates or links ClickUp tasks for client requests.
- Client uploads can attach files/comments to ClickUp for operational visibility.
- ClickUp webhooks sync status and billing information back to the portal.
- Manual sync exists as a fallback at `/internal/sync`.

Use ClickUp for:

- Internal task ownership.
- Subtasks and team follow-up.
- Billing preparation.
- Operational notes that are not meant for the client portal.

Use the portal for:

- Client-facing request status.
- Client-facing document status.
- Secure document upload and signed document access.
- Internal admin actions tied to portal records.

## SOP 7: Handle workflow errors

1. Go to `/internal/errors`.
2. Review unresolved errors.
3. Open the context carefully.
4. Retry only safe retryable errors.
5. Mark the error resolved with a note after it is handled.
6. Reopen the error if the issue returns.

Notes:

- Do not retry actions that could create duplicate client records, duplicate Zoho CRM leads, duplicate ClickUp tasks, or duplicate file operations unless the error is explicitly safe to retry.
- Use resolution notes to explain what was checked or fixed.
- If uncertain, resolve the operational issue manually first, then document what happened.

## SOP 8: Mobile client access

Clients can add the portal to their phone home screen for easier access.

iPhone:

1. Open the portal in Safari.
2. Go to `/client/login`.
3. Tap Share.
4. Tap Add to Home Screen.
5. Confirm the shortcut.

Android:

1. Open the portal in Chrome.
2. Go to `/client/login`.
3. Open the browser menu.
4. Tap Add to Home screen or Install app.
5. Confirm the shortcut.

Notes:

- The shortcut opens the portal at `/client/login`.
- The client still needs their email and password.
- The shortcut does not replace Supabase Auth login.

## SOP 9: Billing/manual invoice workflow

Zoho Books is inactive and must not be used or reintroduced.

- Billing information is managed in ClickUp.
- Billing status syncs from ClickUp to the portal.
- Actual invoices are handled manually or outside the portal for now.
- Admins can update invoice/manual billing status internally.
- Payment links are inactive.

Use ClickUp as the billing preparation hub and keep client-facing portal status aligned when appropriate.

## SOP 10: Paused email workflows

Automated client emails are paused until Younity email/domain services are reactivated.

- Do not promise clients automated email notices yet.
- Use manual communication or WhatsApp/internal channels as needed.
- Automated invite emails are paused.
- Client-facing automated email notifications are paused.
- Resend production sending depends on Younity email reactivation and a verified production sender.

