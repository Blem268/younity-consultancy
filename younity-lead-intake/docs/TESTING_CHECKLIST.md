# Testing Checklist

Use this checklist for production smoke testing and regression testing after changes.

## A. Public Site

- [ ] Homepage loads.
- [ ] Request a Service button opens `/contact`.
- [ ] Client Portal button opens `/client/login`.
- [ ] Contact page loads.

## B. Lead Intake

- [ ] Submit test lead.
- [ ] Confirm Zoho lead.
- [ ] Confirm ClickUp task.
- [ ] Confirm Google Sheet row.
- [ ] Confirm internal email.
- [ ] Confirm client confirmation email.
- [ ] Confirm WhatsApp alert.
- [ ] Confirm final Zoho status update.

## C. Client Portal Auth

- [ ] Login works.
- [ ] Invalid login fails gracefully.
- [ ] Dashboard loads.
- [ ] Logout works.
- [ ] Unauthenticated dashboard access redirects.

## D. Client Profile

- [ ] Profile loads.
- [ ] Email is read-only.
- [ ] Name, phone, company, and preferred contact method update works.
- [ ] Supabase `clients` row updates.

## E. Client Requests

- [ ] Request list loads.
- [ ] Request detail page loads.
- [ ] New request submission works.
- [ ] Supabase `client_requests` row created.
- [ ] ClickUp task created.
- [ ] Request appears in portal.
- [ ] Timeline update appears.

## F. Documents

- [ ] Document upload page loads.
- [ ] Upload small PDF.
- [ ] Upload small PNG.
- [ ] Metadata row appears in `client_documents`.
- [ ] File appears in private Supabase bucket.
- [ ] No public file URL is shown.
- [ ] Email notification received.
- [ ] WhatsApp notification received.
- [ ] ClickUp comment added.

## G. Billing/Status Sync

- [ ] Change task status in ClickUp.
- [ ] Run internal status sync.
- [ ] Confirm portal status updates.
- [ ] Change billing fields in ClickUp.
- [ ] Run internal billing sync.
- [ ] Confirm portal billing fields update.
- [ ] Confirm `client_updates` entries created.

## H. Security Checks

- [ ] Logged-out user cannot access portal pages.
- [ ] Client cannot access another client's request URL.
- [ ] Internal sync page blocks non-admin emails.
- [ ] Service role key is not exposed in browser.
- [ ] Private file URLs are not exposed.

## I. Deployment Checks

- [ ] Production environment variables are set.
- [ ] Supabase production URL settings are correct.
- [ ] Vercel deployment passes.
- [ ] Resend sender/domain limitations understood.
- [ ] Twilio sandbox/production limitations understood.
