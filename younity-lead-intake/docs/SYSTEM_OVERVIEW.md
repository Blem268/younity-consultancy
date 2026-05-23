# System Overview

## What This System Does

The Younity Consultancy application supports public lead intake, client portal access, document collection, operations tracking, and internal sync workflows.

The public website lets prospects request services. The client portal lets existing clients log in, submit requests, upload documents, review request status, and update profile information. Internal operations remain centered in ClickUp, with Supabase serving as the client-facing portal layer.

## Main Systems

### Website

The Next.js website provides the public homepage, contact form, and client portal routes. It is hosted on Vercel.

### Supabase

Supabase provides client portal authentication, client-facing tables, request records, update timelines, private document storage, production rate limiting, sanitized internal workflow error logs, and controlled internal admin mutations for lightweight portal visibility updates.

### ClickUp

ClickUp is the main operations and billing preparation hub. Website leads and portal requests create ClickUp tasks. Internal task status and billing preparation fields sync back into Supabase for portal visibility.

ClickUp remains the source of truth for operational task status, subtasks, and checklists. Client request detail pages pull a safe, client-facing task progress view from ClickUp without exposing private ClickUp links or API details.

### Zoho CRM

Zoho CRM stores lead and client relationship records created from public lead intake.

### Zoho Books

Zoho Books integration is not active. Billing preparation remains ClickUp-based, Supabase displays client-facing billing/invoice status synced from ClickUp, and any actual invoicing is handled manually or outside the portal for now.

### Google Sheets

Google Sheets acts as a backup and logging layer for public lead intake submissions.

### Resend

Resend sends internal lead/request/document notifications and client confirmation emails.

### Twilio WhatsApp

Twilio sends internal WhatsApp alerts for new public leads, portal requests, and document uploads.

### Vercel

Vercel hosts and deploys the Next.js application.

## Security Posture

Client portal routes use Supabase Auth and resolve each portal user through `clients.user_id`. Client-facing request, document, invoice, update, and task data is scoped to that client profile before display or mutation.

Private documents are stored in the private `client-documents` Supabase bucket. The portal opens documents through a server route that verifies ownership before issuing a short-lived signed URL.

The central internal dashboard at `/internal`, internal client/request/document management pages, internal sync controls, and workflow error review pages require a logged-in user whose email is listed in `INTERNAL_ADMIN_EMAILS`. Internal pages share a mobile-friendly admin navigation shell for Dashboard, Clients, Requests, Documents, Sync Controls, and Workflow Errors. Direct sync endpoints require `INTERNAL_SYNC_SECRET`.

Public lead intake, portal write APIs, document upload, task updates, and internal sync wrapper routes use lightweight server-side rate limiting. Production rate limiting is backed by Supabase table `public.rate_limits`; deployments must run `supabase/rate_limits.sql` manually in the Supabase SQL Editor.

Production workflow failures are written to Supabase table `public.workflow_errors` through a server-side helper that sanitizes context before insert. Admin users can review operational health at `/internal`, including workflow error counts, recent client requests, recent document uploads, billing readiness, and active rate-limit records. Admin users can review and lightly manage clients at `/internal/clients`, requests at `/internal/requests`, and documents at `/internal/documents` without using Supabase tables directly. Phase 17 polished these internal admin pages with clearer cards, badges, search/filter controls, mobile-friendly list cards, stronger empty states, and grouped request-detail action areas. Admin users can review the latest workflow errors at `/internal/errors`, filter by status/source/severity/retryability, mark errors resolved, reopen resolved errors, retry safe retryable errors when safe context is available, and store resolution notes.

The public contact form includes a hidden honeypot field. Cloudflare Turnstile is not active and remains a future option if spam increases.

Zoho Books is not active. ClickUp remains the operations and billing preparation hub, while Supabase displays synced client-facing billing and invoice status. Actual invoicing is handled manually or outside the portal for now.

## High-Level Workflows

### A. Public Lead Intake

```text
Website contact form
-> Zoho CRM lead
-> ClickUp task
-> Google Sheet log
-> Internal email
-> Client confirmation email
-> Internal WhatsApp
-> Zoho final status update
```

### B. Client Portal Request

```text
Client login
-> Submit portal request
-> Supabase client_requests row
-> ClickUp task
-> Supabase updated with ClickUp task ID
-> Internal email
-> Internal WhatsApp
-> Client sees request in portal
```

### C. Document Upload

```text
Client uploads document
-> Supabase private storage
-> client_documents metadata
-> Internal email
-> Internal WhatsApp
-> ClickUp task comment
```

### D. Operations Sync

```text
ClickUp status/billing updates
-> Internal sync controls
-> Supabase client_requests updated
-> client_updates timeline entries
-> Client sees latest portal status/billing
```

### D2. Internal Client Operations Review

```text
Admin opens /internal
-> Admin reviews /internal/clients, /internal/requests, or /internal/documents
-> Supabase server-side admin queries load portal records
-> Admin opens private documents through /api/internal/documents/[id]/open
-> Short-lived signed Supabase Storage URL is issued after admin check
```

Phase 17 improved the internal admin experience without changing public lead intake, client portal behavior, ClickUp integrations, Zoho CRM integrations, Resend/Twilio behavior, Supabase schema, or workflow retry behavior. ClickUp remains the operations and billing preparation hub. Email-dependent notification work remains paused until the production Younity email domain is reactivated and verified.

### D3. Controlled Internal Admin Actions

```text
Admin opens an internal management page
-> Supabase Auth and INTERNAL_ADMIN_EMAILS are checked
-> Admin updates request status, manual billing fields, client profile fields, or document review status
-> Server API route validates UUIDs, allowed values, and allowed fields
-> Supabase portal tables are updated server-side
-> Relevant client_updates timeline entries are added for client-visible updates
```

Phase 15 added controlled admin actions for portal visibility and lightweight management only. Request status, manual billing/invoice status, client-visible update notes, selected client profile fields, document review status, and additional document requests are handled through admin-only API routes. ClickUp remains the operations and billing preparation hub. Zoho Books remains inactive and no Zoho Books calls are made.

### E. Workflow Error Review

```text
Workflow failure
-> Sanitized public.workflow_errors row
-> Admin sees summarized health at /internal
-> Admin reviews /internal/errors
-> Admin marks resolved with optional note
-> Admin can reopen if follow-up is needed
-> Admin can retry safe retryable errors with stored safe context
```

Controlled retry actions are available only to internal admins for safe retryable failures: Google Sheets logging, Resend notifications, Twilio WhatsApp notifications, and ClickUp comments or attachments. A retry requires an explicit safe `context.retryPayload`; secrets are never stored in workflow error context. Zoho CRM lead creation, ClickUp task creation, Supabase storage uploads, Supabase metadata inserts, request creation, auth failures, authorization failures, and validation failures remain manual to avoid duplicate records or unsafe replay.

### F. Client Task Progress

```text
Client opens request detail
-> Portal verifies Supabase request ownership
-> ClickUp parent task, subtasks, and checklists are read server-side
-> Portal displays client-facing progress and task steps
```
