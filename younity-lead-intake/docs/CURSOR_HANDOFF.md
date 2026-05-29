# Younity Lead Intake — Cursor / Codex Handoff

> **Purpose:** This document is the single source of truth for AI-assisted development on this codebase. Read it fully before writing a single line. Every prompt in this file has been engineered to produce correct, safe, production-ready output that matches the existing patterns exactly.

---

## 1. Stack & Key Conventions

| Topic | Detail |
|-------|--------|
| Framework | Next.js (App Router). Server components by default. `"use client"` only when you need state or event handlers. |
| Language | TypeScript strict. No `any`. No unsafe casts unless absolutely necessary. |
| Styling | Tailwind CSS v4. All classes must exist in core Tailwind — no arbitrary values that require a compiler pass unless already used in the codebase. |
| Database | Supabase Postgres. All server queries use `createAdminClient()` from `@/lib/supabase/admin`. Never use the service role key in a client component. |
| Auth | Supabase Auth. Client portal uses `createClient()` from `@/lib/supabase/server`. Internal admin uses `requireInternalAdmin()` / `requireSuperAdmin()` from `@/lib/internal/adminAuth`. |
| Error logging | Use `logWorkflowError()` from `@/lib/internal/workflowErrors` for any server-side failure that should be visible in the admin Error logs tab. |
| API routes | All internal API routes must call `getInternalAdminUser()` at the top and return `errorResponse` if it is not null. Never trust client-supplied IDs without UUID validation. |
| Links | Always add `prefetch={false}` to `<Link>` components in the internal admin area. |
| Detail panels | Use the `?id=` URL param pattern. Links that open/close panels must have `scroll={false}`. |
| Brand tokens | `#06111f` dark, `#244285` blue, `#50A9C0` teal, `#f6f9fc` bg, `#071a33` sidebar |

### Hard constraints — never violate these

- **Never edit `.env.local`.**
- **Never expose secrets** in client components, logs, or API responses.
- **No ClickUp** — it has been removed. Do not add any ClickUp code, imports, env vars, or references.
- **No Google Sheets** — removed. Do not reintroduce.
- **Zoho Books is the invoicing system.** No other billing platform.
- **Client data must always be scoped** to the logged-in client's `user_id`. Never expose one client's data to another.
- **All internal admin pages and API routes must use admin authorisation** (`requireInternalAdmin` / `getInternalAdminUser`). No exceptions.
- **`SUPABASE_SERVICE_ROLE_KEY` is server-side only.** Never reference it in a client component.
- **Private documents** are stored in the `client-documents` Supabase bucket. Never serve them without a server-side ownership check and a short-lived signed URL.
- **Never expose raw UUIDs** or internal IDs to the client portal UI.

---

## 2. Folder Map

```
app/
  (public)/                  — marketing site (homepage, about, contact, services)
  client/                    — client portal (auth-gated, scoped to logged-in user)
  internal/
    login/                   — admin login form
    logout/                  — route handler that signs out and redirects
    (protected)/             — all internal admin pages (layout.tsx wraps with dark sidebar)
      layout.tsx             — sidebar shell
      internal-sidebar.tsx   — "use client" nav, dark bg-[#071a33]
      internal-ui.tsx        — shared server components: InternalPage, AdminCard, badges, utils
      page.tsx               — Board (kanban) at /internal
      clients/
        page.tsx             — Clients list with filter chips + ?id= detail panel
        [id]/
          page.tsx           — Full client profile page
          client-admin-form.tsx  — "use client" edit form
      documents/
        page.tsx             — Documents list with stats + filter chips
        document-status-form.tsx — "use client" status changer
      requests/
        page.tsx             — Requests list
        [id]/
          page.tsx           — Full request detail page
          request-billing-form.tsx
          request-status-form.tsx
          request-document-form.tsx
          add-client-update-form.tsx
      billing/
        page.tsx             — Invoice table with ?id= detail panel
      analytics/
        page.tsx             — KPIs + SVG charts (no chart library)
      settings/
        page.tsx             — Sub-nav: Notifications / Integrations / Admins / Errors
        invite-admin-form.tsx — "use client" form to invite staff
      onboarding/
        page.tsx             — Add client + recent clients table
        create-client-form.tsx — "use client" form
  api/
    internal/
      onboarding/create-client/route.ts
      clients/[id]/update/route.ts
      documents/[id]/status/route.ts
      documents/[id]/open/route.ts
      requests/[id]/billing/route.ts
      requests/[id]/status/route.ts
      requests/[id]/updates/route.ts
      requests/[id]/request-document/route.ts
      settings/invite-admin/route.ts
      errors/[id]/resolve/route.ts
      errors/[id]/reopen/route.ts
      errors/[id]/retry/route.ts
lib/
  internal/
    adminAuth.ts    — requireInternalAdmin, requireSuperAdmin, getInternalAdminUser
    workflowErrors.ts — logWorkflowError helper
  supabase/
    admin.ts        — createAdminClient (service role)
    server.ts       — createClient (cookie-based session)
    authErrors.ts   — isStaleRefreshTokenError
```

---

## 3. Key Database Tables

```
clients            — id, full_name, email, phone, company, preferred_contact_method,
                     zoho_lead_id, zoho_contact_id, drive_folder_url, user_id,
                     created_at, updated_at

client_requests    — id, client_id, service, status, message, source,
                     billing_type, estimated_fee, deposit_required,
                     amount_paid, balance_due, invoice_status,
                     zoho_books_invoice_id, created_at, updated_at

client_documents   — id, client_id, request_id, document_type, file_name,
                     storage_path, status, uploaded_at

client_invoices    — id, client_id, request_id, invoice_number, amount,
                     status, due_date, zoho_books_invoice_id,
                     billing_type, notes, created_at, updated_at

client_updates     — id, client_id, request_id, title, message,
                     created_by, created_at

internal_admins    — id, email, full_name, role ('admin'|'super_admin'), created_at

workflow_errors    — id, source, severity, message, context (jsonb),
                     related_client_id, related_request_id,
                     resolved, created_at
```

### Allowed status values

| Field | Allowed values |
|-------|----------------|
| `client_requests.status` | `Submitted`, `In Progress`, `Waiting on Client`, `Waiting on Third Party`, `Ready for Review`, `Completed`, `Closed` |
| `client_requests.invoice_status` | `Not Ready`, `Ready for Billing`, `Invoice Drafted`, `Invoice Sent`, `Partially Paid`, `Paid`, `Overdue`, `Cancelled` |
| `client_documents.status` | `Requested`, `Uploaded`, `Approved`, `Rejected`, `Needs Replacement` |
| `client_invoices.status` | `Draft`, `Sent`, `Partially Paid`, `Paid`, `Overdue`, `Cancelled` |

---

## 4. Admin Auth Pattern

**Server component (page):**
```typescript
const admin = await requireInternalAdmin();
if (!admin.isAdmin) return <AccessDenied title="Page Title" />;
// admin.isSuperAdmin — true only for super_admin role
```

**API route:**
```typescript
const { errorResponse, isSuperAdmin } = await getInternalAdminUser();
if (errorResponse) return errorResponse;
// additional super-admin gate:
if (!isSuperAdmin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
```

---

## 5. Pending Work — Execute in Order

### CLEANUP — Do this first (2 files to delete)

These files are orphaned and no longer needed. Delete them:

```
app/internal/(protected)/onboarding/link-auth-user-form.tsx
app/api/internal/onboarding/link-auth-user/route.ts
```

After deleting, run `npx tsc --noEmit` to confirm zero errors.

---

### STEP 5 — Billing Stage 1: Auto-create draft invoice on "Ready for Billing"

**What to build:**
When admin sets `invoice_status = "Ready for Billing"` on a request, the billing API route should automatically create a `client_invoices` record pre-filled with the request's billing data. This removes the need to manually create invoice records.

**Files to modify:**

#### `app/api/internal/requests/[id]/billing/route.ts`

After the `client_requests` table is updated successfully, check whether `invoiceStatus === "Ready for Billing"` and, if so, run an upsert into `client_invoices`.

Insert the following block **after** the successful `client_requests` update (after line ~166, before the `note / visibleToClient` block):

```typescript
// Auto-create draft invoice when status moves to "Ready for Billing"
if (invoiceStatus === "Ready for Billing") {
  const fee = moneyFields.find(([f]) => f === "estimated_fee")?.[1];
  const amount = fee?.provided ? fee.value : null;

  const { error: invoiceInsertError } = await supabaseAdmin
    .from("client_invoices")
    .insert({
      client_id: existingRequest.client_id,
      request_id: existingRequest.id,
      amount: amount ?? null,
      billing_type: billingType ?? null,
      status: "Draft",
      notes: `Auto-created when request "${existingRequest.id}" was marked Ready for Billing.`,
    });

  if (invoiceInsertError) {
    // Non-fatal — log but do not block the billing update response
    console.error("Auto invoice insert failed:", {
      message: invoiceInsertError.message,
      code: invoiceInsertError.code,
    });
    await logWorkflowError({
      source: "billing_auto_invoice",
      severity: "warning",
      message: "Billing status set to Ready for Billing but draft invoice could not be auto-created.",
      context: { error: invoiceInsertError, requestId, clientId: existingRequest.client_id },
      relatedClientId: existingRequest.client_id,
      relatedRequestId: existingRequest.id,
    });
  }
}
```

**Important:** You need to fetch the request's existing `billing_type` and `estimated_fee` from `existingRequest`. Currently `existingRequest` only selects `id, client_id`. Update the lookup query to also select `billing_type, estimated_fee`:

```typescript
// Change the lookup select from:
.select("id, client_id")
// to:
.select("id, client_id, billing_type, estimated_fee")
```

And update the `RequestRecord` type to include:
```typescript
type RequestRecord = {
  id: string;
  client_id: string;
  billing_type: string | null;
  estimated_fee: number | string | null;
};
```

Use `existingRequest.billing_type` and `existingRequest.estimated_fee` as fallbacks when the incoming request body didn't explicitly send those fields. The logic should prefer the incoming body value, falling back to the stored value:

```typescript
const resolvedBillingType =
  (billingType !== undefined ? billingType : existingRequest.billing_type) ?? null;
const resolvedFee =
  (fee?.provided ? fee.value : null) ??
  (typeof existingRequest.estimated_fee === "number"
    ? existingRequest.estimated_fee
    : Number(existingRequest.estimated_fee) || null);
```

After edits, run `npx tsc --noEmit`. Expect zero errors.

**No UI changes needed for Step 5** — the auto-creation is silent. The draft invoice will appear automatically on the Billing page and client profile invoice list.

---

### STEP 6 — Zoho Books Stage 2: "Create in Zoho Books" button

> **Do not start this step until Jonette provides Zoho Books OAuth credentials.**
> When ready, write a new Cursor prompt (save to `docs/CURSOR_ZOHO_BOOKS_STAGE2.md`) covering:
> - OAuth token storage (env vars: `ZOHO_BOOKS_CLIENT_ID`, `ZOHO_BOOKS_CLIENT_SECRET`, `ZOHO_BOOKS_REFRESH_TOKEN`, `ZOHO_BOOKS_ORG_ID`)
> - A server-side token refresh helper at `lib/zoho/booksClient.ts`
> - A `POST /api/internal/invoices/[id]/create-in-zoho` route that calls the Zoho Books Create Invoice API, stores the returned `zoho_books_invoice_id` on the `client_invoices` record, and marks status `Sent`
> - A "Create in Zoho Books" button on the `billing/page.tsx` detail panel, visible only when `status = "Draft"` and `zoho_books_invoice_id` is null

---

### STEP 7 — Zoho Books Stage 3: Webhook payment sync

> **Post-launch.** When Zoho Books webhooks are configured:
> - Route: `POST /api/webhooks/zoho-books`
> - Verify the Zoho webhook signature
> - On `invoice.status.updated` event: look up `client_invoices` by `zoho_books_invoice_id`, update `status` to match
> - On `payment.created`: update `amount_paid` and `balance_due` on the matching `client_requests` row
> - Log all failures to `workflow_errors`

---

### STEP 8 — Twilio WhatsApp production enablement

> **Post-launch.** When Twilio sandbox is upgraded:
> - Complete Meta Business Verification
> - Update `TWILIO_PHONE_NUMBER` env var to the registered number
> - The webhook route already exists at `/api/webhooks/twilio` — confirm it handles inbound messages correctly for the upgraded number

---

## 6. Supabase SQL — Run before deploying Steps 5+

The following migration must be run in the Supabase SQL editor **before** deploying Step 5 code:

```sql
-- Already run: drive_folder_url on clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS drive_folder_url text;

-- Already run: internal_admins table
CREATE TABLE IF NOT EXISTS public.internal_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

-- No additional SQL needed for Step 5 — client_invoices table already exists.
-- Confirm it has these columns (add if missing):
--   billing_type text
--   notes text
```

---

## 7. After Each Step — Verification Checklist

1. `npx tsc --noEmit` — must produce zero output (zero errors)
2. `npx next build` — must complete without errors (run if you changed routing, layouts, or added new pages)
3. Manually check the Supabase query types match the TypeScript types (column names must match exactly)
4. Confirm no `any` types were introduced
5. Confirm no ClickUp/Google Sheets imports were added
6. Confirm all new API routes call `getInternalAdminUser()` and return `errorResponse`

---

## 8. Deployment

- Repository: GitHub (push to `main`)
- Hosting: Vercel (auto-deploys on push to `main`)
- Environment variables: managed in Vercel dashboard — never committed to the repo
- After pushing, monitor the Vercel deployment log and the Supabase dashboard for any unexpected errors

---

## 9. Files to Delete (Orphaned)

| File | Reason |
|------|--------|
| `app/internal/(protected)/onboarding/link-auth-user-form.tsx` | Replaced by auto-invite flow — no longer referenced |
| `app/api/internal/onboarding/link-auth-user/route.ts` | Same — route no longer used |

---

*This document was last updated during the session that completed Steps 1–4 (super admin roles, client onboarding rebuild, employee onboarding form, Google Drive link). Steps 5–8 remain.*
