import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  clientLabel,
  EmptyCard,
  formatDate,
  formatMoney,
  InvoiceStatusBadge,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  sanitizeSearchParam,
  StatusBadge,
} from "../internal-ui";

type PageProps = {
  searchParams: Promise<{
    filter?: string | string[];
    search?: string | string[];
    id?: string | string[];
  }>;
};

type ClientMatch = {
  id: string;
};

type InvoiceRecord = {
  id: string;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
  zoho_books_invoice_id: string | null;
  created_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
    email: string | null;
  } | null;
  client_requests: {
    id: string | null;
    service: string | null;
    billing_type: string | null;
    estimated_fee: number | string | null;
    deposit_required: number | string | null;
    amount_paid: number | string | null;
    balance_due: number | string | null;
    invoice_status: string | null;
  } | null;
};

type FilterChip = {
  key: string;
  label: string;
};

const FILTER_CHIPS: FilterChip[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft / Not Ready" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "partial", label: "Partial" },
];

function isOverdue(invoice: InvoiceRecord, today: string) {
  if (!invoice.due_date) return false;
  if (invoice.status === "Paid" || invoice.status === "Cancelled") return false;
  return invoice.due_date < today;
}

function getStatusColor(status: string | null) {
  switch (status) {
    case "Paid":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "Overdue":
      return "text-red-700 bg-red-50 border-red-200";
    case "Sent":
      return "text-[#244285] bg-blue-50 border-blue-200";
    case "Partial":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

export default async function BillingPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Billing" />;
  }

  const params = await searchParams;
  const search = sanitizeSearchParam(params.search);
  const rawFilter = Array.isArray(params.filter) ? params.filter[0] : (params.filter ?? "all");
  const filter = FILTER_CHIPS.some((c) => c.key === rawFilter) ? rawFilter : "all";
  const selectedId = Array.isArray(params.id) ? params.id[0] : params.id ?? null;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const supabaseAdmin = createAdminClient();

  // Global stats (unaffected by filter/search)
  const [totalResult, paidResult, overdueResult, pendingResult] =
    await Promise.all([
      supabaseAdmin
        .from("client_invoices")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("client_invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "Paid"),
      supabaseAdmin
        .from("client_invoices")
        .select("id", { count: "exact", head: true })
        .lt("due_date", today)
        .not("status", "in", '("Paid","Cancelled")'),
      supabaseAdmin
        .from("client_invoices")
        .select("id", { count: "exact", head: true })
        .not("status", "in", '("Paid","Cancelled")'),
    ]);

  const stats = [
    {
      label: "Total invoices",
      value: totalResult.count ?? 0,
      highlight: false,
    },
    {
      label: "Paid",
      value: paidResult.count ?? 0,
      highlight: false,
    },
    {
      label: "Overdue",
      value: overdueResult.count ?? 0,
      highlight: (overdueResult.count ?? 0) > 0,
    },
    {
      label: "Pending / unpaid",
      value: pendingResult.count ?? 0,
      highlight: false,
    },
  ];

  // Client search
  let matchedClientIds: string[] | null = null;

  if (search) {
    const { data: clientMatches, error: clientMatchError } = await supabaseAdmin
      .from("clients")
      .select("id")
      .or(`full_name.ilike.*${search}*,email.ilike.*${search}*,company.ilike.*${search}*`)
      .limit(200)
      .returns<ClientMatch[]>();

    if (clientMatchError) {
      logInternalQueryError("Billing client search", clientMatchError);
    }

    matchedClientIds = (clientMatches ?? []).map((c) => c.id);
  }

  // Invoices query
  let invoicesQuery = supabaseAdmin
    .from("client_invoices")
    .select(
      "id, invoice_number, amount, status, due_date, zoho_books_invoice_id, created_at, clients(full_name, company, email), client_requests(id, service, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, invoice_status)"
    )
    .order("created_at", { ascending: false })
    .limit(150);

  // Apply filter
  if (filter === "draft") {
    invoicesQuery = invoicesQuery.in("status", ["Draft", "Not Ready"]);
  } else if (filter === "sent") {
    invoicesQuery = invoicesQuery.eq("status", "Sent");
  } else if (filter === "paid") {
    invoicesQuery = invoicesQuery.eq("status", "Paid");
  } else if (filter === "overdue") {
    invoicesQuery = invoicesQuery
      .lt("due_date", today)
      .not("status", "in", '("Paid","Cancelled")');
  } else if (filter === "partial") {
    invoicesQuery = invoicesQuery.eq("status", "Partial");
  }

  // Apply search
  if (search && matchedClientIds !== null) {
    if (matchedClientIds.length > 0) {
      invoicesQuery = invoicesQuery.or(
        `invoice_number.ilike.*${search}*,client_id.in.(${matchedClientIds.join(",")})`
      );
    } else {
      invoicesQuery = invoicesQuery.ilike("invoice_number", `%${search}%`);
    }
  }

  const { data: invoicesData, error: invoicesError } =
    await invoicesQuery.returns<InvoiceRecord[]>();

  if (invoicesError) {
    logInternalQueryError("Billing invoices lookup", invoicesError);
  }

  const invoices = invoicesData ?? [];
  const selectedInvoice = selectedId
    ? (invoices.find((inv) => inv.id === selectedId) ?? null)
    : null;

  function chipHref(chipKey: string) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (chipKey !== "all") qs.set("filter", chipKey);
    const str = qs.toString();
    return `/internal/billing${str ? `?${str}` : ""}`;
  }

  function rowHref(invoiceId: string) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter !== "all") qs.set("filter", filter);
    qs.set("id", invoiceId);
    return `/internal/billing?${qs.toString()}`;
  }

  function closeHref() {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter !== "all") qs.set("filter", filter);
    const str = qs.toString();
    return `/internal/billing${str ? `?${str}` : ""}`;
  }

  return (
    <InternalPage
      active="billing"
      title="Billing"
      description="Invoice records linked to client requests. Manage status, track payments, and reference Zoho Books."
    >
      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-[10px] border bg-white px-4 py-3 shadow-sm ${
              stat.highlight
                ? "border-red-200 bg-red-50"
                : "border-slate-200/80"
            }`}
          >
            <p
              className={`text-2xl font-black tracking-tight ${
                stat.highlight ? "text-red-700" : "text-[#06111f]"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search + filter chips */}
      <div className="mb-6 space-y-3">
        <form className="flex gap-2">
          {filter !== "all" && (
            <input type="hidden" name="filter" value={filter} />
          )}
          <input
            name="search"
            defaultValue={search}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#50A9C0]/40"
            placeholder="Search by invoice number or client"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#06111f] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:brightness-110"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const isActive = chip.key === filter;
            return (
              <Link
                key={chip.key}
                href={chipHref(chip.key)}
                prefetch={false}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#244285] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#50A9C0]/40 hover:text-[#244285]"
                }`}
              >
                {chip.label}
              </Link>
            );
          })}
        </div>
      </div>

      {invoicesError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">
            Invoice records are unavailable right now.
          </p>
        </div>
      ) : (
        <div className="flex min-h-full gap-6">
          {/* Table */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
              {search ? ` matching "${search}"` : ""}
              {filter !== "all"
                ? ` · ${FILTER_CHIPS.find((c) => c.key === filter)?.label}`
                : ""}
            </p>

            {invoices.length === 0 ? (
              <EmptyCard>
                No invoices found for the selected filter
                {search ? ` and search "${search}"` : ""}.
              </EmptyCard>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {invoices.map((invoice) => {
                    const isSelected = invoice.id === selectedId;
                    const overdue = isOverdue(invoice, today);
                    return (
                      <Link
                        key={invoice.id}
                        href={isSelected ? closeHref() : rowHref(invoice.id)}
                        prefetch={false}
                        scroll={false}
                        className={`block rounded-[10px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[#50A9C0]/50 ring-1 ring-[#50A9C0]/30"
                            : "border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[#06111f]">
                            {invoice.invoice_number || "Number pending"}
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(overdue ? "Overdue" : invoice.status)}`}
                          >
                            {overdue ? "Overdue" : (invoice.status || "Not Ready")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.clients
                            ? clientLabel(invoice.clients)
                            : "Client unavailable"}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">
                            {formatMoney(invoice.amount)}
                          </span>
                          {invoice.due_date ? (
                            <span className={`text-xs ${overdue ? "font-semibold text-red-600" : "text-slate-500"}`}>
                              Due {formatDate(invoice.due_date)}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-sm lg:block">
                  <table className="w-full text-left text-sm" style={{ minWidth: "760px" }}>
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Due</th>
                        <th className="px-4 py-3">Zoho Books</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((invoice) => {
                        const isSelected = invoice.id === selectedId;
                        const overdue = isOverdue(invoice, today);
                        const displayStatus = overdue ? "Overdue" : (invoice.status || "Not Ready");

                        return (
                          <tr
                            key={invoice.id}
                            className={`transition hover:bg-slate-50 ${
                              isSelected ? "bg-[#50A9C0]/5" : ""
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(invoice.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                <p className="font-semibold text-[#06111f]">
                                  {invoice.invoice_number || (
                                    <span className="font-normal text-slate-400">
                                      Number pending
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {formatDate(invoice.created_at)}
                                </p>
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-slate-700">
                              <Link
                                href={isSelected ? closeHref() : rowHref(invoice.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {invoice.clients
                                  ? clientLabel(invoice.clients)
                                  : <span className="text-slate-400">—</span>}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5">
                              {invoice.client_requests?.id ? (
                                <Link
                                  href={`/internal/requests/${invoice.client_requests.id}`}
                                  prefetch={false}
                                  className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                                >
                                  {invoice.client_requests.service || "View request"}
                                </Link>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                              <Link
                                href={isSelected ? closeHref() : rowHref(invoice.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {formatMoney(invoice.amount)}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(invoice.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                <span
                                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(overdue ? "Overdue" : invoice.status)}`}
                                >
                                  {displayStatus}
                                </span>
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">
                              <Link
                                href={isSelected ? closeHref() : rowHref(invoice.id)}
                                prefetch={false}
                                scroll={false}
                                className={`block ${overdue ? "font-semibold text-red-600" : ""}`}
                              >
                                {invoice.due_date
                                  ? formatDate(invoice.due_date)
                                  : <span className="text-slate-400">—</span>}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(invoice.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {invoice.zoho_books_invoice_id ? (
                                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                                    {invoice.zoho_books_invoice_id}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Not synced</span>
                                )}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Detail panel */}
          {selectedInvoice ? (
            <aside className="w-[320px] flex-shrink-0">
              <div className="rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#06111f]">
                      {selectedInvoice.invoice_number || "Invoice number pending"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedInvoice.clients
                        ? clientLabel(selectedInvoice.clients)
                        : "Client unavailable"}
                    </p>
                  </div>
                  <Link
                    href={closeHref()}
                    prefetch={false}
                    scroll={false}
                    className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </Link>
                </div>

                <div className="space-y-5 px-5 py-4">
                  {/* Status */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </p>
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                        isOverdue(selectedInvoice, today) ? "Overdue" : selectedInvoice.status
                      )}`}
                    >
                      {isOverdue(selectedInvoice, today)
                        ? "Overdue"
                        : (selectedInvoice.status || "Not Ready")}
                    </span>
                  </div>

                  {/* Client */}
                  {selectedInvoice.clients ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Client
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {clientLabel(selectedInvoice.clients)}
                      </p>
                      {selectedInvoice.clients.email ? (
                        <p className="mt-0.5 break-all text-xs text-slate-500">
                          {selectedInvoice.clients.email}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Amount + due date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 text-base font-black text-[#06111f]">
                        {formatMoney(selectedInvoice.amount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Due date
                      </p>
                      <p
                        className={`mt-1 text-base font-black ${
                          isOverdue(selectedInvoice, today)
                            ? "text-red-600"
                            : "text-[#06111f]"
                        }`}
                      >
                        {selectedInvoice.due_date
                          ? formatDate(selectedInvoice.due_date)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Linked request */}
                  {selectedInvoice.client_requests?.id ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Linked request
                      </p>
                      <Link
                        href={`/internal/requests/${selectedInvoice.client_requests.id}`}
                        prefetch={false}
                        className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                      >
                        {selectedInvoice.client_requests.service || "View request"}
                      </Link>

                      {/* Request billing fields */}
                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        {selectedInvoice.client_requests.billing_type ? (
                          <div className="mb-2">
                            <MutedBadge>
                              {selectedInvoice.client_requests.billing_type}
                            </MutedBadge>
                          </div>
                        ) : null}
                        <p>
                          <span className="text-slate-400">Estimated </span>
                          <span className="font-medium text-slate-700">
                            {formatMoney(selectedInvoice.client_requests.estimated_fee)}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Deposit </span>
                          <span className="font-medium text-slate-700">
                            {formatMoney(selectedInvoice.client_requests.deposit_required)}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Paid </span>
                          <span className="font-medium text-slate-700">
                            {formatMoney(selectedInvoice.client_requests.amount_paid)}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Balance </span>
                          <span className="font-medium text-slate-700">
                            {formatMoney(selectedInvoice.client_requests.balance_due)}
                          </span>
                        </p>
                        {selectedInvoice.client_requests.invoice_status ? (
                          <div className="pt-1">
                            <InvoiceStatusBadge>
                              {selectedInvoice.client_requests.invoice_status}
                            </InvoiceStatusBadge>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {/* Zoho Books */}
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Zoho Books
                    </p>
                    {selectedInvoice.zoho_books_invoice_id ? (
                      <div className="space-y-1.5">
                        <p className="text-xs text-slate-500">Invoice ID</p>
                        <span className="block rounded bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-700 break-all">
                          {selectedInvoice.zoho_books_invoice_id}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Not yet synced to Zoho Books.
                      </p>
                    )}
                  </div>

                  {/* Created */}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(selectedInvoice.created_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t border-slate-100 px-5 py-4">
                  <Link
                    href={`/internal/billing/${selectedInvoice.id}`}
                    prefetch={false}
                    className="block w-full rounded-xl bg-[#244285] px-4 py-2.5 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    View full invoice
                  </Link>
                  {selectedInvoice.client_requests?.id ? (
                    <Link
                      href={`/internal/requests/${selectedInvoice.client_requests.id}`}
                      prefetch={false}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View request
                    </Link>
                  ) : null}
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
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </InternalPage>
  );
}
