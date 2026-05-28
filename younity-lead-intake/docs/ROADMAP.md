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
- Phase 15 controlled internal admin actions for request status updates, manual billing/invoice status updates, client-visible update notes, selected client profile edits, document review status changes, and additional document requests.
- Phase 17 internal admin UX polish for `/internal`, `/internal/clients`, `/internal/clients/[id]`, `/internal/requests`, `/internal/requests/[id]`, `/internal/documents`, `/internal/sync`, and `/internal/errors`, including a shared internal navigation shell, clearer cards, mobile-friendly list views, improved filters, better empty states, and safer workflow error context display.
- Phase 18 ClickUp webhook automation for task status and billing field changes, with `/api/webhooks/clickup`, admin-only webhook registration from `/internal/sync`, and Supabase-backed idempotency in `public.clickup_webhook_events`.
- Phase 19 structured document request workflow: admin document requests now create `client_documents` rows with `status = Requested`, clients upload directly against requested rows, existing private storage and upload notifications continue, and admins can review with Requested, Submitted, Received, Under Review, Approved, Rejected, and Needs Replacement statuses.
- Phase 20 unified the public website, contact intake, client portal, task workspace, document surfaces, and internal admin area with the actual blue-themed Younity Consultancy website branding, including shared `#06111f`, `#071a33`, `#244285`, `#50A9C0`, and `#f6f9fc` visual tokens, standardized status badges, consistent cards/buttons/forms/navigation, mobile polish, and accessible focus states.
- Phase 21 premium UI polish for the official website, contact intake, client portal, task workspace, and internal admin area, including official logo usage, refined blue gradients, stronger card elevation, premium dashboard/stat cards, polished forms/buttons, dark table headers, clearer empty states, and brand-aligned status badges without backend workflow changes.
- Phase 22 client onboarding flow at `/internal/onboarding`: admins can manually create client portal profiles, link existing profiles to Supabase Auth user IDs, review recent unlinked/onboarded clients, and clients see an onboarding checklist on their dashboard. Email invitations remain paused until Younity email services are reactivated; admins manually create users in Supabase Authentication and link `clients.user_id`.
- Phase 23 simplified the client dashboard for non-technical clients with a clearer welcome section, next-best-action guidance, plain-language request/document/profile cards, friendlier recent updates, a lower-priority getting-started checklist, and mobile-first action buttons without changing backend workflows.
- Phase 25 client portal launch operations documentation: created the Client Portal Launch Checklist, Client Portal SOP, and Troubleshooting Guide for internal staff operation without codebase knowledge.
- Phase 26 ClickUp workflow alignment: standardized the Client Services -> Services -> Client Requests list as the portal operations hub, documented list ID `901713882310`, aligned request statuses and custom field names, kept generic Invoice ID terminology, and added a safe internal setup checklist while preserving manual sync fallback.
- Phase 27 architectural pivot: removed ClickUp and Google Sheets from the integration stack. The custom Younity Operations backend (under `app/internal/`) is now the sole request and task management layer, backed entirely by Supabase. Zoho Books reinstated as the invoicing and billing system, replacing ClickUp billing fields. Twilio expanded from internal-only alerts to two-way client-facing WhatsApp messaging. Resend retained for transactional email. Updated `.cursorrules`, `ENVIRONMENT_VARIABLES.md`, and created `docs/NEW_ARCHITECTURE.md`.

## Next Recommended Work

- Remove ClickUp integration code: task creation route, webhook receiver (`/api/webhooks/clickup`), status sync, billing sync, setup check endpoint, and all ClickUp env var references.
- Remove Google Sheets lead logging integration code.
- Build Zoho Books integration: OAuth token refresh, invoice creation on request completion, invoice status sync into Supabase `client_requests`.
- Upgrade Twilio to a production Business WhatsApp number (move off sandbox).
- Build outbound client WhatsApp notifications for key events: request status changes, document requests, invoice ready.
- Build inbound Twilio webhook (`/api/webhooks/twilio`) to receive client WhatsApp replies and forward to the internal team.
- Verify Resend domain and set `RESEND_FROM_EMAIL` to a production sender on the verified domain.
- Keep automated client onboarding invitations paused until Younity email services are reactivated; use manual login instructions after linking the Supabase Auth user ID.
- Build the Younity Operations backend pages: Clients, Requests, Documents, Billing, Analytics, Settings (designs completed in Phase 27).
- Use the Phase 25 launch checklist, SOP, and troubleshooting guide for staff training and launch readiness.
- Add Cloudflare Turnstile to the public contact form if spam volume increases.
- Continue using private signed URL document access only for uploaded files.
- Perform multi-client testing.
- Add duplicate Zoho CRM lead handling.
- Add production monitoring and error tracking; consider Sentry for alerting and error correlation.
- Establish periodic key rotation for Supabase, Zoho CRM, Zoho Books, Resend, and Twilio credentials.
