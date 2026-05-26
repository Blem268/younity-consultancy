# ClickUp Workflow Setup

ClickUp is the operations and billing preparation hub for the Younity Client Portal. Supabase remains the client portal, auth, request, document, and client-facing timeline layer. Zoho CRM remains the lead/client relationship system. Zoho Books is inactive and must not be reintroduced.

## Workspace Structure

- Workspace: Younity Consultancy operations workspace
- Space: Client Services
- Folder: Services
- Main list: Client Requests
- Full path: Client Services -> Services -> Client Requests
- List ID: `901713882310`

Set `CLICKUP_LIST_ID=901713882310` so portal-created requests are created in the Client Requests list.

## Recommended Statuses

- Submitted
- Under Review
- Waiting on Documents
- In Progress
- Internal Review
- Waiting on Client
- Ready for Billing
- Completed
- Closed

These statuses sync from ClickUp into `client_requests.status` for portal display. The app does not require a Supabase schema change for these names.

## Recommended Custom Fields

Client / Portal fields:

- Portal Request ID
- Client Name
- Client Email
- Client Phone
- Company
- Service Requested
- Preferred Contact Method
- Urgency
- Source

Document / Workflow fields:

- Document Status
- Integration Status

Billing prep fields:

- Billing Type
- Estimated Fee
- Deposit Required
- Amount Paid
- Balance Due
- Invoice Status
- Invoice ID

Use generic `Invoice ID`. Do not create or use provider-specific invoice ID fields.

## Required Environment Variables

- `CLICKUP_API_TOKEN`
- `CLICKUP_LIST_ID`
- `CLICKUP_TEAM_ID`
- `CLICKUP_WEBHOOK_SECRET`

`CLICKUP_API_TOKEN` and `CLICKUP_WEBHOOK_SECRET` are secrets and must stay server-only. Do not expose them in browser-visible variables or documentation.

## How ClickUp Connects To The Portal

Portal request creation:

- A signed-in client submits a portal request.
- Supabase creates a `client_requests` row with `status = Submitted`.
- The app creates a ClickUp task in Client Services -> Services -> Client Requests.
- The ClickUp task ID is saved to `client_requests.clickup_task_id`.

Document uploads:

- Client documents are stored in the private Supabase `client-documents` bucket.
- Metadata is saved in `client_documents`.
- If the request has a ClickUp task ID, the upload adds a ClickUp comment and attempts a ClickUp attachment.
- ClickUp attachment failures do not block Supabase document storage.

Task and subtask progress:

- Client request detail pages read the linked ClickUp task, subtasks, and checklists server-side.
- The portal displays safe task progress without exposing ClickUp API tokens or private ClickUp URLs.
- Client task updates can add comments to ClickUp and optionally mark checklist items or subtasks complete.

Billing sync:

- Billing preparation happens in ClickUp and through internal manual admin fields.
- ClickUp billing fields sync into Supabase for client-facing invoice/billing status.
- Actual invoicing remains manual or outside the portal for now.
- Zoho Books is inactive.

Webhooks:

- ClickUp posts task events to `/api/webhooks/clickup`.
- The route verifies `X-Signature` with `CLICKUP_WEBHOOK_SECRET`.
- Status and billing changes update linked Supabase request records.
- Supabase table `clickup_webhook_events` prevents duplicate processing when ClickUp retries webhook deliveries.

Manual sync fallback:

- Internal admins can use `/internal/sync`.
- Status sync pulls ClickUp task statuses into Supabase.
- Billing sync pulls ClickUp billing preparation fields into Supabase.
- Manual sync remains available if webhook delivery, signature setup, or idempotency setup needs investigation.

## Manual ClickUp Setup Steps

1. Open ClickUp.
2. Confirm or create the Space `Client Services`.
3. Confirm or create the Folder `Services`.
4. Confirm or create the List `Client Requests`.
5. Confirm the list ID is `901713882310`.
6. Add the recommended statuses to the list.
7. Add the recommended custom fields with the exact names above.
8. Confirm `Invoice ID` is generic and no provider-specific invoice ID field is used.
9. Set `CLICKUP_LIST_ID=901713882310` in deployment environment variables.
10. Register or confirm the ClickUp webhook endpoint: `${NEXT_PUBLIC_SITE_URL}/api/webhooks/clickup`.
11. Store the ClickUp webhook signing secret in `CLICKUP_WEBHOOK_SECRET` through a secure deployment workflow.

## Internal Setup Check

Admins can review `/internal/sync` for a ClickUp Setup Checklist. The safe endpoint `/api/internal/clickup/setup-check` checks configured environment variable presence and list ID alignment without returning secrets.

## Testing Checklist

- Submit a test client portal request.
- Confirm a ClickUp task is created in Client Services -> Services -> Client Requests.
- Confirm Supabase `client_requests.clickup_task_id` is populated.
- Upload a test document.
- Confirm the document remains private in Supabase Storage.
- Confirm a ClickUp comment or attachment is added to the linked task.
- Change ClickUp status to each supported workflow status and verify portal display after webhook or manual sync.
- Fill billing preparation fields in ClickUp and verify billing sync updates Supabase.
- Confirm `Invoice ID` syncs and no Zoho Books terminology appears in the ClickUp workflow.
- Confirm `/internal/sync` manual status and billing sync still work.
- Confirm `/api/webhooks/clickup` rejects unsigned or incorrectly signed requests.
