# System Overview

## What This System Does

The Younity Consultancy application supports public lead intake, client portal access, document collection, operations tracking, and internal sync workflows.

The public website lets prospects request services. The client portal lets existing clients log in, submit requests, upload documents, review request status, and update profile information. Internal operations remain centered in ClickUp, with Supabase serving as the client-facing portal layer.

## Main Systems

### Website

The Next.js website provides the public homepage, contact form, and client portal routes. It is hosted on Vercel.

### Supabase

Supabase provides client portal authentication, client-facing tables, request records, update timelines, and private document storage.

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

Internal sync controls require a logged-in user whose email is listed in `INTERNAL_ADMIN_EMAILS`. Direct sync endpoints require `INTERNAL_SYNC_SECRET`.

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

### E. Client Task Progress

```text
Client opens request detail
-> Portal verifies Supabase request ownership
-> ClickUp parent task, subtasks, and checklists are read server-side
-> Portal displays client-facing progress and task steps
```
