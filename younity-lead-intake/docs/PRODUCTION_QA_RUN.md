# Production QA Run: Phase 26 Full Client Simulation

Use this checklist to run a full production-style client simulation before launch or after major portal changes. Complete the run with a test client and test request only. Do not expose secrets, edit `.env.local`, reintroduce Zoho Books, or add email-dependent workflows during QA.

## QA Run Details

- [ ] QA date recorded.
- [ ] QA owner recorded.
- [ ] Production or preview URL recorded.
- [ ] Test admin account identified.
- [ ] Test client name recorded.
- [ ] Test client email recorded.
- [ ] Test request ID recorded.
- [ ] Test ClickUp task URL recorded.

## Admin Onboarding

- [ ] Admin can open `/internal/login`.
- [ ] Admin can log in with an approved internal admin account.
- [ ] Admin can access `/internal`.
- [ ] Admin can open `/internal/onboarding`.
- [ ] Admin can create a test client profile.
- [ ] Supabase Auth user is created manually for the test client.
- [ ] Supabase Auth User ID is copied.
- [ ] Test client profile is linked to the Auth User ID.
- [ ] Test client appears in `/internal/clients`.
- [ ] Linked client profile shows the expected client details.

## Client Login

- [ ] Test client can open `/client/login`.
- [ ] Test client can log in with the manually provided credentials.
- [ ] Test client dashboard loads.
- [ ] Dashboard content is simplified and client-friendly.
- [ ] Test client does not see internal admin links or controls.
- [ ] Logged-out access to `/client/dashboard` redirects or blocks correctly.

## Request Submission

- [ ] Test client can open `/client/requests/new`.
- [ ] Test client can submit a realistic test request.
- [ ] Submission success state appears.
- [ ] Request appears on the client dashboard or request list.
- [ ] Request detail page loads for the test client.
- [ ] Request appears in `/internal/requests`.
- [ ] Internal request detail page loads at `/internal/requests/[id]`.
- [ ] Client-visible status and notes display correctly.

## Document Request

- [ ] Admin opens `/internal/requests/[id]` for the test request.
- [ ] Admin uses the Request Document form.
- [ ] Admin selects an appropriate document type.
- [ ] Admin adds a plain-language request message.
- [ ] Requested document appears in the internal request/document views.
- [ ] Requested document appears for the client under Documents Needed.
- [ ] Document request language is clear for a non-technical client.

## Document Upload

- [ ] Test client opens the requested document item.
- [ ] Test client uploads an approved test file type.
- [ ] Upload completes successfully.
- [ ] Uploaded document appears in the client portal.
- [ ] Admin can see the uploaded document in `/internal/documents`.
- [ ] Admin can open the uploaded document securely.
- [ ] Document access uses signed/private access rather than a public file URL.
- [ ] Admin can update document review status.
- [ ] Client can see the updated document status.

## ClickUp Integration

- [ ] ClickUp task is created or linked for the test request.
- [ ] ClickUp task title and description contain the expected request context.
- [ ] ClickUp task is in the correct list.
- [ ] Client upload activity appears in ClickUp as expected.
- [ ] ClickUp remains the operations source of truth for team follow-up.
- [ ] Billing preparation fields/statuses are managed in ClickUp only.
- [ ] Zoho Books is not used.
- [ ] Payment links are not used.

## Webhook Sync

- [ ] ClickUp webhook registration is active.
- [ ] A safe ClickUp status change is made for the test task.
- [ ] Status syncs back to the portal.
- [ ] Billing/manual invoice status syncs back to the portal when applicable.
- [ ] `clickup_webhook_events` receives the webhook event.
- [ ] Duplicate webhook delivery does not create duplicate portal activity.
- [ ] Manual sync at `/internal/sync` works as a fallback.

## Internal Errors

- [ ] Admin can open `/internal/errors`.
- [ ] Unresolved workflow errors are reviewed.
- [ ] Any QA-related error is investigated.
- [ ] Safe retryable errors are retried only when appropriate.
- [ ] Handled errors are marked resolved with a note.
- [ ] Resolved errors can be reopened if the issue returns.
- [ ] No secrets or sensitive payloads are exposed in error context.

## Mobile Test

- [ ] Client login page works on a mobile viewport or mobile device.
- [ ] Client dashboard is readable on mobile.
- [ ] Request detail page is readable on mobile.
- [ ] Document request/upload flow is usable on mobile.
- [ ] Uploaded document can be opened from mobile.
- [ ] iPhone Add to Home Screen flow is verified or documented for the client.
- [ ] Android Add to Home screen/install flow is verified or documented for the client.
- [ ] Mobile shortcut opens to `/client/login`.
- [ ] Client still needs email/password after using the shortcut.

## Final Sign-Off

- [ ] Admin onboarding passed.
- [ ] Client login passed.
- [ ] Request submission passed.
- [ ] Document request passed.
- [ ] Document upload passed.
- [ ] ClickUp integration passed.
- [ ] Webhook sync passed.
- [ ] Internal error review passed.
- [ ] Mobile test passed.
- [ ] Email-dependent client notifications remain paused.
- [ ] Automated invite emails remain paused.
- [ ] Resend production sender is not assumed active until Younity email is reactivated.
- [ ] Zoho Books remains inactive.
- [ ] Actual invoices remain manual/outside the portal for now.
- [ ] QA owner signs off.
- [ ] Launch decision recorded.

