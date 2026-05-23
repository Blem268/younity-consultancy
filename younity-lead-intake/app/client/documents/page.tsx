import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  DocumentStatusBadge,
  EmptyState,
  PageHeader,
  PortalPage,
} from "../portal-ui";
import { UploadForm } from "./upload-form";

type ClientProfile = {
  id: string;
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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <PortalPage>
        <PageHeader
          title="Document Library"
          description={`Signed in as ${user.email}`}
        />

        <Card className="mt-8 border-amber-200 bg-amber-50">
          <p className="text-sm leading-6 text-slate-700">
            Your portal profile has not been set up yet. Please contact Younity
            Consultancy.
          </p>
        </Card>
      </PortalPage>
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
    <PortalPage>
      <PageHeader
        title="Document Library"
        description="Open files submitted through request workflows. Documents are stored privately and access links expire shortly after opening."
      />

      <section className="space-y-6 py-8">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Documents Needed
          </h2>

          {documentsNeeded.length ? (
            <div className="mt-5 divide-y divide-slate-200">
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
                        <p className="text-sm font-semibold text-slate-950">
                          {document.document_type}
                        </p>
                        <DocumentStatusBadge status={document.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {relatedRequest
                          ? `${relatedRequest.service} (${relatedRequest.status})`
                          : document.request_id
                            ? "Request details unavailable"
                            : "General / Not linked to a request"}
                      </p>
                      {document.notes ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {document.notes}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Requested {formatDate(document.requested_at)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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
            <div className="mt-5">
              <EmptyState title="No documents are needed right now." />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Uploaded Documents
          </h2>

          {uploadedDocuments.length ? (
            <div className="mt-5 divide-y divide-slate-200">
              {uploadedDocuments.map((document) => {
                const relatedRequest = document.request_id
                  ? requestMap.get(document.request_id)
                  : undefined;

                return (
                  <article
                    key={document.id}
                    className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1.2fr_0.8fr_0.6fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {document.file_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {document.document_type}
                      </p>
                      {document.notes ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {document.notes}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {relatedRequest
                          ? `${relatedRequest.service} (${relatedRequest.status})`
                          : document.request_id
                            ? `Request ID: ${document.request_id}`
                            : "General / Not linked to a request"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                        Related Request
                      </p>
                      <p className="mt-1 lg:mt-0">
                        {relatedRequest
                          ? `${relatedRequest.service} (${relatedRequest.status})`
                          : document.request_id
                            ? "Request details unavailable"
                            : "Not linked"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-slate-600 lg:items-end lg:text-right">
                      <DocumentStatusBadge status={document.status} />
                      <p>{formatDate(document.uploaded_at)}</p>
                    </div>
                    <div className="lg:text-right">
                      {isRealUploadedDocument(document) ? (
                        <Link
                          href={`/api/client/documents/${document.id}/open`}
                          prefetch={false}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
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
            <div className="mt-5">
              <EmptyState
                title="No documents are available yet."
                description="Files will appear here after they are uploaded from a request."
              />
            </div>
          )}
        </Card>
      </section>
    </PortalPage>
  );
}
