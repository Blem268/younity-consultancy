# Roadmap

## Completed

- Phase 1 lead intake.
- Client portal phases 1B-1R.
- Public Younity homepage.
- Contact/lead intake form.
- Zoho CRM lead creation.
- ClickUp task creation.
- Google Sheets logging.
- Resend internal and client emails.
- Twilio WhatsApp internal alerts.
- Supabase Auth client portal.
- Client dashboard.
- Client request list and detail pages.
- Client request submission.
- Client document upload.
- Document upload notifications.
- ClickUp document upload comments.
- ClickUp status sync.
- ClickUp billing sync.
- Internal sync controls.
- Client profile update.
- Vercel deployment readiness.
- System documentation and testing checklist.
- Phase 10 security review, data protection, and access control audit.
- Phase 11 rate limiting and public contact form honeypot.
- Phase 11B Supabase-backed production rate limiting.
- Phase 12A Supabase-backed workflow error logging.
- Phase 12B workflow error resolution controls and retry readiness documentation.
- Phase 12C controlled retry actions for safe retryable workflow errors.
- Phase 13 central internal admin dashboard at `/internal`, summarizing workflow errors, requests, documents, billing readiness, and rate-limit records while keeping `/internal/sync` and `/internal/errors` available.
- Phase 14 internal client, request, and document management pages at `/internal/clients`, `/internal/requests`, and `/internal/documents`, including admin-only signed document access.

## Next Recommended Work

- Verify Resend domain and set `RESEND_FROM_EMAIL` to a production sender on that verified domain.
- Move Twilio from sandbox to production WhatsApp setup.
- Keep billing preparation in ClickUp and display synced billing/invoice status in Supabase.
- Handle actual invoicing manually or outside the portal for now.
- Add Cloudflare Turnstile to the public contact form if spam volume increases.
- Add ClickUp webhook automation instead of manual sync.
- Add client document download via signed URLs.
- Add internal edit/actions for safe client profile maintenance if operationally needed.
- Perform multi-client testing.
- Add duplicate Zoho handling.
- Add production monitoring and error tracking.
- Consider Sentry for alerting, release tracking, and error correlation.
- Expand retry payload capture only where it can be done safely without storing secrets.
- Keep Zoho CRM lead creation, ClickUp task creation, Supabase storage uploads, Supabase document metadata inserts, request creation, auth/authorization failures, and validation failures out of automatic retry flows unless a future design adds explicit safeguards.
- Establish periodic key rotation for Supabase, ClickUp, Zoho CRM, Resend, Twilio, and Google Sheets credentials.
