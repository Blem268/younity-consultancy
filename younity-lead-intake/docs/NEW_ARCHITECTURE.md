# Younity Consultancy — System Architecture

This document describes the full system architecture as of Phase 27. It supersedes any references to ClickUp or Google Sheets in older documentation.

---

## Overview

The Younity system has three surfaces that share a single Supabase backend:

1. **Public website** — marketing pages and contact/lead intake form.
2. **Client portal** (`/client/`) — where clients log in to submit requests, upload documents, track progress, and view billing status.
3. **Operations backend** (`/internal/`) — where the Younity team manages requests, reviews documents, prepares invoices, and monitors the system.

---

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router (server components by default) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase private storage (`client-documents` bucket) |
| Hosting | Vercel |

---

## Integration Map

```
Lead submits contact form
        │
        ▼
   Zoho CRM ──── creates / updates lead record
        │
        ▼
  Client onboarded manually via /internal/onboarding
        │
        ▼
   Supabase Auth ──── client account created, user_id linked to clients table
        │
        ▼
   Client portal (/client/)
   ├── Submit request ──────────────────────── Supabase client_requests row
   │                                                    │
   │                                                    ▼
   │                                           Twilio WhatsApp ──── outbound to client
   │                                           (+ internal team alert)
   │
   ├── Upload document ─────────────────────── Supabase Storage (private)
   │                                                    │
   │                                                    ▼
   │                                           Twilio WhatsApp ──── internal team alert
   │
   └── View billing / invoice status ──────── synced from Zoho Books via API
   
   Operations backend (/internal/)
   ├── Manage requests (status, notes, documents)
   ├── Review and approve documents
   ├── Prepare and create invoices ──────────── Zoho Books API
   │                                                    │
   │                                                    ▼
   │                                           Invoice status syncs back to Supabase
   │                                           Client sees updated billing in portal
   │
   └── Send client WhatsApp ─────────────────── Twilio (outbound from ops backend)
   
   Inbound WhatsApp replies from clients
        │
        ▼
   /api/webhooks/twilio ──── forwarded to internal team WhatsApp number
```

---

## Integrations

### Supabase
The core data layer. Handles auth, all relational data, and private document storage.

- `clients` — client profiles linked to Supabase Auth `user_id`
- `client_requests` — service requests submitted through the portal
- `client_documents` — document metadata (files stored in `client-documents` bucket)
- `public.rate_limits` — production rate limiting for public write routes
- `public.workflow_errors` — workflow failure logging
- `public.clickup_webhook_events` — legacy table, safe to deprecate

### Zoho CRM
Lead and client relationship management. Receives new leads from the public contact form. Not directly connected to the client portal at runtime — client profiles are managed in Supabase.

### Zoho Books
Invoicing and billing. The operations team creates invoices in Zoho Books once a request is complete. Invoice status (draft, sent, paid, overdue) syncs into `client_requests` in Supabase so clients can see it in the portal.

Key integration points:
- `POST /api/zohobooks/invoices` — create invoice from a completed request
- Zoho Books webhook or scheduled sync — pull invoice status updates into Supabase
- Never expose Zoho Books credentials client-side

### Twilio WhatsApp
Two-way WhatsApp messaging. A Twilio Business WhatsApp number is required (not the sandbox).

**Outbound (Younity → client):**
- Request received confirmation
- Request status updates (in progress, waiting on documents, complete)
- Document request notifications
- Invoice ready / payment reminders

**Inbound (client → Younity):**
- Client replies arrive at `/api/webhooks/twilio`
- Webhook validates the Twilio signature
- Message is forwarded to the internal team WhatsApp number (`WHATSAPP_INTERNAL_TO`)
- Optionally logged to Supabase for audit

### Resend
Transactional email to clients. Currently paused pending domain verification. Do not make any workflow blocking on email until the Younity sending domain is verified in Resend.

---

## Data Flow: New Request

1. Client submits a request in the portal.
2. Supabase `client_requests` row created with `status = Submitted`.
3. Twilio sends an outbound WhatsApp confirmation to the client.
4. Twilio sends an internal WhatsApp alert to the Younity team.
5. Ops team reviews the request in `/internal/requests`.
6. Ops team updates status to `Under Review`, then `In Progress`.
7. If documents are needed, ops team sends a document request — triggers a Twilio WhatsApp to the client.
8. Client uploads documents in the portal; stored in Supabase Storage.
9. Ops team approves documents, completes the work, moves request to `Ready for Billing`.
10. Ops team creates an invoice in Zoho Books.
11. Zoho Books invoice status syncs to Supabase.
12. Client sees billing status updated in the portal.
13. Payment confirmed — request moved to `Completed`.

---

## Security Rules

- All client portal pages verify `supabase.auth.getUser()` and redirect to `/client/login` if no session.
- All Supabase queries for portal data are scoped to the logged-in client's `clients.user_id`.
- All internal pages and API routes verify Supabase Auth AND that the user email is in `INTERNAL_ADMIN_EMAILS`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never used in client components.
- Documents are stored in a private Supabase bucket — always served via short-lived signed URLs after a server-side ownership check.
- Twilio inbound webhooks must validate the `X-Twilio-Signature` header.
- Zoho Books credentials are server-only.
- Rate limiting applied to all public-facing write routes via `public.rate_limits`.
- Workflow failures logged to `public.workflow_errors` — never silently swallowed in production paths.

---

## Removed Integrations

| Integration | Why removed |
| --- | --- |
| ClickUp | Replaced by the custom Younity Operations backend. All request and task management is now in Supabase / `app/internal/`. |
| Google Sheets | Lead intake backup logging removed. Zoho CRM is the primary lead record. |

Do not reintroduce ClickUp or Google Sheets. If a new backup logging requirement arises, log directly to a Supabase table.
