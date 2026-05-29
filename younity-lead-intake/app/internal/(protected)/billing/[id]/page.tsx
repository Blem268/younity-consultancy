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

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Billing breakdown
                </p>
                <div className="space-y-2">
                  {[
                    ["Billing type", invoice.client_requests.billing_type ?? "—"],
                    ["Estimated fee", formatMoney(invoice.client_requests.estimated_fee)],
                    [
                      "Deposit required",
                      formatMoney(invoice.client_requests.deposit_required),
                    ],
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
