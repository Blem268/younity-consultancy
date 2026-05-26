import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddClientUpdateForm } from "./add-client-update-form";
import { RequestBillingForm } from "./request-billing-form";
import { RequestDocumentForm } from "./request-document-form";
import { RequestStatusForm } from "./request-status-form";
import { DocumentStatusForm } from "../../documents/document-status-form";
import {
  AccessDenied,
  AdminCard,
  clientLabel,
  DocumentStatusBadge,
  EmptyCard,
  formatDate,
  formatDateTime,
  formatMoney,
  InvoiceStatusBadge,
  InternalPage,
  isUuid,
  logInternalQueryError,
  MutedBadge,
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
  file_path: string;
  status: string;
  notes: string | null;
  uploaded_at: string | null;
  requested_by: string | null;
  requested_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  required: boolean | null;
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

function isDocumentNeeded(document: DocumentRecord) {
  return (
    document.status === "Requested" ||
    document.status === "Needs Replacement" ||
    document.file_path === "pending" ||
    document.file_name === "Pending upload"
  );
}

function isRealUploadedDocument(document: DocumentRecord) {
  return document.file_path !== "pending" && document.file_name !== "Pending upload";
}

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
            prefetch={false}
            className="rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#50A9C0]/10 hover:text-[#06111f]"
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
      .select(
        "id, document_type, file_name, file_path, status, notes, uploaded_at, requested_by, requested_at, reviewed_by, reviewed_at, review_note, required"
      )
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
  const documentsRequested = documents.filter(isDocumentNeeded);
  const uploadedDocuments = documents.filter(
    (document) => document.status !== "Requested" || isRealUploadedDocument(document)
  );

  return (
    <InternalPage
      active="requests"
      title={request.service}
      description="Internal request record with client, document, update, and billing context."
      actions={
        <>
          <Link
            href="/internal/requests"
            prefetch={false}
            className="rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#50A9C0]/10 hover:text-[#06111f]"
          >
            Back to requests
          </Link>
          {request.clients ? (
            <Link
              href={`/internal/clients/${request.clients.id}`}
              prefetch={false}
              className="rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#50A9C0]/10 hover:text-[#06111f]"
            >
              View client
            </Link>
          ) : null}
          <Link
            href="/internal/sync"
            prefetch={false}
            className="rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Run sync controls
          </Link>
        </>
      }
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_0.9fr]">
        <AdminCard
          title="Request Summary"
          description="Operational state, ClickUp task reference, and billing preparation fields."
        >
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
        </AdminCard>

        <AdminCard
          title="Client Summary"
          description="Portal identity and preferred contact context."
        >
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
                prefetch={false}
                className="inline-flex font-semibold text-[#244285] transition hover:text-[#06111f]"
              >
                View client profile
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">Client unavailable.</p>
          )}
        </AdminCard>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <AdminCard
          title="Admin Action: Update Status"
          description="Change the client-visible request status without altering sync behavior."
        >
          <RequestStatusForm
            requestId={request.id}
            currentStatus={request.status}
          />
        </AdminCard>

        <AdminCard
          title="Billing and Manual Invoice Status"
          description="Keep billing preparation fields readable for operations."
        >
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
        </AdminCard>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <AdminCard
          title="Admin Action: Add Client Update"
          description="Post a short update to the client portal timeline."
        >
          <AddClientUpdateForm requestId={request.id} />
        </AdminCard>

        <AdminCard
          title="Admin Action: Request Document"
          description="Ask the client for another document related to this request."
        >
          <RequestDocumentForm requestId={request.id} />
        </AdminCard>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <AdminCard
          title="Documents Requested"
          description="Structured document requests visible to the client portal."
        >
          {documentsResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Documents are unavailable right now.
            </p>
          ) : documentsRequested.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {documentsRequested.map((document) => (
                <div
                  key={document.id}
                  className="py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="break-words font-semibold text-slate-950">
                        {document.document_type}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {document.file_name}
                      </p>
                      {document.notes ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {document.notes}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <DocumentStatusBadge>{document.status}</DocumentStatusBadge>
                        {document.required ? <MutedBadge>Required</MutedBadge> : null}
                        <MutedBadge>Requested {formatDateTime(document.requested_at)}</MutedBadge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Requested by {document.requested_by || "Not available"}
                      </p>
                    </div>
                    {isRealUploadedDocument(document) ? (
                      <Link
                        href={`/api/internal/documents/${document.id}/open`}
                        prefetch={false}
                        className="w-fit rounded-xl bg-[#244285] px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                    <DocumentStatusForm
                      documentId={document.id}
                      currentStatus={document.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard>No document requests are outstanding for this request.</EmptyCard>
          )}
        </AdminCard>

        <AdminCard
          title="Uploaded Documents"
          description="Open files through the secure admin route only."
        >
          {documentsResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Documents are unavailable right now.
            </p>
          ) : uploadedDocuments.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {uploadedDocuments.map((document) => (
                <div key={document.id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="break-words font-semibold text-slate-950">
                        {document.file_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {document.document_type}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <DocumentStatusBadge>{document.status}</DocumentStatusBadge>
                        {document.required ? <MutedBadge>Required</MutedBadge> : null}
                        <MutedBadge>{formatDateTime(document.uploaded_at)}</MutedBadge>
                      </div>
                      {document.review_note ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          Review note: {document.review_note}
                        </p>
                      ) : null}
                      {document.reviewed_at || document.reviewed_by ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Reviewed {formatDateTime(document.reviewed_at)} by{" "}
                          {document.reviewed_by || "Not available"}
                        </p>
                      ) : null}
                    </div>
                    {isRealUploadedDocument(document) ? (
                      <Link
                        href={`/api/internal/documents/${document.id}/open`}
                        prefetch={false}
                        className="w-fit rounded-xl bg-[#244285] px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                    <DocumentStatusForm
                      documentId={document.id}
                      currentStatus={document.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard>No uploaded documents are linked to this request yet.</EmptyCard>
          )}
        </AdminCard>
      </section>

      <section className="pb-8">
        <AdminCard
          title="Update Timeline"
          description="Client-visible notes and internal admin updates for this request."
        >
          {updatesResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Updates are unavailable right now.
            </p>
          ) : updates.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {updates.map((update) => (
                <div key={update.id} className="py-4">
                  <p className="break-words font-semibold text-slate-950">
                    {update.title}
                  </p>
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
            <EmptyCard>No updates have been posted for this request.</EmptyCard>
          )}
        </AdminCard>
      </section>

      <section className="pb-8">
        <AdminCard
          title="Invoice Records"
          description="Manual invoice records currently stored for portal visibility."
        >
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
                    <InvoiceStatusBadge>
                      {invoice.status || "Status unavailable"}
                    </InvoiceStatusBadge>
                    <MutedBadge>{formatMoney(invoice.amount)}</MutedBadge>
                    <MutedBadge>Due {formatDate(invoice.due_date)}</MutedBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard>No invoice records are linked to this request.</EmptyCard>
          )}
        </AdminCard>
      </section>
    </InternalPage>
  );
}
