import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import {
  clientRequestDetailSelectWithPriority,
  clientRequestDetailSelectWithoutPriority,
  isMissingPriorityColumnError,
} from "@/lib/internal/clientRequestSelect";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestDocumentForm } from "./request-document-form";
import { RequestStatusForm } from "./request-status-form";
import { DocumentStatusForm } from "../../documents/document-status-form";
import {
  AccessDenied,
  AdminCard,
  DocumentStatusBadge,
  EmptyCard,
  formatDateTime,
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
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
  clients: {
    id: string;
    full_name: string | null;
    email: string | null;
    company: string | null;
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
  const requestResultWithPriority = await supabaseAdmin
    .from("client_requests")
    .select(clientRequestDetailSelectWithPriority)
    .eq("id", requestId)
    .maybeSingle<RequestRecord>();

  const requestResult =
    requestResultWithPriority.error &&
    isMissingPriorityColumnError(requestResultWithPriority.error)
      ? await supabaseAdmin
          .from("client_requests")
          .select(clientRequestDetailSelectWithoutPriority)
          .eq("id", requestId)
          .maybeSingle<RequestRecord>()
      : requestResultWithPriority;

  if (requestResult.error) {
    logInternalQueryError("Internal request detail", requestResult.error);
  }

  const request = requestResult.data
    ? {
        ...requestResult.data,
        priority: requestResult.data.priority ?? null,
      }
    : null;

  if (!request && requestResult.error) {
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
          <EmptyCard>
            This request could not be loaded. Check the server logs or confirm your
            Supabase connection.
          </EmptyCard>
        </section>
      </InternalPage>
    );
  }

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

  const [documentsResult, updatesResult] = await Promise.all([
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
  ]);

  if (documentsResult.error) {
    logInternalQueryError("Internal request documents", documentsResult.error);
  }

  if (updatesResult.error) {
    logInternalQueryError("Internal request updates", updatesResult.error);
  }

  const documents = documentsResult.data ?? [];
  const updates = updatesResult.data ?? [];
  const documentsRequested = documents.filter(isDocumentNeeded);
  const uploadedDocuments = documents.filter(
    (document) => document.status !== "Requested" || isRealUploadedDocument(document)
  );

  return (
    <InternalPage
      active="requests"
      title={request.service}
      description="Client request with documents and timeline."
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
        </>
      }
    >
      <section className="py-8">
        <AdminCard
          title="Request Summary"
          description="Core request details from the client portal."
        >
          <div className="mt-4 border-b border-slate-100 pb-4">
            <RequestStatusForm requestId={request.id} currentStatus={request.status} />
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Priority", request.priority || "Not set"],
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
      </section>

      <section className="pb-8">
        <AdminCard
          title="Request Document"
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
                <div key={document.id} className="py-4">
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
    </InternalPage>
  );
}
