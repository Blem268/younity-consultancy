import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  AdminCard,
  clientLabel,
  DocumentStatusBadge,
  EmptyCard,
  formatDateTime,
  getSearchParam,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  sanitizeSearchParam,
} from "../internal-ui";
import { DocumentStatusForm } from "./document-status-form";

type PageProps = {
  searchParams: Promise<{
    document_type?: string | string[];
    status?: string | string[];
    search?: string | string[];
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

const documentStatusOptions = [
  "Requested",
  "Submitted",
  "Received",
  "Under Review",
  "Approved",
  "Rejected",
  "Needs Replacement",
];

function isPendingDocument(document: DocumentRecord) {
  return document.file_path === "pending" || document.file_name === "Pending upload";
}

export default async function InternalDocumentsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Internal Documents" />;
  }

  const params = await searchParams;
  const documentTypeFilter = sanitizeSearchParam(params.document_type);
  const statusFilter = getSearchParam(params.status).trim();
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
      logInternalQueryError("Internal document client search", clientMatchError);
    }

    matchedClientIds = (clientMatches ?? []).map((client) => client.id);
  }

  let documentsQuery = supabaseAdmin
    .from("client_documents")
    .select(
      "id, request_id, document_type, file_name, file_path, status, notes, uploaded_at, requested_by, requested_at, reviewed_by, reviewed_at, review_note, required, clients(full_name, company), client_requests(service)"
    )
    .order("uploaded_at", { ascending: false })
    .limit(100);

  if (documentTypeFilter) {
    documentsQuery = documentsQuery.ilike("document_type", `%${documentTypeFilter}%`);
  }

  if (statusFilter) {
    documentsQuery = documentsQuery.eq("status", statusFilter);
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
    logInternalQueryError("Internal documents lookup", documentsError);
  }

  const documents = documentsData ?? [];

  return (
    <InternalPage
      active="documents"
      title="Internal Documents"
      description="Review uploaded client document metadata and open files through short-lived admin signed URLs."
    >
      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_0.8fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Document Type
          <input
            name="document_type"
            defaultValue={documentTypeFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Passport, invoice..."
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Status
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          >
            <option value="">Any status</option>
            {documentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Client Search
          <input
            name="search"
            defaultValue={search}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Client, company, email, or file"
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
        {documentsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              Documents are unavailable right now.
            </p>
          </div>
        ) : documents.length ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600">
              Showing {documents.length} document{documents.length === 1 ? "" : "s"}.
            </p>
            <div className="grid gap-4 xl:hidden">
              {documents.map((document) => (
                <AdminCard key={document.id}>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="break-words font-semibold text-slate-950">
                          {document.file_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {document.document_type}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {document.clients
                            ? clientLabel(document.clients)
                            : "Client unavailable"}
                        </p>
                      </div>
                      {isPendingDocument(document) ? null : (
                        <Link
                          href={`/api/internal/documents/${document.id}/open`}
                          prefetch={false}
                          className="w-fit rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                        >
                          Open document
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <DocumentStatusBadge>{document.status}</DocumentStatusBadge>
                      {document.required ? <MutedBadge>Required</MutedBadge> : null}
                      <MutedBadge>{formatDateTime(document.uploaded_at)}</MutedBadge>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>Requested: {formatDateTime(document.requested_at)}</p>
                      <p>By: {document.requested_by || "Not available"}</p>
                      <p>Reviewed: {formatDateTime(document.reviewed_at)}</p>
                      <p>By: {document.reviewed_by || "Not available"}</p>
                    </div>
                    {document.review_note ? (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        Review note: {document.review_note}
                      </p>
                    ) : null}
                    {document.request_id ? (
                      <Link
                        href={`/internal/requests/${document.request_id}`}
                        className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
                      >
                        {document.client_requests?.service || "View related request"}
                      </Link>
                    ) : (
                      <p className="text-sm text-slate-600">No request linked</p>
                    )}
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <DocumentStatusForm
                        documentId={document.id}
                        currentStatus={document.status}
                      />
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm xl:block">
              <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="border-b border-teal-900/10 bg-teal-50/70 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Request/Review</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-4">
                      <p className="break-words font-semibold text-slate-950">
                        {document.file_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {document.document_type}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {document.clients ? clientLabel(document.clients) : "Client unavailable"}
                    </td>
                    <td className="px-4 py-4">
                      {document.request_id ? (
                        <Link
                          href={`/internal/requests/${document.request_id}`}
                          className="font-semibold text-teal-700 transition hover:text-teal-900"
                        >
                          {document.client_requests?.service || document.request_id}
                        </Link>
                      ) : (
                        <span className="text-slate-600">No request linked</span>
                      )}
                      {document.request_id ? (
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {document.request_id}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <DocumentStatusBadge>{document.status}</DocumentStatusBadge>
                      {document.required ? (
                        <div className="mt-2">
                          <MutedBadge>Required</MutedBadge>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {document.notes || "Not available"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <p>Uploaded: {formatDateTime(document.uploaded_at)}</p>
                      <p className="mt-2">Requested: {formatDateTime(document.requested_at)}</p>
                      <p className="mt-1">By: {document.requested_by || "Not available"}</p>
                      <p className="mt-2">Reviewed: {formatDateTime(document.reviewed_at)}</p>
                      <p className="mt-1">By: {document.reviewed_by || "Not available"}</p>
                      {document.review_note ? (
                        <p className="mt-2 whitespace-pre-wrap">
                          Note: {document.review_note}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <DocumentStatusForm
                        documentId={document.id}
                        currentStatus={document.status}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      {isPendingDocument(document) ? (
                        <span className="text-sm font-medium text-slate-500">
                          Pending upload
                        </span>
                      ) : (
                        <Link
                          href={`/api/internal/documents/${document.id}/open`}
                          prefetch={false}
                          className="inline-flex rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                        >
                          Open document
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <EmptyCard>
            No documents found for the selected filters. Private files remain
            accessible only through the admin open route.
          </EmptyCard>
        )}
      </section>
    </InternalPage>
  );
}
