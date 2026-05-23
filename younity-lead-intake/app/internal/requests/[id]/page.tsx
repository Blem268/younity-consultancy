import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddClientUpdateForm } from "./add-client-update-form";
import { RequestBillingForm } from "./request-billing-form";
import { RequestDocumentForm } from "./request-document-form";
import { RequestStatusForm } from "./request-status-form";
import {
  AccessDenied,
  clientLabel,
  EmptyCard,
  formatDate,
  formatDateTime,
  formatMoney,
  InternalPage,
  isUuid,
  logInternalQueryError,
  MutedBadge,
  StatusBadge,
} from "../../internal-ui";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RequestRecord = {
  id: string;
  client_id: string;
  service: string;
  status: string;
  message: string | null;
  source: string | null;
  clickup_task_id: string | null;
  billing_type: string | null;
  estimated_fee: number | string | null;
  deposit_required: number | string | null;
  amount_paid: number | string | null;
  balance_due: number | string | null;
  invoice_status: string | null;
  zoho_books_invoice_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  clients: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    preferred_contact_method: string | null;
  } | null;
};

type DocumentRecord = {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string | null;
};

type UpdateRecord = {
  id: string;
  title: string;
  message: string;
  created_by: string | null;
  created_at: string | null;
};

type InvoiceRecord = {
  id: string;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
};

export default async function InternalRequestDetailPage({ params }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Internal Request Detail" />;
  }

  const { id } = await params;
  const requestId = typeof id === "string" ? id.trim() : "";

  if (!isUuid(requestId)) {
    return (
      <InternalPage active="requests" title="Internal Request Detail">
        <section className="py-8">
          <EmptyCard>Invalid request ID.</EmptyCard>
        </section>
      </InternalPage>
    );
  }

  const supabaseAdmin = createAdminClient();
  const requestResult = await supabaseAdmin
    .from("client_requests")
    .select(
      "id, client_id, service, status, message, source, clickup_task_id, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, invoice_status, zoho_books_invoice_id, created_at, updated_at, clients(id, full_name, email, phone, company, preferred_contact_method)"
    )
    .eq("id", requestId)
    .maybeSingle<RequestRecord>();

  if (requestResult.error) {
    logInternalQueryError("Internal request detail", requestResult.error);
  }

  const request = requestResult.data;

  if (!request) {
    return (
      <InternalPage
        active="requests"
        title="Internal Request Detail"
        actions={
          <Link
            href="/internal/requests"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
          >
            Back to requests
          </Link>
        }
      >
        <section className="py-8">
          <EmptyCard>Request not found.</EmptyCard>
        </section>
      </InternalPage>
    );
  }

  const [documentsResult, updatesResult, invoicesResult] = await Promise.all([
    supabaseAdmin
      .from("client_documents")
      .select("id, document_type, file_name, status, uploaded_at")
      .eq("request_id", request.id)
      .order("uploaded_at", { ascending: false })
      .returns<DocumentRecord[]>(),
    supabaseAdmin
      .from("client_updates")
      .select("id, title, message, created_by, created_at")
      .eq("request_id", request.id)
      .order("created_at", { ascending: false })
      .returns<UpdateRecord[]>(),
    supabaseAdmin
      .from("client_invoices")
      .select("id, invoice_number, amount, status, due_date")
      .eq("request_id", request.id)
      .order("created_at", { ascending: false })
      .returns<InvoiceRecord[]>(),
  ]);

  if (documentsResult.error) {
    logInternalQueryError("Internal request documents", documentsResult.error);
  }

  if (updatesResult.error) {
    logInternalQueryError("Internal request updates", updatesResult.error);
  }

  if (invoicesResult.error) {
    logInternalQueryError("Internal request invoices", invoicesResult.error);
  }

  const documents = documentsResult.data ?? [];
  const updates = updatesResult.data ?? [];
  const invoices = invoicesResult.data ?? [];

  return (
    <InternalPage
      active="requests"
      title={request.service}
      description="Internal request record with client, document, update, and billing context."
      actions={
        <>
          <Link
            href="/internal/requests"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
          >
            Back to requests
          </Link>
          {request.clients ? (
            <Link
              href={`/internal/clients/${request.clients.id}`}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
            >
              View client
            </Link>
          ) : null}
          <Link
            href="/internal/sync"
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Run sync controls
          </Link>
        </>
      }
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Request Details</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Status", request.status],
              ["Invoice Status", request.invoice_status || "Not available"],
              ["Source", request.source || "Not available"],
              ["ClickUp Task ID", request.clickup_task_id || "Not available"],
              ["Billing Type", request.billing_type || "Not available"],
              ["Estimated Fee", formatMoney(request.estimated_fee)],
              ["Deposit Required", formatMoney(request.deposit_required)],
              ["Amount Paid", formatMoney(request.amount_paid)],
              ["Balance Due", formatMoney(request.balance_due)],
              ["Invoice ID", request.zoho_books_invoice_id || "Not available"],
              ["Created", formatDateTime(request.created_at)],
              ["Updated", formatDateTime(request.updated_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {request.message ? (
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Message
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {request.message}
              </p>
            </div>
          ) : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Client Summary</h2>
          {request.clients ? (
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <p className="text-base font-semibold text-slate-950">
                {clientLabel(request.clients)}
              </p>
              <p>{request.clients.email || "Email unavailable"}</p>
              <p>{request.clients.phone || "Phone unavailable"}</p>
              <p>{request.clients.preferred_contact_method || "Preferred contact unavailable"}</p>
              <Link
                href={`/internal/clients/${request.clients.id}`}
                className="inline-flex font-semibold text-teal-700 transition hover:text-teal-900"
              >
                View client profile
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">Client unavailable.</p>
          )}
        </article>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Update Status</h2>
          <RequestStatusForm
            requestId={request.id}
            currentStatus={request.status}
          />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Update Billing</h2>
          <RequestBillingForm
            requestId={request.id}
            billingType={request.billing_type}
            estimatedFee={request.estimated_fee}
            depositRequired={request.deposit_required}
            amountPaid={request.amount_paid}
            balanceDue={request.balance_due}
            invoiceStatus={request.invoice_status}
            invoiceId={request.zoho_books_invoice_id}
          />
        </article>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Add Client Update</h2>
          <AddClientUpdateForm requestId={request.id} />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Request Document</h2>
          <RequestDocumentForm requestId={request.id} />
        </article>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Related Documents</h2>
          {documentsResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Documents are unavailable right now.
            </p>
          ) : documents.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="break-words font-semibold text-slate-950">
                      {document.file_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {document.document_type}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge>{document.status}</StatusBadge>
                      <MutedBadge>{formatDateTime(document.uploaded_at)}</MutedBadge>
                    </div>
                  </div>
                  <Link
                    href={`/api/internal/documents/${document.id}/open`}
                    prefetch={false}
                    className="w-fit rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">No documents found.</p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Update Timeline</h2>
          {updatesResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Updates are unavailable right now.
            </p>
          ) : updates.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {updates.map((update) => (
                <div key={update.id} className="py-4">
                  <p className="font-semibold text-slate-950">{update.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {update.message}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {formatDateTime(update.created_at)} by{" "}
                    {update.created_by || "Younity Consultancy"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">No updates found.</p>
          )}
        </article>
      </section>

      <section className="pb-8">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Invoice Records</h2>
          {invoicesResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Invoice records are unavailable right now.
            </p>
          ) : invoices.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-950">
                    {invoice.invoice_number || "Invoice number pending"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge>{invoice.status || "Status unavailable"}</StatusBadge>
                    <MutedBadge>{formatMoney(invoice.amount)}</MutedBadge>
                    <MutedBadge>Due {formatDate(invoice.due_date)}</MutedBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">
              No invoice records found.
            </p>
          )}
        </article>
      </section>
    </InternalPage>
  );
}
