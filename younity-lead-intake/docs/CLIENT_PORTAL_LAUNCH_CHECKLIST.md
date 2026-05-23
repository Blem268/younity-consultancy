# Client Portal Launch Checklist

Use this checklist before launching or relaunching the Younity Consultancy client portal. It is written for internal operators and should be completed without changing application code.

## A. Pre-launch technical checks

- [ ] Vercel deployment is live.
- [ ] Supabase project is active.
- [ ] Supabase Auth works.
- [ ] Client portal login works at `/client/login`.
- [ ] Admin login works at `/internal/login`.
- [ ] Internal admin pages are protected.
- [ ] ClickUp API token works.
- [ ] ClickUp webhooks are registered and working.
- [ ] Google Sheets logging works.
- [ ] Twilio internal alerts work.
- [ ] Workflow error logging works.
- [ ] Rate limiting table is active.
- [ ] Private document storage works.
- [ ] Signed document links work.

## B. Security checks

- [ ] Logged-out users cannot access `/client/dashboard`.
- [ ] Logged-out users cannot access `/internal`.
- [ ] Non-admins cannot access `/internal`.
- [ ] Client A cannot access Client B's request URL.
- [ ] Client A cannot access Client B's document URL.
- [ ] Admin-only routes are protected.
- [ ] No public file URLs are exposed.
- [ ] No secrets are visible in the browser or devtools.

## C. Client experience checks

- [ ] Client can log in.
- [ ] Client sees the simplified dashboard.
- [ ] Client can submit a request.
- [ ] Client can upload a document.
- [ ] Client can see requested documents.
- [ ] Client can open uploaded documents.
- [ ] Client can view request updates.
- [ ] Client can use a mobile home-screen app shortcut.

## D. Internal operations checks

- [ ] Admin can access `/internal`.
- [ ] Admin can create/link a client profile.
- [ ] Admin can view clients.
- [ ] Admin can view requests.
- [ ] Admin can request documents.
- [ ] Admin can review documents.
- [ ] Admin can update request status.
- [ ] Admin can update billing/manual invoice status.
- [ ] Admin can run manual sync.
- [ ] Admin can review workflow errors.
- [ ] Admin can mark errors resolved, reopen errors, and retry safe errors.

## E. Paused items

- [ ] Client-facing automated email notifications are paused.
- [ ] Resend production sender depends on Younity email reactivation.
- [ ] Automated invite emails are paused.
- [ ] Zoho Books is inactive.
- [ ] Payment links are inactive.

