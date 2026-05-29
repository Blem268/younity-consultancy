# Billing Pipeline — Complete Cursor Prompt

> **Read this entire document before writing a single line of code.**
> This is a self-contained, step-by-step implementation spec. Execute the steps in order. Run `npx tsc --noEmit` after every step and fix any errors before continuing.

---

## Context

This is a Next.js 15 App Router project (TypeScript strict, Tailwind CSS v4, Supabase).

**Brand tokens:** `#06111f` dark · `#244285` blue · `#50A9C0` teal · `#f6f9fc` bg · `#071a33` sidebar

**Hard constraints — never violate:**
- No ClickUp, no Google Sheets
- No `any` types
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never in client components
- All internal API routes must call `getInternalAdminUser()` and return `errorResponse` if not null
- All `<Link>` in the internal admin area must have `prefetch={false}`
- Never edit `.env.local`

**The goal:** Build a seamless pipeline so that when a request is marked **Completed**, it automatically flows to billing, creates a draft invoice, appears on the Billing page, and has a full invoice summary page with a **Create Invoice in Zoho Books** button that closes the loop.

---

## The Full Flow Being Built

```
Admin marks request → Completed
         ↓ (auto, same API call)
invoice_status set to "Ready for Billing"
         ↓ (auto, same API call)
Draft client_invoices record created
         ↓
Invoice appears on /internal/billing (filter: Draft)
         ↓
Admin clicks "View full invoice" → /internal/billing/[id]
         ↓
Admin clicks "Create Invoice in Zoho Books"
         ↓
Zoho Books creates invoice, returns zoho_books_invoice_id
         ↓
Portal: invoice_status → "Invoice Sent", invoice status → "Sent"
```

---

## Step 1 — Auto-transition on request completion

**File:** `app/api/internal/requests/[id]/status/route.ts`

### 1a. Update the `RequestRecord` type and lookup query

Change the type:
```typescript
type RequestRecord = {
  id: string;
  client_id: string;
  invoice_status: string | null;
  billing_type: string | null;
  estimated_fee: number | string | null;
};
```

Change the lookup select from:
```typescript
.select("id, client_id")
```
to:
```typescript
.select("id, client_id, invoice_status, billing_type, estimated_fee")
```

### 1b. After the successful `client_requests` status update, add this block

Insert this immediately after the `if (updateError)` block (before the `if (note || visibleToClient)` block):

```typescript
// Auto-billing pipeline: when request is Completed, move to Ready for Billing
// and create a draft invoice if it hasn't been billed yet
if (status === "Completed" && !existingRequest.invoice_status || 
    status === "Completed" && existingRequest.invoice_status === "Not Ready") {

  // Update invoice_status on the request
  const { error: invoiceStatusError } = await supabaseAdmin
    .from("client_requests")
    .update({ invoice_status: "Ready for Billing" })
    .eq("id", existingRequest.id);

  if (invoiceStatusError) {
    console.error("Auto invoice_status update failed:", {
      message: invoiceStatusError.message,
      code: invoiceStatusError.code,
    });
    await logWorkflowError({
      source: "auto_billing_transition",
      severity: "warning",
      message: "Request marked Completed but invoice_status could not be set to Ready for Billing.",
      context: { error: invoiceStatusError, requestId },
      relatedClientId: existingRequest.client_id,
      relatedRequestId: existingRequest.id,
    });
    // Non-fatal — do not block the status update response
  } else {
    // Create draft invoice record
    const fee = typeof existingRequest.estimated_fee === "number"
      ? existingRequest.estimated_fee
      : (existingRequest.estimated_fee ? Number(existingRequest.estimated_fee) : null);

    const { error: invoiceInsertError } = await supabaseAdmin
      .from("client_invoices")
      .insert({
        client_id: existingRequest.client_id,
        request_id: existingRequest.id,
        amount: Number.isFinite(fee ?? NaN) ? fee : null,
        billing_type: existingRequest.billing_type ?? null,
        status: "Draft",
        notes: "Auto-created when request was marked Completed.",
      });

    if (invoiceInsertError) {
      console.error("Auto invoice insert failed:", {
        message: invoiceInsertError.message,
        code: invoiceInsertError.code,
      });
      await logWorkflowError({
        source: "auto_billing_transition",
        severity: "warning",
        message: "Request marked Completed but draft invoice could not be auto-created.",
        context: { error: invoiceInsertError, requestId },
        relatedClientId: existingRequest.client_id,
        relatedRequestId: existingRequest.id,
      });
    }
  }
}
```

**TypeScript check:** `npx tsc --noEmit` — zero errors required before continuing.

---

## Step 2 — Billing list page: add "View full invoice" link in the detail panel

**File:** `app/internal/(protected)/billing/page.tsx`

In the detail panel's Actions section (inside `{/* Actions */}`), add a "View full invoice" primary button **above** the existing "View request" button:

```tsx
{/* Actions */}
<div className="space-y-2 border-t border-slate-100 px-5 py-4">
  {/* NEW: Full invoice page link */}
  <Link
    href={`/internal/billing/${selectedInvoice.id}`}
    prefetch={false}
    className="block w-full rounded-xl bg-[#244285] px-4 py-2.5 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
  >
    View full invoice
  </Link>

  {/* Existing: View request */}
  {selectedInvoice.client_requests?.id ? (
    <Link
      href={`/internal/requests/${selectedInvoice.client_requests.id}`}
      prefetch={false}
      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      View request
    </Link>
  ) : null}

  {/* Existing: View client */}
  {selectedInvoice.clients ? (
    <Link
      href={`/internal/clients?search=${encodeURIComponent(
        selectedInvoice.clients.full_name ||
          selectedInvoice.clients.company ||
          ""
      )}`}
      prefetch={false}
      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      View client
    </Link>
  ) : null}
</div>
```

**TypeScript check:** `npx tsc --noEmit` — zero errors required before continuing.

---

## Step 3 — Create the Zoho Books helper

**Create file:** `lib/zoho/booksClient.ts`

```typescript
/**
 * Zoho Books API client
 * Requires env vars: ZOHO_BOOKS_CLIENT_ID, ZOHO_BOOKS_CLIENT_SECRET,
 *                    ZOHO_BOOKS_REFRESH_TOKEN, ZOHO_BOOKS_ORG_ID
 */

export function isZohoBooksConfigured() {
  return Boolean(
    process.env.ZOHO_BOOKS_CLIENT_ID &&
      process.env.ZOHO_BOOKS_CLIENT_SECRET &&
      process.env.ZOHO_BOOKS_REFRESH_TOKEN &&
      process.env.ZOHO_BOOKS_ORG_ID
  );
}

type ZohoTokenResponse = {
  access_token?: string;
  error?: string;
};

export async function getZohoBooksAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_BOOKS_REFRESH_TOKEN ?? "",
    client_id: process.env.ZOHO_BOOKS_CLIENT_ID ?? "",
    client_secret: process.env.ZOHO_BOOKS_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
  });

  const response = await fetch(
    `https://accounts.zoho.com/oauth/v2/token?${params.toString()}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Zoho token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as ZohoTokenResponse;

  if (!data.access_token) {
    throw new Error(`Zoho token refresh returned no access_token: ${data.error ?? "unknown"}`);
  }

  return data.access_token;
}

export type ZohoLineItem = {
  name: string;
  rate: number;
  quantity: number;
  description?: string;
};

export type CreateZohoInvoiceParams = {
  customerName: string;
  customerEmail: string;
  lineItems: ZohoLineItem[];
  referenceNumber?: string;
  notes?: string;
};

type ZohoCreateInvoiceResponse = {
  code: number;
  message: string;
  invoice?: {
    invoice_id: string;
    invoice_number: string;
    status: string;
  };
};

export async function createZohoInvoice(
  accessToken: string,
  params: CreateZohoInvoiceParams
): Promise<{ invoiceId: string; invoiceNumber: string }> {
  const orgId = process.env.ZOHO_BOOKS_ORG_ID ?? "";

  const body = {
    customer_name: params.customerName,
    contact_persons_details: [{ email: params.customerEmail }],
    reference_number: params.referenceNumber ?? "",
    notes: params.notes ?? "",
    line_items: params.lineItems.map((item) => ({
      name: item.name,
      rate: item.rate,
      quantity: item.quantity,
      description: item.description ?? "",
    })),
  };

  const response = await fetch(
    `https://www.zohoapis.com/books/v3/invoices?organization_id=${orgId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await response.json()) as ZohoCreateInvoiceResponse;

  if (!response.ok || data.code !== 0) {
    throw new Error(
      `Zoho Books create invoice failed: ${data.message ?? response.status}`
    );
  }

  const invoice = data.invoice;

  if (!invoice?.invoice_id) {
    throw new Error("Zoho Books returned no invoice_id.");
  }

  return {
    invoiceId: invoice.invoice_id,
    invoiceNumber: invoice.invoice_number,
  };
}
```

**TypeScript check:** `npx tsc --noEmit` — zero errors required before continuing.

---

## Step 4 — Create the "Create in Zoho Books" API route

**Create file:** `app/api/internal/invoices/[id]/create-in-zoho/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isZohoBooksConfigured,
  getZohoBooksAccessToken,
  createZohoInvoice,
} from "@/lib/zoho/booksClient";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

type InvoiceRecord = {
  id: string;
  client_id: string;
  request_id: string | null;
  amount: number | string | null;
  billing_type: string | null;
  status: string | null;
  zoho_books_invoice_id: string | null;
  clients: {
    full_name: string | null;
    email: string | null;
    company: string | null;
  } | null;
  client_requests: {
    id: string;
    service: string | null;
    invoice_status: string | null;
  } | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await getInternalAdminUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const invoiceId = typeof id === "string" ? id.trim() : "";

  if (!invoiceId || !isUuid(invoiceId)) {
    return NextResponse.json({ message: "Invalid invoice ID." }, { status: 400 });
  }

  if (!isZohoBooksConfigured()) {
    return NextResponse.json(
      {
        message:
          "Zoho Books is not yet configured. Add ZOHO_BOOKS_CLIENT_ID, ZOHO_BOOKS_CLIENT_SECRET, ZOHO_BOOKS_REFRESH_TOKEN, and ZOHO_BOOKS_ORG_ID to your environment variables.",
      },
      { status: 503 }
    );
  }

  const supabaseAdmin = createAdminClient();

  const { data: invoice, error: lookupError } = await supabaseAdmin
    .from("client_invoices")
    .select(
      "id, client_id, request_id, amount, billing_type, status, zoho_books_invoice_id, clients(full_name, email, company), client_requests(id, service, invoice_status)"
    )
    .eq("id", invoiceId)
    .maybeSingle<InvoiceRecord>();

  if (lookupError) {
    console.error("create-in-zoho invoice lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    return NextResponse.json(
      { message: "Invoice could not be retrieved." },
      { status: 500 }
    );
  }

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
  }

  if (invoice.zoho_books_invoice_id) {
    return NextResponse.json(
      {
        message: "This invoice has already been created in Zoho Books.",
        zohoInvoiceId: invoice.zoho_books_invoice_id,
      },
      { status: 409 }
    );
  }

  const clientName =
    invoice.clients?.full_name ??
    invoice.clients?.company ??
    "Unknown Client";
  const clientEmail = invoice.clients?.email ?? "";
  const serviceName = invoice.client_requests?.service ?? "Younity Consultancy Service";
  const amount =
    typeof invoice.amount === "number"
      ? invoice.amount
      : invoice.amount
        ? Number(invoice.amount)
        : 0;

  let accessToken: string;

  try {
    accessToken = await getZohoBooksAccessToken();
  } catch (err) {
    console.error("Zoho token refresh failed:", err);
    await logWorkflowError({
      source: "zoho_books_create_invoice",
      message: "Zoho Books token refresh failed.",
      context: { invoiceId, error: String(err) },
      relatedClientId: invoice.client_id,
    });
    return NextResponse.json(
      { message: "Could not connect to Zoho Books. Please try again." },
      { status: 502 }
    );
  }

  let zohoInvoiceId: string;
  let zohoInvoiceNumber: string;

  try {
    const result = await createZohoInvoice(accessToken, {
      customerName: clientName,
      customerEmail: clientEmail,
      lineItems: [
        {
          name: serviceName,
          rate: amount,
          quantity: 1,
          description: invoice.billing_type ?? "",
        },
      ],
      referenceNumber: invoiceId,
      notes: `Younity Consultancy – ${serviceName}`,
    });
    zohoInvoiceId = result.invoiceId;
    zohoInvoiceNumber = result.invoiceNumber;
  } catch (err) {
    console.error("Zoho Books create invoice failed:", err);
    await logWorkflowError({
      source: "zoho_books_create_invoice",
      message: "Zoho Books invoice creation failed.",
      context: { invoiceId, clientId: invoice.client_id, error: String(err) },
      relatedClientId: invoice.client_id,
    });
    return NextResponse.json(
      { message: "Zoho Books invoice could not be created. Please try again." },
      { status: 502 }
    );
  }

  // Update client_invoices with Zoho ID and new status
  const { error: updateInvoiceError } = await supabaseAdmin
    .from("client_invoices")
    .update({
      zoho_books_invoice_id: zohoInvoiceId,
      invoice_number: zohoInvoiceNumber,
      status: "Sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (updateInvoiceError) {
    console.error("client_invoices post-zoho update failed:", {
      message: updateInvoiceError.message,
      code: updateInvoiceError.code,
    });
    // Non-fatal: Zoho invoice was created — log but return the ID
    await logWorkflowError({
      source: "zoho_books_create_invoice",
      severity: "warning",
      message: "Zoho invoice created but local invoice record could not be updated.",
      context: { invoiceId, zohoInvoiceId, error: updateInvoiceError },
      relatedClientId: invoice.client_id,
    });
  }

  // Update client_requests.invoice_status → "Invoice Sent"
  if (invoice.request_id) {
    const { error: updateRequestError } = await supabaseAdmin
      .from("client_requests")
      .update({
        invoice_status: "Invoice Sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.request_id);

    if (updateRequestError) {
      console.error("client_requests invoice_status post-zoho update failed:", {
        message: updateRequestError.message,
        code: updateRequestError.code,
      });
      await logWorkflowError({
        source: "zoho_books_create_invoice",
        severity: "warning",
        message: "Zoho invoice created but request invoice_status could not be updated to Invoice Sent.",
        context: { invoiceId, requestId: invoice.request_id, error: updateRequestError },
        relatedClientId: invoice.client_id,
        relatedRequestId: invoice.request_id,
      });
    }
  }

  return NextResponse.json({
    success: true,
    zohoInvoiceId,
    zohoInvoiceNumber,
    message: `Invoice ${zohoInvoiceNumber} created in Zoho Books.`,
  });
}
```

**TypeScript check:** `npx tsc --noEmit` — zero errors required before continuing.

---

## Step 5 — Create the invoice summary page

**Create file:** `app/internal/(protected)/billing/[id]/page.tsx`

This is a full server-component page. It shows a complete invoice summary and includes the `CreateInZohoButton` (defined in Step 6 below).

```typescript
import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isZohoBooksConfigured } from "@/lib/zoho/booksClient";
import {
  AccessDenied,
  AdminCard,
  EmptyCard,
  formatDate,
  formatDateTime,
  formatMoney,
  InternalPage,
  isUuid,
  logInternalQueryError,
  MutedBadge,
  StatusBadge,
  InvoiceStatusBadge,
} from "../../internal-ui";
import { CreateInZohoButton } from "./create-in-zoho-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

type InvoiceDetailRecord = {
  id: string;
  client_id: string;
  request_id: string | null;
  invoice_number: string | null;
  amount: number | string | null;
  billing_type: string | null;
  status: string | null;
  due_date: string | null;
  zoho_books_invoice_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  clients: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  } | null;
  client_requests: {
    id: string;
    service: string | null;
    status: string | null;
    billing_type: string | null;
    estimated_fee: number | string | null;
    deposit_required: number | string | null;
    amount_paid: number | string | null;
    balance_due: number | string | null;
    invoice_status: string | null;
  } | null;
};

function getStatusColor(status: string | null) {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Overdue":
      return "bg-red-100 text-red-700 border-red-200";
    case "Sent":
      return "bg-blue-100 text-[#244285] border-blue-200";
    case "Partial":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Invoice Detail" />;
  }

  const { id } = await params;
  const invoiceId = typeof id === "string" ? id.trim() : "";

  if (!isUuid(invoiceId)) {
    return (
      <InternalPage active="billing" title="Invoice Detail">
        <section className="py-8">
          <EmptyCard>Invalid invoice ID.</EmptyCard>
        </section>
      </InternalPage>
    );
  }

  const supabaseAdmin = createAdminClient();

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("client_invoices")
    .select(
      "id, client_id, request_id, invoice_number, amount, billing_type, status, due_date, zoho_books_invoice_id, notes, created_at, updated_at, clients(id, full_name, email, phone, company), client_requests(id, service, status, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, invoice_status)"
    )
    .eq("id", invoiceId)
    .maybeSingle<InvoiceDetailRecord>();

  if (invoiceError) {
    logInternalQueryError("Invoice detail lookup", invoiceError);
  }

  if (!invoice) {
    return (
      <InternalPage
        active="billing"
        title="Invoice Detail"
        actions={
          <Link
            href="/internal/billing"
            prefetch={false}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to billing
          </Link>
        }
      >
        <section className="py-8">
          <EmptyCard>Invoice not found.</EmptyCard>
        </section>
      </InternalPage>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    !!invoice.due_date &&
    invoice.due_date < today &&
    invoice.status !== "Paid" &&
    invoice.status !== "Cancelled";
  const displayStatus = isOverdue ? "Overdue" : (invoice.status ?? "Draft");
  const zohoConfigured = isZohoBooksConfigured();
  const canCreateInZoho =
    invoice.status === "Draft" && !invoice.zoho_books_invoice_id;

  return (
    <InternalPage
      active="billing"
      title={invoice.invoice_number ?? "Draft Invoice"}
      description={`Invoice for ${invoice.clients?.full_name ?? invoice.clients?.company ?? "client"}`}
      actions={
        <Link
          href="/internal/billing"
          prefetch={false}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to billing
        </Link>
      }
    >
      {/* Status + Zoho action bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(
              displayStatus
            )}`}
          >
            {displayStatus}
          </span>
          {invoice.billing_type ? (
            <MutedBadge>{invoice.billing_type}</MutedBadge>
          ) : null}
          <span className="text-2xl font-black text-[#06111f]">
            {formatMoney(invoice.amount)}
          </span>
          {invoice.due_date ? (
            <span
              className={`text-sm ${
                isOverdue ? "font-semibold text-red-600" : "text-slate-500"
              }`}
            >
              Due {formatDate(invoice.due_date)}
            </span>
          ) : null}
        </div>

        {/* Zoho Books action */}
        {invoice.zoho_books_invoice_id ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Zoho Books ID</span>
            <span className="rounded bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">
              {invoice.zoho_books_invoice_id}
            </span>
          </div>
        ) : canCreateInZoho ? (
          <CreateInZohoButton
            invoiceId={invoice.id}
            zohoConfigured={zohoConfigured}
          />
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Client card */}
        <AdminCard title="Client" description="Portal profile linked to this invoice.">
          {invoice.clients ? (
            <dl className="mt-4 space-y-3">
              {[
                ["Name", invoice.clients.full_name ?? "—"],
                ["Email", invoice.clients.email ?? "—"],
                ["Phone", invoice.clients.phone ?? "—"],
                ["Company", invoice.clients.company ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-800 break-words">
                    {value}
                  </dd>
                </div>
              ))}
              <div className="pt-2">
                <Link
                  href={`/internal/clients/${invoice.clients.id}`}
                  prefetch={false}
                  className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                >
                  View client profile →
                </Link>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Client data unavailable.</p>
          )}
        </AdminCard>

        {/* Linked request card */}
        <AdminCard
          title="Linked Request"
          description="The service request this invoice was generated from."
        >
          {invoice.client_requests ? (
            <div className="mt-4 space-y-4">
              <div>
                <Link
                  href={`/internal/requests/${invoice.client_requests.id}`}
                  prefetch={false}
                  className="text-base font-semibold text-[#244285] transition hover:text-[#06111f]"
                >
                  {invoice.client_requests.service ?? "View request"}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  {invoice.client_requests.status ? (
                    <StatusBadge>{invoice.client_requests.status}</StatusBadge>
                  ) : null}
                  {invoice.client_requests.invoice_status ? (
                    <InvoiceStatusBadge>
                      {invoice.client_requests.invoice_status}
                    </InvoiceStatusBadge>
                  ) : null}
                </div>
              </div>

              {/* Billing breakdown */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Billing breakdown
                </p>
                <div className="space-y-2">
                  {[
                    ["Billing type", invoice.client_requests.billing_type ?? "—"],
                    ["Estimated fee", formatMoney(invoice.client_requests.estimated_fee)],
                    ["Deposit required", formatMoney(invoice.client_requests.deposit_required)],
                    ["Amount paid", formatMoney(invoice.client_requests.amount_paid)],
                    ["Balance due", formatMoney(invoice.client_requests.balance_due)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No linked request.</p>
          )}
        </AdminCard>
      </div>

      {/* Notes + metadata */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {invoice.notes ? (
          <AdminCard title="Notes" description="Internal notes on this invoice.">
            <p className="mt-4 text-sm leading-6 text-slate-600">{invoice.notes}</p>
          </AdminCard>
        ) : null}

        <AdminCard title="Record info" description="Timestamps and internal reference.">
          <dl className="mt-4 space-y-3">
            {[
              ["Invoice ID", invoiceId],
              ["Created", formatDateTime(invoice.created_at)],
              ["Updated", formatDateTime(invoice.updated_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {label}
                </dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-slate-600">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </AdminCard>
      </div>
    </InternalPage>
  );
}
```

**TypeScript check:** `npx tsc --noEmit` — zero errors required before continuing.

---

## Step 6 — Create the "Create in Zoho Books" client button

**Create file:** `app/internal/(protected)/billing/[id]/create-in-zoho-button.tsx`

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateInZohoButton({
  invoiceId,
  zohoConfigured,
}: {
  invoiceId: string;
  zohoConfigured: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  if (!zohoConfigured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-amber-800">
          Zoho Books not configured
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Add ZOHO_BOOKS_* env vars to enable.
        </p>
      </div>
    );
  }

  async function handleCreate() {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    const response = await fetch(`/api/internal/invoices/${invoiceId}/create-in-zoho`, {
      method: "POST",
    });

    const result = (await response.json()) as {
      message?: string;
      zohoInvoiceNumber?: string;
    };

    setMessage(result.message ?? "An unexpected error occurred.");
    setIsError(!response.ok);
    setIsLoading(false);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {message ? (
        <p
          className={`text-xs font-medium ${
            isError ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#06111f] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isLoading ? (
          "Creating..."
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5Z" fill="currentColor" opacity="0.9" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Create invoice in Zoho Books
          </>
        )}
      </button>
    </div>
  );
}
```

**Final TypeScript check:** `npx tsc --noEmit` — must be zero errors.

**Then run:** `npx next build` — must complete without errors.

---

## Step 7 — Verify end-to-end

1. Open a test request that is `In Progress` with `invoice_status = "Not Ready"`
2. Change its status to `Completed` using the admin status form
3. Confirm the request now shows `invoice_status = "Ready for Billing"` on the request detail page
4. Go to `/internal/billing` → filter to "Draft" → the new invoice should appear
5. Click the invoice row → the side panel appears → click "View full invoice"
6. Confirm the `/internal/billing/[id]` page loads with all client, request, and billing data
7. If Zoho Books env vars are **not set**: the page shows the amber "not configured" notice — correct
8. If Zoho Books env vars **are set**: the "Create invoice in Zoho Books" button is live

---

## Step 8 — Required environment variables for Zoho Books (add when ready)

Add these to Vercel environment variables and your `.env.local` (never commit `.env.local`):

```
ZOHO_BOOKS_CLIENT_ID=your_client_id
ZOHO_BOOKS_CLIENT_SECRET=your_client_secret
ZOHO_BOOKS_REFRESH_TOKEN=your_refresh_token
ZOHO_BOOKS_ORG_ID=your_org_id
```

How to get these:
1. Log in to [Zoho API Console](https://api-console.zoho.com/)
2. Create a "Self Client" application
3. Grant scope: `ZohoBooks.invoices.CREATE,ZohoBooks.contacts.READ`
4. Generate a refresh token using the Self Client flow
5. Find your Org ID in Zoho Books → Settings → Organisation Profile

---

## Checklist Before Pushing

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx next build` — no errors
- [ ] No `any` types introduced
- [ ] All new API routes call `getInternalAdminUser()` and return `errorResponse`
- [ ] No ClickUp or Google Sheets references added
- [ ] No `.env.local` edited
- [ ] `isUuid()` validation on every route that takes an ID param
