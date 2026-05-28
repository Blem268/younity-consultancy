import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  clientLabel,
  DocumentStatusBadge,
  EmptyCard,
  formatDateTime,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  sanitizeSearchParam,
} from "../internal-ui";
import { DocumentStatusForm } from "./document-status-form";

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

type DocumentRecord = {
  id: string;
  request_id: string | null;
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
  clients: {
    full_name: string | null;
    company: string | null;
  } | null;
  client_requests: {
    service: string | null;
  } | null;
};

const FILTER_CHIPS: {
  key: string;
  label: string;
  statuses: string[] | null;
}[] = [
  { key: "all", label: "All", statuses: null },
  {
    key: "needs-review",
    label: "Needs review",
    statuses: ["Submitted", "Received", "Under Review"],
  },
  {
    key: "awaiting-upload",
    label: "Awaiting upload",
    statuses: ["Requested", "Needs Replacement"],
  },
  { key: "approved", label: "Approved", statuses: ["Approved"] },
  { key: "rejected", label: "Rejected", statuses: ["Rejected"] },
];

function isPendingDocument(document: DocumentRecord) {
  return document.file_path === "pending" || document.file_name === "Pending upload";
}

export default async function InternalDocumentsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Documents" />;
  }

  const params = await searchParams;
  const search = sanitizeSearchParam(params.search);
  const rawFilter = Array.isArray(params.filter) ? params.filter[0] : (params.filter ?? "all");
  const filter = FILTER_CHIPS.some((c) => c.key === rawFilter) ? rawFilter : "all";
  const selectedId = Array.isArray(params.id) ? params.id[0] : params.id ?? null;

  const activeChip = FILTER_CHIPS.find((c) => c.key === filter)!;
  const supabaseAdmin = createAdminClient();

  // Global status counts (not affected by search/filter)
  const [needsReviewCount, awaitingUploadCount, approvedCount, rejectedCount] =
    await Promise.all([
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["Submitted", "Received", "Under Review"]),
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["Requested", "Needs Replacement"]),
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "Approved"),
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "Rejected"),
    ]);

  const stats = [
    {
      label: "Needs review",
      value: needsReviewCount.count ?? 0,
      highlight: (needsReviewCount.count ?? 0) > 0,
    },
    {
      label: "Awaiting upload",
      value: awaitingUploadCount.count ?? 0,
      highlight: false,
    },
    { label: "Approved", value: approvedCount.count ?? 0, highlight: false },
    { label: "Rejected", value: rejectedCount.count ?? 0, highlight: false },
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
      logInternalQueryError("Document client search", clientMatchError);
    }

    matchedClientIds = (clientMatches ?? []).map((c) => c.id);
  }

  // Documents query
  let documentsQuery = supabaseAdmin
    .from("client_documents")
    .select(
      "id, request_id, document_type, file_name, file_path, status, notes, uploaded_at, requested_by, requested_at, reviewed_by, reviewed_at, review_note, required, clients(full_name, company), client_requests(service)"
    )
    .order("uploaded_at", { ascending: false })
    .limit(150);

  if (activeChip.statuses) {
    documentsQuery = documentsQuery.in("status", activeChip.statuses);
  }

  if (search) {
    const searchConditions = [`file_name.ilike.*${search}*`];

    if (matchedClientIds?.length) {
      searchConditions.push(`client_id.in.(${matchedClientIds.join(",")})`);
    }

    documentsQuery = documentsQuery.or(searchConditions.join(","));
  }

  const { data: documentsData, error: documentsError } =
    await documentsQuery.returns<DocumentRecord[]>();

  if (documentsError) {
    logInternalQueryError("Documents lookup", documentsError);
  }

  const documents = documentsData ?? [];
  const selectedDocument = selectedId
    ? (documents.find((d) => d.id === selectedId) ?? null)
    : null;

  function chipHref(chipKey: string) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (chipKey !== "all") qs.set("filter", chipKey);
    const str = qs.toString();
    return `/internal/documents${str ? `?${str}` : ""}`;
  }

  function rowHref(docId: string) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter !== "all") qs.set("filter", filter);
    qs.set("id", docId);
    return `/internal/documents?${qs.toString()}`;
  }

  function closeHref() {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter !== "all") qs.set("filter", filter);
    const str = qs.toString();
    return `/internal/documents${str ? `?${str}` : ""}`;
  }

  return (
    <InternalPage
      active="documents"
      title="Documents"
      description="Review uploaded client documents, update review status, and open files via signed URLs."
    >
      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-[10px] border bg-white px-4 py-3 shadow-sm ${
              stat.highlight
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200/80"
            }`}
          >
            <p
              className={`text-2xl font-black tracking-tight ${
                stat.highlight ? "text-amber-700" : "text-[#06111f]"
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
            placeholder="Search by file name or client"
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

      {documentsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">
            Documents are unavailable right now.
          </p>
        </div>
      ) : (
        <div className="flex min-h-full gap-6">
          {/* Table */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              {documents.length} document{documents.length === 1 ? "" : "s"}
              {search ? ` matching "${search}"` : ""}
              {filter !== "all"
                ? ` · ${FILTER_CHIPS.find((c) => c.key === filter)?.label}`
                : ""}
            </p>

            {documents.length === 0 ? (
              <EmptyCard>
                No documents found for the selected filter
                {search ? ` and search "${search}"` : ""}. Private files are
                accessible only through the admin open route.
              </EmptyCard>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {documents.map((doc) => {
                    const isSelected = doc.id === selectedId;
                    return (
                      <Link
                        key={doc.id}
                        href={isSelected ? closeHref() : rowHref(doc.id)}
                        prefetch={false}
                        scroll={false}
                        className={`block rounded-[10px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[#50A9C0]/50 ring-1 ring-[#50A9C0]/30"
                            : "border-slate-200/80"
                        }`}
                      >
                        <p className="break-words font-semibold text-[#06111f]">
                          {doc.file_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {doc.document_type}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {doc.clients ? clientLabel(doc.clients) : "Client unavailable"}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <DocumentStatusBadge>{doc.status}</DocumentStatusBadge>
                          {doc.required ? (
                            <MutedBadge>Required</MutedBadge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {formatDateTime(doc.uploaded_at)}
                        </p>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-sm lg:block">
                  <table className="w-full text-left text-sm" style={{ minWidth: "700px" }}>
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Request</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Uploaded</th>
                        <th className="px-4 py-3 text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map((doc) => {
                        const isSelected = doc.id === selectedId;
                        return (
                          <tr
                            key={doc.id}
                            className={`transition hover:bg-slate-50 ${
                              isSelected ? "bg-[#50A9C0]/5" : ""
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(doc.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                <p className="break-words font-semibold text-[#06111f]">
                                  {doc.file_name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {doc.document_type}
                                </p>
                                {doc.required ? (
                                  <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
                                    Required
                                  </p>
                                ) : null}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              <Link
                                href={isSelected ? closeHref() : rowHref(doc.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {doc.clients
                                  ? clientLabel(doc.clients)
                                  : <span className="text-slate-400">—</span>}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5">
                              {doc.request_id ? (
                                <Link
                                  href={`/internal/requests/${doc.request_id}`}
                                  prefetch={false}
                                  className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                                >
                                  {doc.client_requests?.service || "View request"}
                                </Link>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <Link
                                href={isSelected ? closeHref() : rowHref(doc.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                <DocumentStatusBadge>{doc.status}</DocumentStatusBadge>
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-500">
                              <Link
                                href={isSelected ? closeHref() : rowHref(doc.id)}
                                prefetch={false}
                                scroll={false}
                                className="block"
                              >
                                {formatDateTime(doc.uploaded_at)}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isPendingDocument(doc) ? (
                                <span className="text-xs text-slate-400">Pending</span>
                              ) : (
                                <Link
                                  href={`/api/internal/documents/${doc.id}/open`}
                                  prefetch={false}
                                  className="inline-flex rounded-lg bg-[#244285] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:brightness-110"
                                >
                                  Open
                                </Link>
                              )}
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
          {selectedDocument ? (
            <aside className="w-[320px] flex-shrink-0">
              <div className="rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-[#06111f]">
                      {selectedDocument.file_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedDocument.document_type}
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
                    <div className="flex flex-wrap gap-1.5">
                      <DocumentStatusBadge>
                        {selectedDocument.status}
                      </DocumentStatusBadge>
                      {selectedDocument.required ? (
                        <MutedBadge>Required</MutedBadge>
                      ) : null}
                    </div>
                  </div>

                  {/* Client */}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Client
                    </p>
                    <p className="text-sm text-slate-700">
                      {selectedDocument.clients
                        ? clientLabel(selectedDocument.clients)
                        : "Client unavailable"}
                    </p>
                  </div>

                  {/* Linked request */}
                  {selectedDocument.request_id ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Request
                      </p>
                      <Link
                        href={`/internal/requests/${selectedDocument.request_id}`}
                        prefetch={false}
                        className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                      >
                        {selectedDocument.client_requests?.service || "View request"}
                      </Link>
                    </div>
                  ) : null}

                  {/* Timestamps */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Timeline
                    </p>
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>Uploaded {formatDateTime(selectedDocument.uploaded_at)}</p>
                      {selectedDocument.requested_at ? (
                        <p>
                          Requested {formatDateTime(selectedDocument.requested_at)}
                          {selectedDocument.requested_by
                            ? ` by ${selectedDocument.requested_by}`
                            : ""}
                        </p>
                      ) : null}
                      {selectedDocument.reviewed_at ? (
                        <p>
                          Reviewed {formatDateTime(selectedDocument.reviewed_at)}
                          {selectedDocument.reviewed_by
                            ? ` by ${selectedDocument.reviewed_by}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Existing review note */}
                  {selectedDocument.review_note ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Review note
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {selectedDocument.review_note}
                      </p>
                    </div>
                  ) : null}

                  {/* Status update form */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Update status
                    </p>
                    <DocumentStatusForm
                      documentId={selectedDocument.id}
                      currentStatus={selectedDocument.status}
                    />
                  </div>
                </div>

                {/* Open document */}
                {!isPendingDocument(selectedDocument) ? (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <Link
                      href={`/api/internal/documents/${selectedDocument.id}/open`}
                      prefetch={false}
                      className="block w-full rounded-xl bg-[#244285] px-4 py-2.5 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                      Open document
                    </Link>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-center text-xs text-slate-400">
                      Pending client upload
                    </p>
                  </div>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </InternalPage>
  );
}
