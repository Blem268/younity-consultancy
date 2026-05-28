import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  clientLabel,
  EmptyCard,
  formatDateTime,
  InvoiceStatusBadge,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  sanitizeSearchParam,
  StatusBadge,
} from "../internal-ui";

type PageProps = {
  searchParams: Promise<{
    search?: string | string[];
    filter?: string | string[];
    id?: string | string[];
  }>;
};

type ClientRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferred_contact_method: string | null;
  created_at: string | null;
};

type CountRecord = {
  client_id: string | null;
};

type RecentRequest = {
  id: string;
  service: string;
  status: string;
  invoice_status: string | null;
  created_at: string | null;
};

function countByClient(records: CountRecord[]) {
  const counts = new Map<string, number>();

  for (const record of records) {
    if (record.client_id) {
      counts.set(record.client_id, (counts.get(record.client_id) ?? 0) + 1);
    }
  }

  return counts;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const FILTER_CHIPS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "awaiting-docs", label: "Awaiting docs" },
  { key: "no-requests", label: "No open requests" },
];

export default async function InternalClientsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Clients" />;
  }

  const params = await searchParams;
  const search = sanitizeSearchParam(params.search);
  const rawFilter = Array.isArray(params.filter) ? params.filter[0] : (params.filter ?? "all");
  const filter = FILTER_CHIPS.some((c) => c.key === rawFilter) ? rawFilter : "all";
  const selectedId = Array.isArray(params.id) ? params.id[0] : params.id ?? null;

  const supabaseAdmin = createAdminClient();

  let clientsQuery = supabaseAdmin
    .from("clients")
    .select("id, full_name, email, phone, company, preferred_contact_method, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    clientsQuery = clientsQuery.or(
      `full_name.ilike.*${search}*,email.ilike.*${search}*,company.ilike.*${search}*`
    );
  }

  const { data: clientsData, error: clientsError } =
    await clientsQuery.returns<ClientRecord[]>();

  if (clientsError) {
    logInternalQueryError("Clients lookup", clientsError);
  }

  const allClients = clientsData ?? [];
  const clientIds = allClients.map((c) => c.id);

  // Parallel counts + active/awaiting sets
  const [
    requestCountsResult,
    documentCountsResult,
    activeRequestIdsResult,
    awaitingDocsIdsResult,
    selectedRequestsResult,
  ] = clientIds.length
    ? await Promise.all([
        supabaseAdmin
          .from("client_requests")
          .select("client_id")
          .in("client_id", clientIds)
          .returns<CountRecord[]>(),
        supabaseAdmin
          .from("client_documents")
          .select("client_id")
          .in("client_id", clientIds)
          .returns<CountRecord[]>(),
        supabaseAdmin
          .from("client_requests")
          .select("client_id")
          .in("client_id", clientIds)
          .not("status", "in", '("Completed","Closed")')
          .returns<CountRecord[]>(),
        supabaseAdmin
          .from("client_documents")
          .select("client_id")
          .in("client_id", clientIds)
          .in("status", ["Requested", "Needs Replacement"])
          .returns<CountRecord[]>(),
        selectedId
          ? supabaseAdmin
              .from("client_requests")
              .select("id, service, status, invoice_status, created_at")
              .eq("client_id", selectedId)
              .order("created_at", { ascending: false })
              .limit(4)
              .returns<RecentRequest[]>()
          : Promise.resolve({ data: [] as RecentRequest[], error: null }),
      ])
    : [
        { data: [] as CountRecord[], error: null },
        { data: [] as CountRecord[], error: null },
        { data: [] as CountRecord[], error: null },
        { data: [] as CountRecord[], error: null },
        { data: [] as RecentRequest[], error: null },
      ];

  if (requestCountsResult.error) {
    logInternalQueryError("Client request counts", requestCountsResult.error);
  }

  if (documentCountsResult.error) {
    logInternalQueryError("Client document counts", documentCountsResult.error);
  }

  const requestCounts = countByClient(requestCountsResult.data ?? []);
  const documentCounts = countByClient(documentCountsResult.data ?? []);

  const activeClientIds = new Set(
    (activeRequestIdsResult.data ?? []).map((r) => r.client_id).filter(Boolean) as string[]
  );
  const awaitingDocsClientIds = new Set(
    (awaitingDocsIdsResult.data ?? []).map((r) => r.client_id).filter(Boolean) as string[]
  );
  const recentRequests = selectedRequestsResult.data ?? [];

  // Apply chip filter
  let clients = allClients;
  if (filter === "active") {
    clients = allClients.filter((c) => activeClientIds.has(c.id));
  } else if (filter === "awaiting-docs") {
    clients = allClients.filter((c) => awaitingDocsClientIds.has(c.id));
  } else if (filter === "no-requests") {
    clients = allClients.filter((c) => !activeClientIds.has(c.id));
  }

  const selectedClient = selectedId
    ? (allClients.find((c) => c.id === selectedId) ?? null)
    : null;

  // Build chip href (preserve search, change filter, clear id)
  function chipHref(chipKey: string) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (chipKey !== "all") qs.set("filter", chipKey);
    const str = qs.toString();
    return `/internal/clients${str ? `?${str}` : ""}`;
  }

  // Build row href (preserve search + filter, set id)
  function rowHref(clientId: string) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter !== "all") qs.set("filter", filter);
    qs.set("id", clientId);
    return `/internal/clients?${qs.toString()}`;
  }

  // Build close href (preserve search + filter, clear id)
  function closeHref() {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter !== "all") qs.set("filter", filter);
    const str = qs.toString();
    return `/internal/clients${str ? `?${str}` : ""}`;
  }

  return (
    <InternalPage
      active="clients"
      title="Clients"
      description="Portal profiles, open requests, and document status across your client base."
      actions={
        <Link
          href="/internal/onboarding"
          prefetch={false}
          className="rounded-xl bg-[#244285] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Add client
        </Link>
      }
    >
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
            placeholder="Search by name, email, or company"
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

      {clientsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">
            Clients are unavailable right now.
          </p>
        </div>
      ) : (
        <div className="flex min-h-full gap-6">
          {/* Client table */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              {clients.length} client{clients.length === 1 ? "" : "s"}
              {search ? ` matching "${search}"` : ""}
              {filter !== "all" ? ` · ${FILTER_CHIPS.find((c) => c.key === filter)?.label}` : ""}
            </p>

            {clients.length === 0 ? (
              <EmptyCard>
                No clients found for the selected filter
                {search ? ` and search "${search}"` : ""}.
              </EmptyCard>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {clients.map((client) => {
                    const isSelected = client.id === selectedId;
                    return (
                      <Link
                        key={client.id}
                        href={isSelected ? closeHref() : rowHref(client.id)}
                        prefetch={false}
                        scroll={false}
                        className={`block rounded-[10px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[#50A9C0]/50 ring-1 ring-[#50A9C0]/30"
                            : "border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#244285]/10 text-xs font-black text-[#244285]">
                            {getInitials(client.full_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#06111f]">{client.full_name}</p>
                            <p className="truncate text-xs text-slate-500">{client.email}</p>
                            {client.company ? (
                              <p className="text-xs text-slate-500">{client.company}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-4 text-xs text-slate-500">
                          <span>
                            <strong className="text-slate-800">
                              {requestCounts.get(client.id) ?? 0}
                            </strong>{" "}
                            requests
                          </span>
                          <span>
                            <strong className="text-slate-800">
                              {documentCounts.get(client.id) ?? 0}
                            </strong>{" "}
                            documents
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-sm lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3 text-center">Requests</th>
                        <th className="px-4 py-3 text-center">Documents</th>
                        <th className="px-4 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client) => {
                        const isSelected = client.id === selectedId;
                        return (
                          <tr
                            key={client.id}
                            className={`cursor-pointer transition hover:bg-slate-50 ${
                              isSelected ? "bg-[#50A9C0]/5" : ""
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(client.id)}
                                prefetch={false}
                                scroll={false}
                                className="flex items-center gap-3"
                              >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#244285]/10 text-xs font-black text-[#244285]">
                                  {getInitials(client.full_name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#06111f]">
                                    {client.full_name}
                                  </p>
                                  {activeClientIds.has(client.id) && (
                                    <span className="text-[10px] font-semibold text-emerald-600">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(client.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                <p className="text-slate-700">{client.email}</p>
                                {client.phone ? (
                                  <p className="mt-0.5 text-xs text-slate-500">{client.phone}</p>
                                ) : null}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              <Link
                                href={isSelected ? closeHref() : rowHref(client.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {client.company || (
                                  <span className="text-slate-400">—</span>
                                )}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                              <Link
                                href={isSelected ? closeHref() : rowHref(client.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {requestCounts.get(client.id) ?? 0}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                              <Link
                                href={isSelected ? closeHref() : rowHref(client.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {documentCounts.get(client.id) ?? 0}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-500">
                              <Link
                                href={isSelected ? closeHref() : rowHref(client.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {formatDateTime(client.created_at)}
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
          {selectedClient ? (
            <aside className="w-[320px] flex-shrink-0">
              <div className="rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#244285]/10 text-sm font-black text-[#244285]">
                      {getInitials(selectedClient.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#06111f]">
                        {selectedClient.full_name}
                      </p>
                      {selectedClient.company ? (
                        <p className="truncate text-xs text-slate-500">
                          {selectedClient.company}
                        </p>
                      ) : null}
                    </div>
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
                  {/* Contact info */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Contact
                    </p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="break-all">{selectedClient.email}</p>
                      {selectedClient.phone ? (
                        <p>{selectedClient.phone}</p>
                      ) : null}
                      {selectedClient.preferred_contact_method ? (
                        <p className="text-xs text-slate-500">
                          Prefers {selectedClient.preferred_contact_method}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
                      <p className="text-lg font-black text-[#06111f]">
                        {requestCounts.get(selectedClient.id) ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">Requests</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
                      <p className="text-lg font-black text-[#06111f]">
                        {documentCounts.get(selectedClient.id) ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">Documents</p>
                    </div>
                  </div>

                  {/* Joined */}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Joined
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(selectedClient.created_at)}
                    </p>
                  </div>

                  {/* Recent requests */}
                  {recentRequests.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Recent requests
                      </p>
                      <div className="space-y-2.5">
                        {recentRequests.map((req) => (
                          <Link
                            key={req.id}
                            href={`/internal/requests/${req.id}`}
                            prefetch={false}
                            className="block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 transition hover:border-[#50A9C0]/30 hover:bg-[#50A9C0]/5"
                          >
                            <p className="line-clamp-1 text-xs font-semibold text-[#06111f]">
                              {req.service}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <StatusBadge>{req.status}</StatusBadge>
                              {req.invoice_status ? (
                                <InvoiceStatusBadge>
                                  {req.invoice_status}
                                </InvoiceStatusBadge>
                              ) : null}
                            </div>
                            <p className="mt-1.5 text-[10px] text-slate-400">
                              {formatDateTime(req.created_at)}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Status flags */}
                  <div className="flex flex-wrap gap-1.5">
                    {activeClientIds.has(selectedClient.id) && (
                      <MutedBadge>Active requests</MutedBadge>
                    )}
                    {awaitingDocsClientIds.has(selectedClient.id) && (
                      <MutedBadge>Awaiting docs</MutedBadge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t border-slate-100 px-5 py-4">
                  <Link
                    href={`/internal/clients/${selectedClient.id}`}
                    prefetch={false}
                    className="block w-full rounded-xl bg-[#244285] px-4 py-2.5 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    View full profile
                  </Link>
                  <Link
                    href={`/internal/requests?search=${encodeURIComponent(selectedClient.full_name)}`}
                    prefetch={false}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View requests
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
