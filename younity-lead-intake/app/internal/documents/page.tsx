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
  status: string;
  notes: string | null;
  uploaded_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
  } | null;
  client_requests: {
    service: string | null;
  } | null;
};

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
      "id, request_id, document_type, file_name, status, notes, uploaded_at, clients(full_name, company), client_requests(service)"
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
          <input
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Submitted"
          />
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
                      <Link
                        href={`/api/internal/documents/${document.id}/open`}
                        prefetch={false}
                        className="w-fit rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                      >
                        Open document
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <DocumentStatusBadge>{document.status}</DocumentStatusBadge>
                      <MutedBadge>{formatDateTime(document.uploaded_at)}</MutedBadge>
                    </div>
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
                  <th className="px-4 py-3">Uploaded</th>
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
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {document.notes || "Not available"}
                    </td>
                    <td className="px-4 py-4">
                      <MutedBadge>{formatDateTime(document.uploaded_at)}</MutedBadge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <DocumentStatusForm
                        documentId={document.id}
                        currentStatus={document.status}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/api/internal/documents/${document.id}/open`}
                        prefetch={false}
                        className="inline-flex rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                      >
                        Open document
                      </Link>
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
