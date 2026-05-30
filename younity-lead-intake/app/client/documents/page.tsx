import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { friendlyPortalText } from "@/lib/client/portal-text";
import { PortalClientHeader } from "../portal-client-header";
import { DocumentStatusBadge } from "@/app/components/ui/status-badges";
import { UploadForm } from "./upload-form";
import { brand } from "@/app/components/ui/brand";

const SECTION_CARD =
  "rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4 sm:p-5";
const SECTION_HEADING = "text-[14px] font-medium text-[#06111f]";

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#50A9C0]/30 bg-[#50A9C0]/10 p-6">
      <p className="text-sm font-medium text-slate-950">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

type ClientProfile = {
  id: string;
  full_name: string;
};

type ClientDocument = {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  notes: string | null;
  uploaded_at: string | null;
  requested_at: string | null;
  request_id: string | null;
};

type ClientRequest = {
  id: string;
  service: string;
  status: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isDocumentNeeded(document: ClientDocument) {
  return (
    document.status === "Requested" ||
    document.status === "Needs Replacement" ||
    document.file_path === "pending" ||
    document.file_name === "Pending upload"
  );
}

function isRealUploadedDocument(document: ClientDocument) {
  return document.file_path !== "pending" && document.file_name !== "Pending upload";
}

export default async function ClientDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <div className="doc-list flex min-h-screen flex-col">
        <PortalClientHeader />
        <div className={`${brand.pageBackground} flex-1 p-6`}>
          <div className="mx-auto w-full max-w-6xl">
            <section className={`${SECTION_CARD} mt-6 border-amber-200 bg-amber-50`}>
              <EmptyState
                title="Portal profile pending"
                description={`Signed in as ${user.email}. Please contact Younity Consultancy.`}
              />
            </section>
          </div>
        </div>
      </div>
    );
  }

  const [documentsResult, requestsResult] = await Promise.all([
    supabase
      .from("client_documents")
      .select(
        "id, document_type, file_name, file_path, status, notes, uploaded_at, requested_at, request_id"
      )
      .eq("client_id", clientProfile.id)
      .order("uploaded_at", { ascending: false })
      .returns<ClientDocument[]>(),
    supabase
      .from("client_requests")
      .select("id, service, status")
      .eq("client_id", clientProfile.id)
      .order("created_at", { ascending: false })
      .returns<ClientRequest[]>(),
  ]);

  if (documentsResult.error) {
    console.error("Client documents lookup failed:", documentsResult.error);
  }

  if (requestsResult.error) {
    console.error("Client requests lookup failed:", requestsResult.error);
  }

  const documents = documentsResult.data ?? [];
  const requests = requestsResult.data ?? [];
  const requestMap = new Map(requests.map((request) => [request.id, request]));
  const documentsNeeded = documents.filter(isDocumentNeeded);
  const uploadedDocuments = documents.filter(
    (document) => document.status !== "Requested" || isRealUploadedDocument(document)
  );

  return (
    <div className="doc-list flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <nav
            className="doc-fade-up text-[12px] text-slate-500"
            style={{ animationDelay: "0ms" }}
            aria-label="Breadcrumb"
          >
            <Link
              href="/client/dashboard"
              prefetch={false}
              className="action-link text-[#244285] hover:text-[#06111f]"
            >
              ← Dashboard
            </Link>
          </nav>

          <div className="doc-fade-up" style={{ animationDelay: "0ms" }}>
            <h1 className="text-[20px] font-medium tracking-tight text-[#06111f]">
              Documents
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Open files submitted through request workflows. Access links expire
              shortly after opening.
            </p>
          </div>

          <section
            className={`${SECTION_CARD} doc-fade-up`}
            style={{ animationDelay: "60ms" }}
          >
            <h2 className={SECTION_HEADING}>Documents needed</h2>

            {documentsNeeded.length ? (
              <div className="mt-4 divide-y divide-[#06111f]/8">
                {documentsNeeded.map((document) => {
                  const relatedRequest = document.request_id
                    ? requestMap.get(document.request_id)
                    : undefined;

                  return (
                    <article
                      key={document.id}
                      className="grid gap-5 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1fr_0.9fr]"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-[#06111f]">
                            {friendlyPortalText(document.document_type)}
                          </p>
                          <DocumentStatusBadge status={document.status} />
                        </div>
                        {relatedRequest ? (
                          <p className="mt-2 text-[11.5px] text-slate-500">
                            {friendlyPortalText(relatedRequest.service)}
                          </p>
                        ) : document.request_id ? (
                          <p className="mt-2 text-[11.5px] text-slate-500">
                            Request details unavailable
                          </p>
                        ) : (
                          <p className="mt-2 text-[11.5px] text-slate-500">
                            Not linked to a request
                          </p>
                        )}
                        {document.notes ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {document.notes}
                          </p>
                        ) : null}
                        <p className="mt-3 text-[11.5px] text-slate-500">
                          Requested {formatDate(document.requested_at)}
                        </p>
                      </div>
                      <div className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-[#f6f9fc] p-4">
                        <UploadForm
                          requests={relatedRequest ? [relatedRequest] : requests}
                          fixedRequestId={document.request_id || undefined}
                          documentRequestId={document.id}
                          initialDocumentType={document.document_type}
                          lockDocumentType
                          compact
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No documents are needed right now." />
              </div>
            )}
          </section>

          <section
            className={`${SECTION_CARD} doc-fade-up`}
            style={{ animationDelay: "120ms" }}
          >
            <h2 className={SECTION_HEADING}>Uploaded documents</h2>

            {uploadedDocuments.length ? (
              <div className="mt-4 divide-y divide-[#06111f]/8">
                {uploadedDocuments.map((document) => {
                  const relatedRequest = document.request_id
                    ? requestMap.get(document.request_id)
                    : undefined;

                  return (
                    <article
                      key={document.id}
                      className="doc-row flex items-center gap-4 rounded-lg px-2 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#06111f]">
                          {document.file_name}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-slate-500">
                          {friendlyPortalText(document.document_type)}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-slate-500">
                          {relatedRequest
                            ? friendlyPortalText(relatedRequest.service)
                            : document.request_id
                              ? "Request details unavailable"
                              : "Not linked to a request"}
                        </p>
                        {document.notes ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {document.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 text-[11.5px] text-slate-500">
                        <DocumentStatusBadge status={document.status} />
                        <p>{formatDate(document.uploaded_at)}</p>
                        {isRealUploadedDocument(document) ? (
                          <Link
                            href={`/api/client/documents/${document.id}/open`}
                            prefetch={false}
                            target="_blank"
                            rel="noreferrer"
                            className="action-link text-sm font-medium text-[#244285] hover:text-[#06111f]"
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No documents are available yet."
                  description="Files will appear here after they are uploaded from a request."
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
