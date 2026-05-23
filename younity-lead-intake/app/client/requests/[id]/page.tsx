import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  BackLinks,
  Card,
  DocumentStatusBadge,
  EmptyState,
  getInvoiceStatus,
  InvoiceStatusBadge,
  PageHeader,
  PortalPage,
  RequestStatusBadge,
} from "../../portal-ui";
import { UploadForm } from "../../documents/upload-form";
import { TaskProgress } from "./task-progress";

type ClientProfile = {
  id: string;
};

type ClientRequest = {
  id: string;
  service: string;
  status: string;
  message: string | null;
  source: string | null;
  clickup_task_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ClientUpdate = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
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
};

type ClientInvoice = {
  id: string;
  invoice_number: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
};

type SupabaseLogError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function logSupabaseError(label: string, error: SupabaseLogError | null) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

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

function formatMoney(value: number | null | undefined | "") {
  if (value === null || value === undefined || value === "") {
    return "To Be Reviewed";
  }

  return `XCD ${new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm leading-6 text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function RequestNotFoundState({
  title,
}: {
  title: string;
}) {
  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[
              { href: "/client/dashboard", label: "Back to Dashboard" },
              { href: "/client/requests", label: "Back to Requests" },
            ]}
          />
        }
        title="Request Details"
      />

      <Card className="mt-8">
        <EmptyState title={title} />
      </Card>
    </PortalPage>
  );
}

export default async function ClientRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = typeof id === "string" ? id.trim() : "";

  if (!requestId || !isUuid(requestId)) {
    return (
      <RequestNotFoundState title="Request not found or you do not have access to this request." />
    );
  }

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
    logSupabaseError("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <PortalPage>
        <PageHeader
          eyebrow={
            <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
          }
          title="Request Details"
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

  const { data: request, error: requestError } = await supabase
    .from("client_requests")
    .select(
      "id, service, status, message, source, clickup_task_id, created_at, updated_at"
    )
    .eq("id", requestId)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientRequest>();

  if (requestError) {
    logSupabaseError("Client request lookup failed:", requestError);
    return (
      <RequestNotFoundState title="We could not load this request right now. Please try again or contact Younity Consultancy." />
    );
  }

  if (!request) {
    return (
      <RequestNotFoundState title="Request not found or you do not have access to this request." />
    );
  }

  const [updatesResult, documentsResult, invoicesResult] = await Promise.all([
    supabase
      .from("client_updates")
      .select("id, title, message, created_at")
      .eq("client_id", clientProfile.id)
      .eq("request_id", request.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ClientUpdate[]>(),
    supabase
      .from("client_documents")
      .select(
        "id, document_type, file_name, file_path, status, notes, uploaded_at, requested_at"
      )
      .eq("client_id", clientProfile.id)
      .eq("request_id", request.id)
      .order("uploaded_at", { ascending: false })
      .returns<ClientDocument[]>(),
    supabase
      .from("client_invoices")
      .select("id, invoice_number, amount, status, due_date")
      .eq("client_id", clientProfile.id)
      .eq("request_id", request.id)
      .order("created_at", { ascending: false })
      .returns<ClientInvoice[]>(),
  ]);

  if (updatesResult.error) {
    logSupabaseError("Request updates lookup failed:", updatesResult.error);
  }

  if (documentsResult.error) {
    logSupabaseError("Request documents lookup failed:", documentsResult.error);
  }

  if (invoicesResult.error) {
    logSupabaseError("Request invoices lookup failed:", invoicesResult.error);
  }

  const updates = updatesResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const documentsNeeded = documents.filter(isDocumentNeeded);
  const uploadedDocuments = documents.filter(
    (document) => document.status !== "Requested" || isRealUploadedDocument(document)
  );

  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[
              { href: "/client/dashboard", label: "Back to Dashboard" },
              { href: "/client/requests", label: "Back to Requests" },
            ]}
          />
        }
        title={request.service}
        description={<RequestStatusBadge status={request.status} />}
      />

      <section className="grid gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Request Details
          </h2>
          <dl className="mt-4">
            <DetailRow label="Service" value={request.service} />
            <DetailRow
              label="Status"
              value={<RequestStatusBadge status={request.status} />}
            />
            <DetailRow
              label="Message"
              value={request.message || "Not provided"}
            />
            <DetailRow label="Source" value={request.source || "Not provided"} />
            <DetailRow
              label="Created Date"
              value={formatDate(request.created_at)}
            />
            <DetailRow
              label="Last Updated"
              value={formatDate(request.updated_at)}
            />
            {request.clickup_task_id ? (
              <DetailRow label="ClickUp Task ID" value={request.clickup_task_id} />
            ) : null}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Work Progress
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Track the operational tasks connected to this request. Click a
              task item to submit notes, upload documents, or mark it complete.
            </p>
            <TaskProgress requestId={request.id} />
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Recent Updates
            </h2>

            {updates.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {updates.map((update) => (
                  <article
                    key={update.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-sm font-semibold text-slate-950">
                        {update.title}
                      </h3>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        {formatDate(update.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {update.message}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState title="No recent updates yet." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Documents Needed
            </h2>

            {documentsNeeded.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {documentsNeeded.map((document) => (
                  <article key={document.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {document.document_type}
                      </p>
                      <DocumentStatusBadge status={document.status} />
                    </div>
                    {document.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {document.notes}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Requested {formatDate(document.requested_at)}
                    </p>
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <UploadForm
                        requests={[
                          {
                            id: request.id,
                            service: request.service,
                            status: request.status,
                          },
                        ]}
                        fixedRequestId={request.id}
                        documentRequestId={document.id}
                        initialDocumentType={document.document_type}
                        lockDocumentType
                        compact
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState title="No requested documents are outstanding for this request." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Upload Additional Document
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Supporting files are stored securely and linked directly to this
              request.
            </p>
            <UploadForm
              requests={[{ id: request.id, service: request.service, status: request.status }]}
              fixedRequestId={request.id}
              compact
            />
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Uploaded Documents
            </h2>

            {uploadedDocuments.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {uploadedDocuments.map((document) => (
                  <article
                    key={document.id}
                    className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {document.document_type}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {document.file_name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-slate-600 sm:items-end sm:text-right">
                      <DocumentStatusBadge status={document.status} />
                      <p>{formatDate(document.uploaded_at)}</p>
                      {isRealUploadedDocument(document) ? (
                        <Link
                          href={`/api/client/documents/${document.id}/open`}
                          prefetch={false}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#244285] transition hover:text-[#06111f]"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState title="No documents have been uploaded for this request yet." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Related Invoices
            </h2>

            {invoices.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {invoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice.status);

                  return (
                    <article
                      key={invoice.id}
                      className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {invoice.invoice_number || "Invoice number pending"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Due: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:items-end sm:text-right">
                        <p>{formatMoney(invoice.amount)}</p>
                        <InvoiceStatusBadge status={status} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState title="No invoices are available for this request yet." />
              </div>
            )}
          </Card>
        </div>
      </section>
    </PortalPage>
  );
}
