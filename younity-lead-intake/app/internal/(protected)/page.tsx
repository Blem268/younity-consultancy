import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  clientLabel,
  EmptyCard,
  formatDateTime,
  formatMoney,
  InvoiceStatusBadge,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  StatusBadge,
} from "./internal-ui";

type PageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

type BoardRequest = {
  id: string;
  service: string;
  status: string;
  invoice_status: string | null;
  billing_type: string | null;
  estimated_fee: number | string | null;
  deposit_required: number | string | null;
  amount_paid: number | string | null;
  balance_due: number | string | null;
  created_at: string | null;
  updated_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
    email: string | null;
  } | null;
};

const BOARD_COLUMNS: {
  key: string;
  label: string;
  statuses: string[];
  dot: string;
}[] = [
  {
    key: "submitted",
    label: "Submitted",
    statuses: ["Submitted"],
    dot: "bg-[#244285]",
  },
  {
    key: "in-progress",
    label: "In Progress",
    statuses: ["In Progress"],
    dot: "bg-[#50A9C0]",
  },
  {
    key: "waiting",
    label: "Waiting",
    statuses: ["Waiting", "Waiting on Client", "Waiting on Documents"],
    dot: "bg-amber-400",
  },
  {
    key: "other",
    label: "Other",
    statuses: [],
    dot: "bg-slate-400",
  },
];

function getInitials(label: string) {
  return label
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default async function BoardPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Board" />;
  }

  const params = await searchParams;
  const selectedId = Array.isArray(params.id) ? params.id[0] : params.id ?? null;

  const supabaseAdmin = createAdminClient();

  const { data: requestsData, error: requestsError } = await supabaseAdmin
    .from("client_requests")
    .select(
      "id, service, status, invoice_status, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, created_at, updated_at, clients(full_name, company, email)"
    )
    .not("status", "in", '("Completed","Closed")')
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<BoardRequest[]>();

  if (requestsError) {
    logInternalQueryError("Board requests", requestsError);
  }

  const requests = requestsData ?? [];

  const knownStatuses = new Set(BOARD_COLUMNS.flatMap((col) => col.statuses));
  const columns = BOARD_COLUMNS.map((col) => ({
    ...col,
    items:
      col.key === "other"
        ? requests.filter((r) => !knownStatuses.has(r.status))
        : requests.filter((r) => col.statuses.includes(r.status)),
  }));

  const selectedRequest = selectedId
    ? (requests.find((r) => r.id === selectedId) ?? null)
    : null;

  const totalActive = requests.filter(
    (r) => !["Completed", "Closed"].includes(r.status)
  ).length;

  return (
    <InternalPage
      active="board"
      title="Board"
      description="Active client requests across all workflow stages."
      actions={
        <Link
          href="/internal/requests"
          prefetch={false}
          className="rounded-xl bg-[#244285] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
        >
          All requests
        </Link>
      }
    >
      {requestsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">
            Board data is unavailable right now.
          </p>
        </div>
      ) : (
        <div className="flex min-h-full gap-6">
          {/* Kanban columns */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <p className="mb-4 text-xs font-semibold text-slate-500">
              {totalActive} active request{totalActive === 1 ? "" : "s"}
            </p>
            <div className="flex gap-4 pb-6" style={{ minWidth: "fit-content" }}>
              {columns.map((col) => (
                <div key={col.key} className="w-[268px] flex-shrink-0">
                  {/* Column header */}
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      {col.label}
                    </span>
                    <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {col.items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5">
                    {col.items.length === 0 ? (
                      <EmptyCard>No {col.label.toLowerCase()} requests</EmptyCard>
                    ) : (
                      col.items.map((request) => {
                        const label = request.clients
                          ? clientLabel(request.clients)
                          : "Unknown client";
                        const isSelected = request.id === selectedId;

                        return (
                          <Link
                            key={request.id}
                            href={isSelected ? "/internal" : `?id=${request.id}`}
                            prefetch={false}
                            scroll={false}
                            className={`block rounded-[10px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                              isSelected
                                ? "border-[#50A9C0]/50 ring-1 ring-[#50A9C0]/30"
                                : "border-slate-200/80"
                            }`}
                          >
                            <p className="line-clamp-2 text-sm font-semibold text-[#06111f]">
                              {request.service}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#244285]/10 text-[9px] font-black text-[#244285]">
                                {getInitials(label)}
                              </div>
                              <p className="truncate text-xs text-slate-600">
                                {label}
                              </p>
                            </div>
                            {request.invoice_status ? (
                              <div className="mt-2.5">
                                <InvoiceStatusBadge>
                                  {request.invoice_status}
                                </InvoiceStatusBadge>
                              </div>
                            ) : null}
                            <p className="mt-2.5 text-xs text-slate-400">
                              {formatDateTime(request.created_at)}
                            </p>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selectedRequest ? (
            <aside className="w-[340px] flex-shrink-0">
              <div className="rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
                {/* Panel header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-[#06111f]">
                      {selectedRequest.service}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {selectedRequest.clients
                        ? clientLabel(selectedRequest.clients)
                        : "Client unavailable"}
                    </p>
                  </div>
                  <Link
                    href="/internal"
                    prefetch={false}
                    scroll={false}
                    className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </Link>
                </div>

                <div className="space-y-5 px-5 py-5">
                  {/* Status */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge>{selectedRequest.status}</StatusBadge>
                      <InvoiceStatusBadge>
                        {selectedRequest.invoice_status || "Invoice status unavailable"}
                      </InvoiceStatusBadge>
                    </div>
                  </div>

                  {/* Client */}
                  {selectedRequest.clients ? (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Client
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {clientLabel(selectedRequest.clients)}
                      </p>
                      {selectedRequest.clients.email ? (
                        <p className="mt-0.5 break-all text-xs text-slate-500">
                          {selectedRequest.clients.email}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Billing */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Billing
                    </p>
                    {selectedRequest.billing_type ? (
                      <div className="mb-2">
                        <MutedBadge>{selectedRequest.billing_type}</MutedBadge>
                      </div>
                    ) : null}
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="text-slate-400">Estimated </span>
                        {formatMoney(selectedRequest.estimated_fee)}
                      </p>
                      <p>
                        <span className="text-slate-400">Deposit </span>
                        {formatMoney(selectedRequest.deposit_required)}
                      </p>
                      <p>
                        <span className="text-slate-400">Paid </span>
                        {formatMoney(selectedRequest.amount_paid)}
                      </p>
                      <p>
                        <span className="text-slate-400">Balance </span>
                        {formatMoney(selectedRequest.balance_due)}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Dates
                    </p>
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>Created {formatDateTime(selectedRequest.created_at)}</p>
                      <p>Updated {formatDateTime(selectedRequest.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 px-5 py-4">
                  <Link
                    href={`/internal/requests/${selectedRequest.id}`}
                    prefetch={false}
                    className="block w-full rounded-xl bg-[#244285] px-4 py-2.5 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    View full detail
                  </Link>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </InternalPage>
  );
}
