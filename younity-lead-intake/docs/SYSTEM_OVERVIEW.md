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

ClickUp is the main operations application. Website leads and portal requests create ClickUp tasks. Internal task status and billing preparation fields sync back into Supabase for portal visibility.

### Zoho CRM

Zoho CRM stores lead and client relationship records created from public lead intake.

### Zoho Books

Zoho Books is reserved for future official invoicing and billing workflows. Current billing fields are preparation data synced from ClickUp into Supabase.

### Google Sheets

Google Sheets acts as a backup and logging layer for public lead intake submissions.

### Resend

Resend sends internal lead/request/document notifications and client confirmation emails.

### Twilio WhatsApp

Twilio sends internal WhatsApp alerts for new public leads, portal requests, and document uploads.

### Vercel

Vercel hosts and deploys the Next.js application.

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
