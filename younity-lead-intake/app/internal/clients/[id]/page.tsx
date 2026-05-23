import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClientAdminForm } from "./client-admin-form";
import {
  AccessDenied,
  AdminCard,
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
  StatusBadge,
} from "../../internal-ui";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ClientRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferred_contact_method: string | null;
  zoho_lead_id: string | null;
  zoho_contact_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ClientRequestRecord = {
  id: string;
  service: string;
  status: string;
  invoice_status: string | null;
  created_at: string | null;
};

type ClientDocumentRecord = {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string | null;
};

type ClientInvoiceRecord = {
  id: string;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
};

export default async function InternalClientDetailPage({ params }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Internal Client Detail" />;
  }

  const { id } = await params;
  const clientId = typeof id === "string" ? id.trim() : "";

  if (!isUuid(clientId)) {
    return (
      <InternalPage active="clients" title="Internal Client Detail">
        <section className="py-8">
          <EmptyCard>Invalid client ID.</EmptyCard>
        </section>
      </InternalPage>
    );
  }

  const supabaseAdmin = createAdminClient();
  const [clientResult, requestsResult, documentsResult, invoicesResult] =
    await Promise.all([
      supabaseAdmin
        .from("clients")
        .select(
          "id, full_name, email, phone, company, preferred_contact_method, zoho_lead_id, zoho_contact_id, created_at, updated_at"
        )
        .eq("id", clientId)
        .maybeSingle<ClientRecord>(),
      supabaseAdmin
        .from("client_requests")
        .select("id, service, status, invoice_status, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<ClientRequestRecord[]>(),
      supabaseAdmin
        .from("client_documents")
        .select("id, document_type, file_name, status, uploaded_at")
        .eq("client_id", clientId)
        .order("uploaded_at", { ascending: false })
        .limit(20)
        .returns<ClientDocumentRecord[]>(),
      supabaseAdmin
        .from("client_invoices")
        .select("id, invoice_number, amount, status, due_date")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<ClientInvoiceRecord[]>(),
    ]);

  if (clientResult.error) {
    logInternalQueryError("Internal client detail", clientResult.error);
  }

  if (requestsResult.error) {
    logInternalQueryError("Internal client requests", requestsResult.error);
  }

  if (documentsResult.error) {
    logInternalQueryError("Internal client documents", documentsResult.error);
  }

  if (invoicesResult.error) {
    logInternalQueryError("Internal client invoices", invoicesResult.error);
  }

  const client = clientResult.data;
  const requests = requestsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];

  if (!client) {
    return (
      <InternalPage
        active="clients"
        title="Internal Client Detail"
        actions={
          <Link
            href="/internal/clients"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
          >
            Back to clients
          </Link>
        }
      >
        <section className="py-8">
          <EmptyCard>Client not found.</EmptyCard>
        </section>
      </InternalPage>
    );
  }

  return (
    <InternalPage
      active="clients"
      title={client.full_name}
      description="Client portal profile, related requests, uploaded documents, and invoice status records."
      actions={
        <Link
          href="/internal/clients"
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
        >
          Back to clients
        </Link>
      }
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_0.9fr]">
        <AdminCard
          title="Client Details"
          description="Portal profile and CRM reference fields for internal review."
        >
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Email", client.email],
              ["Phone", client.phone || "Not available"],
              ["Company", client.company || "Not available"],
              ["Preferred Contact", client.preferred_contact_method || "Not available"],
              ["Zoho Lead ID", client.zoho_lead_id || "Not available"],
              ["Zoho Contact ID", client.zoho_contact_id || "Not available"],
              ["Created", formatDateTime(client.created_at)],
              ["Updated", formatDateTime(client.updated_at)],
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
        </AdminCard>

        <AdminCard
          title="Edit Client Profile"
          description="Update the internal profile fields already supported by admin routes."
        >
          <ClientAdminForm
            clientId={client.id}
            fullName={client.full_name}
            phone={client.phone}
            company={client.company}
            preferredContactMethod={client.preferred_contact_method}
            zohoLeadId={client.zoho_lead_id}
            zohoContactId={client.zoho_contact_id}
          />
        </AdminCard>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-[1fr_0.9fr]">
        <AdminCard title="Invoices" description="Manual invoice records visible to staff.">
          {invoicesResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Invoice records are unavailable right now.
            </p>
          ) : invoices.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="py-4">
                  <p className="font-semibold text-slate-950">
                    {invoice.invoice_number || "Invoice number pending"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
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
            <EmptyCard>No invoice records found for this client.</EmptyCard>
          )}
        </AdminCard>
      </section>

      <section className="grid gap-5 pb-8 lg:grid-cols-2">
        <AdminCard title="Related Requests" description="Recent client requests and billing status.">
          {requestsResult.error ? (
            <p className="mt-5 text-sm text-slate-600">
              Requests are unavailable right now.
            </p>
          ) : requests.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {requests.map((request) => (
                <div key={request.id} className="py-4">
                  <Link
                    href={`/internal/requests/${request.id}`}
                    className="font-semibold text-teal-700 transition hover:text-teal-900"
                  >
                    {request.service}
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge>{request.status}</StatusBadge>
                    <InvoiceStatusBadge>
                      {request.invoice_status || "Invoice status unavailable"}
                    </InvoiceStatusBadge>
                    <MutedBadge>{formatDateTime(request.created_at)}</MutedBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard>No requests found for this client.</EmptyCard>
          )}
        </AdminCard>

        <AdminCard
          title="Related Documents"
          description="Recent secure uploads associated with this client."
        >
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
                      <DocumentStatusBadge>{document.status}</DocumentStatusBadge>
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
            <EmptyCard>No documents found for this client.</EmptyCard>
          )}
        </AdminCard>
      </section>
    </InternalPage>
  );
}
