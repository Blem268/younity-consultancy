# ClickUp Workspace Guide

This guide covers how the Younity Consultancy ClickUp workspace is structured, how it connects to the client portal, and how to run operations efficiently using templates, views, and a clear separation between client-facing and internal work.

For technical setup (environment variables, webhook registration, custom field names), see `docs/CLICKUP_WORKFLOW_SETUP.md`.

---

## Workspace Structure

```
Younity Consultancy (Workspace)
└── Space: Client Services
    ├── Folder: Services
    │   ├── List: Client Requests        ← Portal-connected. Do not restructure.
    │   └── List: Service Templates      ← Template tasks only. No real client work here.
    ├── Folder: Internal Operations
    │   ├── List: Team Tasks             ← Internal team work, not visible to clients.
    │   └── List: Recurring Work         ← Monthly/periodic client work tracked internally.
    └── Folder: Leads & Onboarding
        ├── List: New Leads              ← Optional. Zoho CRM is the primary lead system.
        └── List: Client Onboarding      ← Tracks new clients from profile creation to first request.
```

---

## Client Requests List — Portal-Connected

**List ID:** `901713882310`
**Path:** Client Services → Services → Client Requests

This is the only list the client portal ever reads or writes. Every portal request creates a task here. Status changes here sync back to the portal (via webhook or manual sync). Subtasks and checklists here appear as the "Work Progress" steps on the client's request detail page.

### Rules for this list

- Never rename this list or change its ID without a corresponding update to `CLICKUP_LIST_ID` in the deployment environment.
- Keep all task statuses within the supported set (see below).
- Keep all custom field names exactly as documented in `CLICKUP_WORKFLOW_SETUP.md`.
- Do not use this list for internal team tasks or recurring operational work — keep those in the Internal Operations folder.
- Subtask names appear to clients. Write them in plain English with no internal jargon.

### Supported Statuses (in workflow order)

| Status | Meaning |
|---|---|
| Submitted | Request received from the client portal, not yet reviewed. |
| Under Review | The Younity team is reviewing the request and scoping the work. |
| Waiting on Documents | Work is paused until the client uploads requested documents. |
| In Progress | Work is actively being done. |
| Internal Review | Work is complete internally and is being reviewed before delivery. |
| Waiting on Client | A question or action is needed from the client before work can continue. |
| Ready for Billing | Work is done. Billing preparation is in progress. |
| Completed | Work is delivered. Billing is settled or has been agreed. |
| Closed | Request is resolved and archived. |

**Webhook sync:** Status changes post to `/api/webhooks/clickup` and update `client_requests.status` in Supabase automatically. The manual fallback is at `/internal/sync`.

### Custom Fields (required)

See `CLICKUP_WORKFLOW_SETUP.md` for the full field list. The billing fields are particularly important — they sync to Supabase and appear on the client's portal as invoice/billing status.

**Billing fields (sync to portal):**
- Billing Type
- Estimated Fee
- Deposit Required
- Amount Paid
- Balance Due
- Invoice Status
- Invoice ID (generic — not provider-specific)

---

## Service Templates List

**Path:** Client Services → Services → Service Templates

This list holds one template task per service type. It contains no real client work. When a new client request arrives in Client Requests, duplicate the matching template task, rename it to the client's name and service period, and move it into Client Requests.

This is the most important list to maintain well. The subtasks in each template task are what show up as the "Work Progress" steps on the client's portal page. Clear, plain-English subtask names give clients a professional, transparent view of where their work stands.

### Template naming convention

Name each template task clearly so it is easy to find when duplicating:

```
TEMPLATE — Bookkeeping Services
TEMPLATE — Payroll Services
TEMPLATE — General Administration
TEMPLATE — HR Support
TEMPLATE — Tax Services
TEMPLATE — Compliance Services
TEMPLATE — Strategic Management & Advisory
```

### Subtask templates per service

Copy these subtasks exactly into each template task. Subtask names are shown to clients so they must be plain language. Do not include internal notes, tool names, or staff names in subtask titles.

---

#### Bookkeeping Services

1. Receive and review documents
2. Categorise transactions
3. Reconcile accounts
4. Prepare financial report
5. Client review and sign-off

---

#### Payroll Services

1. Confirm employee hours and changes
2. Calculate payroll figures
3. Review deductions and statutory payments
4. Generate payslips
5. Confirm payment and file records

---

#### General Administration

1. Clarify scope and priorities with client
2. Organise correspondence and filing
3. Complete assigned administrative tasks
4. Follow up on outstanding items
5. Confirm completion with client

---

#### HR Support

1. Review HR documentation requirements
2. Prepare employment or onboarding documents
3. Client review and approval
4. File and store signed documents
5. Confirm completion and next steps

---

#### Tax Services

1. Gather income and expense records
2. Review prior filings and carryovers
3. Prepare tax return draft
4. Client review and approval
5. File and confirm submission

---

#### Compliance Services

1. Identify filing and documentation requirements
2. Collect required documents from client
3. Prepare compliance submission
4. Submit and confirm receipt
5. Record and archive confirmation

---

#### Strategic Management & Advisory

1. Clarify goals and decision context
2. Review relevant operational data
3. Prepare advisory summary or recommendation
4. Present and discuss with client
5. Document agreed next steps

---

### How to create a task from a template

1. Open the Service Templates list.
2. Find the template matching the client's service.
3. Click the three-dot menu on the task → **Duplicate**.
4. Rename the duplicated task: `[Client Name] — [Service] — [Period if relevant]`
   Example: `Smith Co. — Bookkeeping Services — Q1 2025`
5. Move the duplicated task to **Client Requests**.
6. Set the status to `Submitted` (or the appropriate current stage).
7. Fill in the client custom fields (Portal Request ID, Client Name, etc.).

---

## Internal Operations Folder

This folder holds all work that is not directly tied to an active client portal request. Keeping it separate prevents internal tasks from appearing in portal-connected views and keeps the Client Requests list clean.

### Team Tasks list

For ad-hoc internal work: system maintenance, staff coordination, process improvements, training, and any operational task that does not belong to a client request.

Suggested statuses: To Do, In Progress, Done.

### Recurring Work list

For periodic client work that runs on a schedule — monthly bookkeeping runs, quarterly payroll reconciliations, annual compliance filings. Create tasks here so the team can track recurring obligations without polluting the Client Requests view.

**Naming convention:**
```
[Client Name] — [Service] — [Period]
Example: Browne Enterprises — Payroll — March 2025
```

When recurring work results in something a client needs to see (e.g. a document to review), it should be linked back or noted in the corresponding Client Requests task.

---

## Leads & Onboarding Folder

### New Leads list (optional)

Zoho CRM is the primary lead management system. A ClickUp leads list is optional — only add it if your team prefers working in ClickUp for initial lead follow-up. If used, move leads to Client Onboarding once they confirm they want to proceed.

### Client Onboarding list

Tracks the setup steps for each new client from profile creation through to their first active request. This sits outside Client Requests so onboarding admin does not appear in the operations view.

**Suggested onboarding task checklist:**

- [ ] Create client profile in Supabase (via `/internal/onboarding`)
- [ ] Create Supabase Auth user account
- [ ] Link Auth user ID to client profile
- [ ] Send login credentials to client manually
- [ ] Confirm client has logged in successfully
- [ ] Confirm profile information is complete (phone, company, contact preference)
- [ ] First request submitted by client

Move the task to Done once the client's first request is active in Client Requests.

---

## Recommended Views

Set these up on the Client Requests list so the team can work efficiently without constantly filtering.

| View | Type | Filter / Group | Purpose |
|---|---|---|---|
| Operations Board | Board | Grouped by status | Day-to-day work management — drag tasks across stages |
| Active Requests | List | Filter: exclude Completed, Closed | All open work at a glance |
| Waiting on Client | List | Filter: status = Waiting on Documents or Waiting on Client | Quick list of requests that need a client response |
| Ready for Billing | List | Filter: status = Ready for Billing | Billing prep queue |
| All Requests | Table | No filter | Full history with custom fields visible for reporting |
| Deadlines | Calendar | Sorted by due date | Timeline view for upcoming work |

---

## Day-to-Day Operations Workflow

### When a new portal request arrives

1. A task is automatically created in Client Requests with status `Submitted`.
2. A Twilio WhatsApp alert is sent to the internal team.
3. Open the task in ClickUp and review the request details (synced from the portal custom fields).
4. Duplicate the matching service template and move it into Client Requests (see template steps above).
5. Set the status to `Under Review` once someone has reviewed it.
6. If documents are needed before starting, use the internal admin page at `/internal/requests/[id]` to request specific documents — this creates a document request row that appears under "Documents Needed" in the client's portal.

### When a client uploads a document

1. The document is stored privately in Supabase Storage.
2. A Twilio WhatsApp alert is sent to the team.
3. A comment is added to the linked ClickUp task automatically.
4. Review the document at `/internal/documents` or `/internal/requests/[id]`.
5. Update the document status (Received, Under Review, Approved, Needs Replacement) from the internal admin page.

### When work is complete

1. Move the ClickUp task to `Internal Review`, then `Ready for Billing`.
2. Fill in the billing preparation fields in ClickUp (Billing Type, Estimated Fee, Invoice Status, etc.).
3. Run a manual billing sync at `/internal/sync` or wait for the webhook to push the update to Supabase.
4. The client sees updated billing/invoice status in their portal.
5. Once billing is settled, move to `Completed`, then `Closed`.

---

## Important Rules Summary

- **Client Requests list ID `901713882310` must never change** without updating `CLICKUP_LIST_ID` in the deployment environment.
- **Subtask names are client-visible** — write them in plain English, no jargon.
- **Do not add Zoho Books** fields or references anywhere in the workspace.
- **Invoice ID field must remain generic** — not provider-specific.
- **All status names must match** the supported status list exactly — the webhook sync is case-sensitive.
- **Keep internal work in the Internal Operations folder**, not in Client Requests.
