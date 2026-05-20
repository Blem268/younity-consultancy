import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackLinks,
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
  status: string;
  notes: string | null;
  uploaded_at: string | null;
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

export default async function ClientDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { requestId } = await searchParams;
  const requestedRequestId = Array.isArray(requestId) ? requestId[0] : requestId;

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
          eyebrow={
            <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
          }
          title="Documents"
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
      .select("id, document_type, file_name, status, notes, uploaded_at, request_id")
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
  const initialRequestId = requests.some(
    (request) => request.id === requestedRequestId
  )
    ? requestedRequestId
    : "";

  return (
    <PortalPage>
      <PageHeader
        title="Documents"
        description="Upload and review documents shared with Younity Consultancy."
      />

      <section className="grid gap-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Upload New Document
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Files are stored securely and linked to your portal profile.
          </p>
          <UploadForm requests={requests} initialRequestId={initialRequestId} />
        </Card>

        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Uploaded Documents
          </h2>

          {documents.length ? (
            <div className="mt-5 divide-y divide-slate-200">
              {documents.map((document) => {
                const relatedRequest = document.request_id
                  ? requestMap.get(document.request_id)
                  : undefined;

                return (
                  <article
                    key={document.id}
                    className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {document.document_type}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {document.file_name}
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
                    <div className="flex flex-col gap-2 text-sm text-slate-600 md:items-end md:text-right">
                      <DocumentStatusBadge status={document.status} />
                      <p>{formatDate(document.uploaded_at)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState title="No documents have been uploaded yet." />
            </div>
          )}
        </Card>
      </section>
    </PortalPage>
  );
}
