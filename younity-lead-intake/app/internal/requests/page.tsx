import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  clientLabel,
  EmptyCard,
  formatDateTime,
  formatMoney,
  getSearchParam,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  sanitizeSearchParam,
  StatusBadge,
} from "../internal-ui";

type PageProps = {
  searchParams: Promise<{
    status?: string | string[];
    invoice_status?: string | string[];
    service?: string | string[];
    search?: string | string[];
  }>;
};

type ClientMatch = {
  id: string;
};

type RequestRecord = {
  id: string;
  service: string;
  status: string;
  invoice_status: string | null;
  billing_type: string | null;
  estimated_fee: number | string | null;
  deposit_required: number | string | null;
  amount_paid: number | string | null;
  balance_due: number | string | null;
  clickup_task_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
    email: string | null;
  } | null;
};

export default async function InternalRequestsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Internal Requests" />;
  }

  const params = await searchParams;
  const statusFilter = getSearchParam(params.status).trim();
  const invoiceStatusFilter = getSearchParam(params.invoice_status).trim();
  const serviceFilter = sanitizeSearchParam(params.service);
  const search = sanitizeSearchParam(params.search);
  const supabaseAdmin = createAdminClient();

  let matchedClientIds: string[] | null = null;

  if (search) {
    const { data: clientMatches, error: clientMatchError } = await supabaseAdmin
      .from("clients")
      .select("id")
      .or(`full_name.ilike.*${search}*,email.ilike.*${search}*,company.ilike.*${search}*`)
      .limit(200)
      .returns<ClientMatch[]>();

    if (clientMatchError) {
      logInternalQueryError("Internal request client search", clientMatchError);
    }

    matchedClientIds = (clientMatches ?? []).map((client) => client.id);
  }

  let requestsQuery = supabaseAdmin
    .from("client_requests")
    .select(
      "id, service, status, invoice_status, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, clickup_task_id, created_at, updated_at, clients(full_name, company, email)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) {
    requestsQuery = requestsQuery.eq("status", statusFilter);
  }

  if (invoiceStatusFilter) {
    requestsQuery = requestsQuery.eq("invoice_status", invoiceStatusFilter);
  }

  if (serviceFilter) {
    requestsQuery = requestsQuery.ilike("service", `%${serviceFilter}%`);
  }

  if (matchedClientIds) {
    requestsQuery = matchedClientIds.length
      ? requestsQuery.in("client_id", matchedClientIds)
      : requestsQuery.eq("client_id", "00000000-0000-4000-8000-000000000000");
  }

  const { data: requestsData, error: requestsError } =
    await requestsQuery.returns<RequestRecord[]>();

  if (requestsError) {
    logInternalQueryError("Internal requests lookup", requestsError);
  }

  const requests = requestsData ?? [];

  return (
    <InternalPage
      active="requests"
      title="Internal Requests"
      description="Review submitted client requests, operational status, and ClickUp billing preparation fields."
    >
      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[0.8fr_0.8fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Status
          <input
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Submitted"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Invoice Status
          <input
            name="invoice_status"
            defaultValue={invoiceStatusFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Ready for Billing"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Service
          <input
            name="service"
            defaultValue={serviceFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Consulting"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Client Search
          <input
            name="search"
            defaultValue={search}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Name, company, or email"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Filter
        </button>
      </form>

      <section className="py-8">
        {requestsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              Requests are unavailable right now.
            </p>
          </div>
        ) : requests.length ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1280px] w-full text-left text-sm">
              <thead className="border-b border-teal-900/10 bg-teal-50/70 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                <tr>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Billing</th>
                  <th className="px-4 py-3">Fees</th>
                  <th className="px-4 py-3">ClickUp</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">{request.service}</p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {request.id}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {request.clients ? (
                        <>
                          <p className="font-semibold text-slate-900">
                            {clientLabel(request.clients)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {request.clients.email || "Email unavailable"}
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-600">Client unavailable</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusBadge>{request.status}</StatusBadge>
                        <MutedBadge>
                          {request.invoice_status || "Invoice status unavailable"}
                        </MutedBadge>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {request.billing_type || "Not available"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>Est. {formatMoney(request.estimated_fee)}</p>
                      <p className="mt-1">Deposit {formatMoney(request.deposit_required)}</p>
                      <p className="mt-1">Paid {formatMoney(request.amount_paid)}</p>
                      <p className="mt-1">Balance {formatMoney(request.balance_due)}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {request.clickup_task_id || "Not available"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>Created {formatDateTime(request.created_at)}</p>
                      <p className="mt-1">Updated {formatDateTime(request.updated_at)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/internal/requests/${request.id}`}
                        className="font-semibold text-teal-700 transition hover:text-teal-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyCard>No requests found.</EmptyCard>
        )}
      </section>
    </InternalPage>
  );
}
